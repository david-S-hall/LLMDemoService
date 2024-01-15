import { createContext, useContext, useState, useRef } from 'react';
import { message, theme as antdThemes } from 'antd';
import { useSession } from 'next-auth/react';


const themeDict = {
    light: {
        algorithm: antdThemes.defaultAlgorithm,
        token: {
            colorBgUserMsg: '#87d068',
            colorBgLLMMsg: '#ffffff',
            colorBgLayout: '#f1f1f1',
            colorPrimary: '#4091ff',
            colorPrimaryActive: '#004fd0',
            colorPrimaryBorderHover: '#ffffff',
        },
        components: {
            Layout: {
                headerBg: '#fafafa',
                colorText: '#000000'
            },
            Modal: {
                fontSize: 18,
                titleFontSize: 16,
            },
            Input: {
                fontSize: '.9rem',
                activeBorderColor: '#ffffff',
                hoverBorderColor: '#555555',
            },
        }
    },
    dark: {
        algorithm: antdThemes.darkAlgorithm,
        token: {
            colorBgUserMsg: '#275f08', //#8fad8f
            colorBgLLMMsg: '#7f7f7f',
            colorBgLayout: '#333341',
            colorBgContainer: '#555563',
            colorPrimary: '#4091ff',
            colorPrimaryActive: '#004fd0',
            colorPrimaryBg: '#6a6a6a',
            colorPrimaryBorderHover: '#ffffff',
            colorBgElevated: '#333341',
            colorText: 'rgba(255, 255, 255, 0.88)',
        },
        components: {
            Layout: {
                headerBg: '#333341',
                colorText: '#ffffff'
            },
            Modal: {
                fontSize: 18,
            },
            Input: {
                fontSize: '.9rem', //16
                activeBorderColor: '#ffffff',
                hoverBorderColor: '#555555',
            }
        }
    }
}

const ChatContext = createContext();

export const ChatStateProvider = ({ children }) => {
    const { data: session } = useSession();

    const [chatHistory, setChatHistory] = useState([]);
    const [chatList, setChatList] = useState([]);
    const [curChatID, setCurChatID] = useState('');
    const [loading, setLoading] = useState(false);
    const [userInput, setUserInput] = useState('');

    const containerRef = useRef(null);
    const [notiApi, notiContextHolder] = message.useMessage({
        top: 70,
        duration: 2,
        maxCount: 5
    });

    const [theme, setTheme] = useState(session?.user.theme ? session?.user.theme : 'light');
    const themeList = Object.entries(themeDict).map(([key, value]) => key)
    const switchTheme = ( themeText ) => {if ( themeList.includes(themeText) ) setTheme(themeText); }
    const getTheme = ( themeText ) => { return themeDict[themeText ? themeText : theme]; }
    return (
        <ChatContext.Provider value={{
            loading,
            setLoading,
            userInput,
            setUserInput,
            curChatID,
            setCurChatID,
            chatHistory,
            setChatHistory,
            chatList,
            setChatList,
            containerRef,
            notiApi,
            notiContextHolder,
            theme,
            themeList,
            switchTheme,
            getTheme,
            }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatState() {
    return useContext(ChatContext);
}
