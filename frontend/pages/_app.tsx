import type { AppProps } from "next/app"
import { SessionProvider } from "next-auth/react"
import { IntlStateProvider } from "config/locale";
import { ChatStateProvider } from "lib/chatstate";
import ChatLayout from "components/chatlayout";

import '../styles/global.css';


const ChatApp = ({ Component, pageProps }: AppProps) => {
  return (
    
    <SessionProvider session={pageProps.session}>
      <IntlStateProvider>
      {pageProps.session ? 
        <ChatStateProvider> 
          <ChatLayout>
            <Component {...pageProps} />
          </ChatLayout>
        </ChatStateProvider>
        :
        <Component {...pageProps} />
      }
      </IntlStateProvider>
    </SessionProvider>
  );
}

export default ChatApp;