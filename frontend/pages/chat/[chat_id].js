import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getServerSession } from "next-auth/next";
import { authOptions } from 'pages/api/auth/[...nextauth]';

import ScrollPane from 'components/scrollpane';
import ChatMessage from 'components/chatmessage';
import { useChatState } from 'components/chatstate';

import { SSE } from "lib/sse";
import { getAPIRoutes } from 'lib/config';


export async function getServerSideProps( ctx ) {
  const APIRoutes = getAPIRoutes();
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  
  const chat_id = ctx.params.chat_id;
  const user_id = session ? session.user.id : '' ;

  const chatInfo = await fetch(APIRoutes.get_chat_info+'?user_id='+user_id+'&chat_id='+chat_id, {
    method: 'GET'
  })
  .then((response) => response.json())
  .then((data) => data)

  return {
    props: {
      session,
      chatInfo,
      APIRoutes
    },
  };
}

export default function Chat ({ APIRoutes, chatInfo, session }) {
  const router = useRouter();
  const chatState = useChatState();
  const { chat_id } = router.query;
  const user_id = session ? session.user.id : '';

  let getChatResponse = async () => {
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
    }
    chatState.setChatHistory([...curHistory, userMsg, llmMsg]);

    let source = new SSE(APIRoutes.stream_chat, {
      method: 'POST',
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      payload: JSON.stringify({ "query": query, "chat_id": chat_id })
    });

    source.addEventListener("stream_chat", (e) => {
      if (e.data != "[DONE]") {
        let data = JSON.parse(e.data);
        llmMsg.texts = data.texts;
      } else {
        chatState.setUserInput('');
        chatState.setLoading(false);
        source.close();
      }
      chatState.setChatHistory([...curHistory, userMsg, llmMsg]);
    });
    source.stream();
  }

  const uploadFeedback = async ( payload ) => {
    const response = await fetch(APIRoutes.feedback,
      {
        method: 'POST',
        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    const data = await response.json();
    if (data.status === 200) {
      chatState.notiApi.open({type: 'success', content: "反馈成功"})
    } else {
      chatState.notiApi.open({type: 'error', content: "反馈失败"})
    }
  }

  const updateChat = async () => {
    const profile = await fetch(APIRoutes.user_profile+'?user_id='+user_id+'&action=fetch')
                .then((response) => response.json())
                .then((data) => data)
    chatState.setChatList(profile.chat_list)
  }

  useEffect(() => {
    chatState.setCurChatID(chat_id);
  }, []);

  useEffect(() => {
    if (chatInfo.status === -1) {
      chatState.notiApi.open({ type: 'error', content: "Invalid Chat "+chat_id });
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
