import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { LeftOutlined, RightOutlined, CaretRightOutlined } from '@ant-design/icons';
import { Button, Layout, Space, Menu, Flex } from 'antd';

import UserPane from 'components/userpane';
import { useChatState } from 'components/chatstate';

const { Sider } = Layout;


const SideBarButton = ({ text, onClick, icon }) => {
    return (
        <Button type='text'
                block='true'
                onClick={onClick}
                icon={icon}
                style={{ textAlign: 'left' }}>{text}
        </Button>
    )
}

const CollapseButton = ({ distance, collapsed, onClick, style }) => {
    style.left = '0';
    style.width= '20px';
    style.zIndex = '40';
    style.position = 'fixed';
    style.transform = 'translateX('+distance+'px)';
    return (
        <Button type='text'
                size='large'
                onClick={onClick}
                style={style}
                icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
        />
    )
}

CollapseButton.defaultProps = {
    style: {}
};

const ChatList = ({ }) => {

    const chatState = useChatState();
    const router = useRouter();

    const items = [
        ...chatState.chatList.map((single_chat) => {
            return {
                label: single_chat.summary,
                key: single_chat.chat_id,
            }
        })
    ]
    
    const onClick = (e) => {
        chatState.setCurChatID(e.key);
        router.push('/chat/'+e.key);
    }

    return (
        <Menu mode="inline"
              theme="dark"
              onClick={ onClick }
              selectedKeys={ chatState.curChatID === '' ? [] : [chatState.curChatID] }
              items={ items }/>
    )
}

const SideBar = ({ children, collapsed, onCollapse, width }) => {
    const { data: session } = useSession();
    const router = useRouter();
    return (
        <Sider 
            width={width+'px'}
            theme='dark'
            collapsible
            collapsedWidth='0'
            collapsed={collapsed}
            onCollapse={onCollapse}
            trigger={null}
            zeroWidthTriggerStyle={{ width: '18px', top: '45vh', insetInlineEnd: '-18px'}}
            breakpoint='md'
            style={{ overflowY: 'auto',  height: '100%' }}>
            <Flex vertical style={{ height: '100%'}}>

                <Space direction="vertical" size="small" style={{ padding: '.875rem 12px 0 12px' }}>
                    <UserPane></UserPane>
                    <SideBarButton
                        text={ '开启新的对话' }
                        icon={ <CaretRightOutlined /> }
                        onClick={ () => router.push("/") }/>
                </Space>

                <Space direction='vertical' size='small' style={{ overflowY: 'auto', flex: '1 1 0%', padding: '12px .5rem ' }}>
                    { session ? <ChatList /> : '' }
                </Space>
                { children }
            </Flex>
        </Sider>
    );
}

SideBar.SideBarButton = SideBarButton;
SideBar.CollapseButton = CollapseButton;
export default SideBar;