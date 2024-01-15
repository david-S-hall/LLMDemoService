import { useRouter } from 'next/router'
import { useEffect } from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from 'pages/api/auth/[...nextauth]';

import { useChatState } from 'lib/chatstate';


export async function getServerSideProps ( ctx ) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  return {
    props: { session }
  }
}

export default function Home({ session }) {
  const chatState = useChatState();
  const router = useRouter();

  const startupChat = async () => {
    const response = await fetch('/api/chat/create_chat');
    const data = await response.json();
    chatState.setChatList([data, ...chatState.chatList])
    router.push('/chat/'+data.chat_id);
  }

  useEffect(() => {
    chatState.setChatHistory([]);
    chatState.setChatList(session.user.chat_list);
    chatState.setCurChatID('');
    chatState.setLoading(false);
    chatState.setUserInput('');
  }, [])

  useEffect(() => {
    if ( chatState.loading ) {
      startupChat();
    }
  }, [chatState.loading])

  return (
    <>
    </>
  );
}
