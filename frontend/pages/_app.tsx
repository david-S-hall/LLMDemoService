import { SessionProvider } from "next-auth/react"
import type { AppProps } from "next/app"

import ChatLayout from "components/chatlayout";
import { ChatStateProvider } from "components/chatstate";

import '../styles/global.css';


const ChatApp = ({ Component, pageProps }: AppProps) => {
  return (
    <SessionProvider session={pageProps.session}>
      {pageProps.session ? 
      <ChatStateProvider> 
        <ChatLayout>
          <Component {...pageProps} />
        </ChatLayout>
      </ChatStateProvider>
      :
      <Component {...pageProps} />
      }
    </SessionProvider>
  );
}

export default ChatApp;