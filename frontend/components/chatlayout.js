import Head from 'next/head';
import { useState } from 'react';

import { ConfigProvider, theme } from 'antd';
import { Layout, Col, Row, Flex } from 'antd';

import SideBar from 'components/sidebar';
import ChatInput from 'components/chatinput';
import { useChatState } from 'components/chatstate';

const { Header, Content, Footer } = Layout;
const { CollapseButton } = SideBar;


export default function ChatLayout({ children }) {
  const chatState = useChatState();

  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 0 : 260;
  const lg_sep = 3, xl_sep = 4;
  const lg_bag = 24 - 2*lg_sep, xl_bag = 24 - 2*xl_sep;

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Head>
        <title>LLM DEMO Service</title>
      </Head>

      {/* 侧边栏 */}
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          components: {
            Slider: {
              railBg: '#80808f',
              railHoverBg: '#bfbfcf',
              trackBg: '#5b8bbf',
              trackHoverBg: '#5babff',
              handleColor: '#80808f',
              handleActiveColor: '#4b9bff',
              colorBgElevated: '#bfbfcf'
            },
            Menu: {
              darkItemSelectedBg:	'#36444f'
            }
          }
      }}>
      <SideBar
        width={sidebarWidth}
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}>
      </SideBar>
      </ConfigProvider>

      {/* 主体窗口 */}
      <ConfigProvider theme={{
        algorithm: theme.defaultAlgorithm,
      }}>
      <Layout>

        {chatState.notiContextHolder}

        <CollapseButton
          distance={sidebarWidth}
          collapsed={collapsed}
          onClick={toggleCollapse}
          style={{ top: '45vh' }}/>

        <Header style={{ background: '#ffffff', padding: '0 .5rem', height: '3rem', lineHeight: '3rem'}} >
          <div style={{fontSize: '1.3em', fontWeight: 'bold', verticalAlign: 'middle', margin: '0px 15px'}}>Chat</div>
        </Header>

        <Content>
          <Flex vertical style={{ height: '100%' }}>

            {/* 展示窗 */}
            <Row ref={chatState.containerRef} style={{ overflowY: 'auto', flex: '1 1 0%' }}>
              <Col xs={24} sm={24} md={24} lg={{span: lg_bag, push: lg_sep}} xl={{span: xl_bag, push: xl_sep}}>
                  {children}
              </Col>
            </Row>

            {/* 输入框 */}
            <Row style={{ width: '100%', marginTop: '3px', padding: '0 20px'}}>
              <Col xs={24} sm={24} md={24} lg={{span: lg_bag, push: lg_sep}} xl={{span: xl_bag, push: xl_sep}} >
                <ChatInput/>
              </Col>
            </Row>

            <div style={{ height: '15px' }}></div>

          </Flex>
        </Content>

      </Layout>
      </ConfigProvider>
      
    </Layout>
  )
}