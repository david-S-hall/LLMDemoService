import { useRouter } from 'next/router'
import { useEffect } from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from 'pages/api/auth/[...nextauth]';

import { useChatState } from 'components/chatstate';
import { getAPIRoutes } from 'lib/config';


export async function getServerSideProps ( ctx ) {
  const APIRoutes = getAPIRoutes();
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  return {
    props: { APIRoutes, session, }
  }
}

export default function Home({ APIRoutes, session }) {
  const chatState = useChatState();
  const router = useRouter();
  const user_id = session ? session.user.id : '';

  const startupChat = async () => {
    const response = await fetch(APIRoutes.startup_chat+'?user_id='+user_id);
    const data = await response.json();
    chatState.setChatList([data, ...chatState.chatList])
    router.push('/chat/'+data.chat_id);
  }

  useEffect(() => {
    chatState.setCurChatID('');
    chatState.setChatList(session.user.chat_list);
    chatState.setUserInput('');
    chatState.setLoading(false);
    chatState.setChatHistory([]);
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
