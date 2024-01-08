import Head from 'next/head';
import React, { useState, useRef, useEffect } from 'react';

import { CaretRightOutlined, ExportOutlined } from '@ant-design/icons';
import { ConfigProvider, theme, Typography } from 'antd';
import { Layout, Col, Row, Space, Flex } from 'antd';
import { Button, Slider, Cascader, Divider, message, notification } from 'antd';

import SideBar from '../components/sidebar';
import ScrollPane from '../components/scrollpane';
import ChatInput from '../components/chatinput';
import ChatMessage from '../components/chatmessage';

import { SSE } from "../lib/sse";
import { getAPIRoutes } from '../lib/config';

const { Header, Content, Footer} = Layout;
const { Text, Title } = Typography;
const { SideBarButton, CollapseButton } = SideBar;


export async function getStaticProps() {
  const APIRoutes = getAPIRoutes();
  return {
    props: {
      APIRoutes
    },
  };
}

export default function Home({ APIRoutes }) {
  const mainContainer = useRef(null);
  const [notiApi, notiContextHolder] = message.useMessage({
    top: 70,
    duration: 2,
    maxCount: 5
  });

  const [chatHistory, setChatHistory] = useState([]); //useState(History);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const sidebarWidth = collapsed ? 0 : 260;
  const lg_sep = 3, xl_sep = 4;
  const lg_bag = 24 - 2*lg_sep, xl_bag = 24 - 2*xl_sep;

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  }

  const clearHistory = () => {
    setChatHistory([]);
  }

  let getChatResponse = async ( query, setSubmitted ) => {

    setSubmitted();
    setLoading(true);

    let curHistory = chatHistory;
    let userMsg = {
      role: 'user',
      query_id: 'tempid',
      texts: query.split('\n'),
    }
    let llmMsg = {
      role: 'assistant',
      query_id: 'tempid',
      response: '',
      spinning: true
    }
    const previous_qid = curHistory.length !== 0 ? curHistory[curHistory.length-1].query_id : "" ;
    setChatHistory([...curHistory, userMsg, llmMsg]);

    let source = new SSE(APIRoutes.stream_chat, {
      method: 'POST',
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      payload: JSON.stringify({ "query": query, "previous_qid": previous_qid })
    });

    source.addEventListener("stream_chat", (e) => {
      if (e.data != "[DONE]") {
        let data = JSON.parse(e.data);
        userMsg.query_id = data.query_id
        llmMsg.response = data.response
        llmMsg.query_id = data.query_id
      } else {
        llmMsg.spinning = false;
        setLoading(false);
        source.close();
      }
      setChatHistory([...curHistory, userMsg, llmMsg]);
    });
    source.stream();
  }

  const uploadFeedback = async ( payload ) => {
    const response = await fetch(APIRoutes.feedback,
      {
        method: 'POST',
        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    const data = await response.json();
    if (data.status === 200) {
      notiApi.open({type: 'success', content: "反馈成功"})
    }
    if (data.status === 500) {
      notiApi.open({type: 'error', content: "反馈失败"})
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Head>
        <title>LLM DEMO Service</title>
      </Head>

      {/* 侧边栏 */}
      <SideBar width={sidebarWidth} collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
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
            }
          }
      }}>
        <Space direction="vertical" size="small" style={{ width: '100%', marginTop: '2.5rem' }}>
          <SideBarButton text={ '开启新的任务' } icon={ <CaretRightOutlined /> } onClick={ clearHistory }/>
        </Space>
      </ConfigProvider>
      </SideBar>
    
      <ConfigProvider theme={{
        algorithm: theme.defaultAlgorithm,
      }}>
      <Layout>
        {notiContextHolder}
        <CollapseButton
          distance={sidebarWidth}
          collapsed={collapsed}
          onClick={toggleCollapse}
          style={{ top: '45vh' }}/>

        <Header style={{ background: '#ffffff', padding: '0 .5rem', height: '3rem', lineHeight: '3rem'}} >
          <div style={{fontSize: '1.3em', fontWeight: 'bold', verticalAlign: 'middle', margin: '0px 15px'}}>Chat</div>
        </Header>

        <Content style={{ padding: '0 20px' }}>
          <Flex vertical style={{ height: '100%' }}>

            {/* 对话历史 */}
            <Row ref={mainContainer} style={{ overflowY: 'auto', flex: '1 1 0%' }}>
              <Col xs={24} sm={24} md={24} lg={{span: lg_bag, push: lg_sep}} xl={{span: xl_bag, push: xl_sep}}>
                <ScrollPane parentRef={mainContainer} scrollList={chatHistory} >
                {...chatHistory.map(
                  (single_record) => 
                  (<ChatMessage
                    {...single_record}
                    key={single_record.role+single_record.query_id}
                    onFeedback={uploadFeedback}/>)
                )}
                </ScrollPane>
              </Col>
            </Row>

            {/* 输入框 */}
            <div style={{ width: '100%', marginTop: '3px' }}>
              <Row>
                <Col xs={24} sm={24} md={24} lg={{span: lg_bag, push: lg_sep}} xl={{span: xl_bag, push: xl_sep}} >
                  <ChatInput callback={ getChatResponse } submitting={ loading }/>
                </Col>
              </Row>
              
              <div style={{ height: '15px' }}></div>
            </div>
          </Flex>
        </Content>

        {/* <Footer style={{ textAlign: 'center' }}>
        </Footer> */}

      </Layout>
      </ConfigProvider>
    </Layout>
  );
}
