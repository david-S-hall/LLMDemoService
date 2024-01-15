import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { EllipsisOutlined, DeleteOutlined, HighlightOutlined } from '@ant-design/icons';
import { ConfigProvider, theme } from 'antd';
import { Flex, Typography, Dropdown, Modal } from 'antd';
import { Menu } from 'antd';
import { CSSTransition } from 'react-transition-group';

import { useIntlState } from 'config/locale';
import { useChatState } from 'lib/chatstate';

const { Text } = Typography;
import styles from 'styles/chatlist.module.css';


const ChatItem = ({ chat_id, chat_name, chat_index }) => {
    const router = useRouter();
    const itemRef = useRef(null);
    const deleteTimeout = 500;

    const chatState = useChatState();
    const intlState = useIntlState();

    const [nameEditing, setNameEditing] = useState(false);
    const [curChatName, setCurChatName] = useState(chat_name);
    const [isAlive, setIsAlive] = useState(true);
    const [isActive, setIsActive] = useState(false);

    const { useToken } = theme;
    const themeToken = useToken().token;

    const onActive = (e) => {
      chatState.setCurChatID(chat_id);
      router.push('/chat/'+chat_id);
    }

    const onRename = async ( renameText ) => {
        const response = await fetch(`/api/user/chat?chat_id=${chat_id}&action=rename&name=${renameText}`)
            .then((response) => response.json())
            .then((data) => data);

        if ( chatState.chatList[chat_index].chat_id === chat_id ) {
            let curChatList = chatState.chatList;
            curChatList[chat_index].summary = renameText;
            chatState.setChatList(curChatList);
        }
        setCurChatName(renameText);
        setNameEditing(false);
    }

    const onDelete = async () => {
        const response = await fetch(`/api/user/chat?chat_id=${chat_id}&action=delete`)
            .then((response) => response.json())
            .then((data) => data);

        setIsAlive(false);

        setTimeout(() => {
            const deleteChat = { chat_id: chat_id, summary: chat_name };
        
            chatState.setChatList(chatState.chatList.filter(
                (item) => JSON.stringify(item) !== JSON.stringify(deleteChat))
            );
            if ( chatState.curChatID === chat_id ) {
                chatState.setCurChatID('');
                router.push('/');
            }
        }, deleteTimeout)
    }

    const ChatRenameButton = ({}) => {
        return (
            <Flex gap='small' onClick={ (e) => {setNameEditing(true); } }>
                <HighlightOutlined />{intlState.intl.formatMessage({id: 'chat.rename'})}
            </Flex>
        )
    }

    const ChatDeleteButton = ({ onDelete }) => {
        const [isModalOpen, setIsModalOpen] = useState(false);
        const toggleModal = () => { setIsModalOpen(!isModalOpen); };

        return (
            <>
            <Flex gap='small' onClick={ (e) => {setIsModalOpen(true)} } >
                <DeleteOutlined />{intlState.intl.formatMessage({id: 'chat.delete'})}
            </Flex>
            <ConfigProvider theme={chatState.getTheme()}>
            <Modal 
                title={<Text ellipsis style={{width: "90%"}}>{intlState.intl.formatMessage({id: 'chat.delete.modal_title'})+`\t\`${chat_name}\` ?`}</Text>}
                centered
                open={isModalOpen}
                onCancel={toggleModal}
                onOk={() => {toggleModal(); onDelete();}}>
            </Modal>
            </ConfigProvider>
            </>
        )
    }

    const items = [
        { key: 'rename', label: <ChatRenameButton onRename={onRename}/> },
        { key: 'delete', label: <ChatDeleteButton onDelete={onDelete}/> }
    ]

    return (
        <CSSTransition
            in={isAlive}
            appear
            nodeRef={itemRef}
            classNames={{
                appear: styles['chatListItem-enter-done'],
                appearActive: styles['chatListItem-enter-done'],
                appearDone: styles['chatListItem-enter-done'],
                enter: styles['chatListItem-enter'],
                enterActive: styles['chatListItem-enter-active'],
                enterDone: styles['chatListItem-enter-done'],
                exit: styles['chatListItem-exit'],
                exitActive: styles['chatListItem-exit-active'],
                exitDone: styles['chatListItem-exit-done']
            }}
            timeout={deleteTimeout}
            >
        <Flex 
            gap='small'
            align='center'
            ref={itemRef}
            onMouseOver={() => setIsActive(true)}
            onMouseLeave={() => setIsActive(false)}>
            <Text
                onClick={ onActive }
                className={ styles.chatName }
                style={{ ...(nameEditing? {paddingTop: '.8rem'}: {} ), overflow: 'hidden', flex: '1 1 0', mask: nameEditing ? '' : 'linear-gradient(to right, #fff 85%, transparent)' }}
                editable={{
                    editing: nameEditing,
                    triggerType: [],
                    enterIcon: null,
                    maxLength: 20,
                    onChange: onRename,
                    onCancel: () => setNameEditing(false),
                    // onEnd: onRename,
                }}
                >
                {curChatName.substring(0, 21)}
            </Text>
            <Dropdown placement='bottom' menu={{ items }} overlayStyle={{ border: '1px solid #6f6f6f', borderRadius: '9px' }}>
                <EllipsisOutlined style={{ display: isActive && !nameEditing ? 'block': 'none', fontSize: '1rem', strokeWidth: "60", stroke: themeToken.colorIconHover }} />
            </Dropdown>
        </Flex>
        </CSSTransition>
    )
}

 
export default function ChatList() {
    const chatState = useChatState();
    
    const items = [
        ...chatState.chatList.map((single_chat, index) => {
            return {
                label: <ChatItem chat_id={single_chat.chat_id} chat_name={single_chat.summary} chat_index={index}/>,
                key: single_chat.chat_id,
                className: styles.chatListItem
            }
        })
    ]

    return (
        <Menu mode="inline"
              theme="dark"
              key='test'
              className={ styles.chatList }
              items={ items }
              inlineIndent={10}
              selectedKeys={ chatState.curChatID === '' ? [] : [chatState.curChatID] } />
    )
}