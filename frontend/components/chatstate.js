import { createContext, useContext, useState, useRef } from 'react';
import { message } from 'antd';


const ChatContext = createContext();

export const ChatStateProvider = ({ children }) => {
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
            notiContextHolder
            }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatState() {
    return useContext(ChatContext);
}
