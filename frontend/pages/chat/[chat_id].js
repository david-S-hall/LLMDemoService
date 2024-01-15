import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getServerSession } from "next-auth/next";
import { authOptions } from 'pages/api/auth/[...nextauth]';

import ScrollPane from 'components/scrollpane';
import ChatMessage from 'components/chatmessage';
import { useChatState } from 'lib/chatstate';

import { SSE } from "lib/sse";
import { getAPIRoutes } from 'lib/config';
import { useIntlState } from 'config/locale';


export async function getServerSideProps( ctx ) {
  const APIRoutes = getAPIRoutes();
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  
  const chat_id = ctx.params.chat_id;
  const user_id = session ? session.user.id : '' ;

  const chatInfo = await fetch(APIRoutes.get_chat_info+'?user_id='+user_id+'&chat_id='+chat_id)
  .then((response) => response.json())
  .then((data) => data)

  return {
    props: {
      session,
      chatInfo
    },
  };
}

export default function Chat ({ chatInfo, session }) {
  const router = useRouter();
  const chatState = useChatState();
  const intlState = useIntlState();
  const { chat_id } = router.query;

  const getChatResponse = async () => {
    const curHistory = chatState.chatHistory;
    const query = chatState.userInput;

    if ( query.trim().length === 0 ) {
      chatState.setLoading(false);
      return null;
    }

    let userMsg = {
      role: 'user',
      chat_id: chat_id,
      turn_idx: curHistory.length,
      texts: query.split('\n'),
    }
    let llmMsg = {
      role: 'assistant',
      chat_id: chat_id,
      turn_idx: curHistory.length,
      texts: '',
      loading: true,
    }
    chatState.setChatHistory([...curHistory, userMsg, llmMsg]);

    let source = new SSE(`/api/chat/${chat_id}?action=stream`, {
      method: 'POST',
      headers: { accept: 'text/event-stream', 'Content-Type': 'application/json' },
      payload: JSON.stringify({ "query": query })
    });

    source.addEventListener("stream_chat", (e) => {
      if (e.data != "[DONE]") {
        const data = JSON.parse(e.data);
        llmMsg.texts = llmMsg.texts + data.texts;
      } else {
        llmMsg.loading = false;
        chatState.setUserInput('');
        chatState.setLoading(false);
        source.close();
      }
      setTimeout(() => {chatState.setChatHistory([...curHistory, userMsg, llmMsg]);}, 100)
    });
    
    source.stream();
  }

  const uploadFeedback = async ( payload ) => {
    const response = await fetch(`/api/chat/${chat_id}?action=feedback`,
      {
        method: 'POST',
        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    const data = await response.json();
    if (data.status === 200) {
      chatState.notiApi.open({type: 'success', content: intlState.intl.formatMessage({id: 'chat.feedback.successMsg'})})
    } else {
      chatState.notiApi.open({type: 'error', content: intlState.intl.formatMessage({id: 'chat.feedback.failedMsg'})})
    }
  }

  const updateChat = async () => {
    const profile = await fetch('/api/user/profile')
                .then((response) => response.json())
                .then((data) => data)
    chatState.setChatList(profile.chat_list)
  }

  useEffect(() => {
    chatState.setCurChatID(chat_id);
  }, []);

  useEffect(() => {
    if (chatInfo.status === -1) {
      chatState.notiApi.open({ type: 'error', content: intlState.intl.formatMessage({id: 'chat.feedback.successMsg'})}+`: ${chat_id}` );
      router.push('/');
    } else {
      chatState.setChatHistory(chatInfo.history);
    }
  }, [chatInfo]);

  useEffect(() => {
    if ( chatState.loading ) {
      getChatResponse();
    } else{
      updateChat();
    }
  }, [chatState.loading])

  return (
    <ScrollPane parentRef={chatState.containerRef} scrollList={chatState.chatHistory}>
      {...chatState.chatHistory.map(
        (single_record) => 
        (<ChatMessage
          {...single_record}
          chat_id={chat_id}
          key={single_record.role+'_'+chat_id+'_'+single_record.turn_idx}
          onFeedback={uploadFeedback}/>)
      )}
    </ScrollPane>
  )
}
