import { signIn } from 'next-auth/react';
import { GoogleOutlined, GithubOutlined } from '@ant-design/icons';
import { Layout, Card, Col, Flex, Button } from 'antd';
import { useIntlState } from 'config/locale';


export default function Login({}) {
  const intlState = useIntlState();
  return (
    <Layout style={{
      height: '100vh',
      width: '100vw',
      backgroundSize: 'cover',
      backgroundColor: '#dff1ff',
      backgroundImage: 'url(https://picsum.photos/640/480/?blur=5)'
    }} >
      <Flex align="center" style={{ height: '100%', padding: '0 20px' }}>
        <Col 
          xs={24} sm={24}
          md={{span: 12, push: 6}} 
          lg={{span: 10, push: 7}} 
          xl={{span: 10, push: 7}}>
          <Card
            title={intlState.intl.formatMessage({ 'id': 'auth.login' })}
            bordered={false}
            hoverable
            headStyle={{ textAlign: "center", fontSize: '1.2rem' }}
            style={{background: 'rgba(255, 255, 255, 0.7)'}} >
            <Flex vertical gap='large'>

              <Button block size='large' icon={<GoogleOutlined />}
                      onClick={() => signIn('google')}
                      style={{ height: '3rem', fontSize: '1rem', fontWeight: '500' }}>
                      {intlState.intl.formatMessage({ id: 'auth.login.google' })}</Button>

              <Button block size='large' icon={<GithubOutlined />} 
                      onClick={() => signIn('github')}
                      style={{ height: '3rem', fontSize: '1rem', fontWeight: '500' }}>
                      {intlState.intl.formatMessage({ id: 'auth.login.github' })}</Button>
            </Flex>
          </Card>
        </Col>
      </Flex>
    </Layout>
  )
}