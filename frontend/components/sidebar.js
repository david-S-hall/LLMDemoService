import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { LeftOutlined, RightOutlined, EditOutlined } from '@ant-design/icons';
import { ConfigProvider } from 'antd';
import { Button, Layout, Flex, Divider, Typography } from 'antd';

import { useIntlState } from 'config/locale';
import { useChatState } from 'lib/chatstate';
import UserPane from 'components/userpane';
import ChatList from 'components/chatlist'

const { Sider } = Layout;
const { Text } = Typography;

const SideBarButton = ({ text, onClick, icon, style }) => {
  return (
    <Button type='text'
        block
        onClick={onClick}
        icon={icon}
        style={{ textAlign: 'left', fontWeight: 'bold', ...style }}>
      {text}
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

const SideBar = ({ children, collapsed, onCollapse, width }) => {
  const intlState = useIntlState();
  const chatState = useChatState();
  const { data: session } = useSession();
  const router = useRouter();
  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            onlyIconSizeSM: 20
          },
          Menu: {
            darkItemHoverBg: '#16242f',
            darkItemSelectedBg:	'#36444f',
            itemMarginBlock: 0,
            itemPaddingInline: 5
          }
        }
      }}
    >
    <Sider 
      width={width+'px'}
      collapsible
      collapsedWidth='0'
      collapsed={collapsed}
      onCollapse={onCollapse}
      trigger={null}
      zeroWidthTriggerStyle={{ width: '18px', top: '45vh', insetInlineEnd: '-18px'}}
      breakpoint='md'
      style={{ overflowY: 'auto',  height: '100%' }}>
      <Flex vertical style={{ height: '100%' }}>
        <Flex vertical gap='small' style={{ padding: '.875rem 12px .5rem 12px'}} >
          <UserPane/>
          <Divider style={{ margin: '0' }}/>
          <SideBarButton
            text={ intlState.intl.formatMessage({id: 'chat.newchat'}) }
            icon={ <EditOutlined style={{ fontSize: '1rem' }}/> }
            onClick={ () => router.push("/") }
            style={{ height: "3em" }}
          />
        </Flex>

        <Flex vertical gap='small' style={{ overflowY: 'auto', flex: '1 1 0%', padding: '5px .5rem' }}>
          { session ? <ChatList chatList={chatState.chatList} curChatID={chatState.curChatID} /> : '' }
        </Flex>
        { children }
      </Flex>
    </Sider>
    </ConfigProvider>
  );
}

SideBar.SideBarButton = SideBarButton;
SideBar.CollapseButton = CollapseButton;
export default SideBar;