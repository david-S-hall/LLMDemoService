import { signIn } from 'next-auth/react';
import { GoogleOutlined, GithubOutlined } from '@ant-design/icons';
import { Layout, Card, Col, Flex, Button } from 'antd';



export default function Login({}) {
  return (
    <Layout style={{
      height: '100vh',
      width: '100vw',
      backgroundSize: 'cover',
      backgroundColor: '#dff1ff',
      backgroundImage: 'url(https://picsum.photos/640/480/?blur=5)'
    }} >
      <Flex align="center" style={{ height: '100%', padding: '0 20px' }}>
      {/* <Row> */}
        <Col 
          xs={24} sm={24}
          md={{span: 12, push: 6}} 
          lg={{span: 10, push: 7}} 
          xl={{span: 10, push: 7}}>
          <Card title='登录' headStyle={{textAlign: "center"}}>
            <Flex vertical gap='large'>
              <Button block size='large' icon={<GoogleOutlined />} onClick={() => signIn('google')}>Google 登录</Button>
              <Button block size='large' icon={<GithubOutlined />} onClick={() => signIn('github')}>Github 登录</Button>
            </Flex>
          </Card>
        </Col>
      {/* </Row> */}
      </Flex>
    </Layout>
  )
}