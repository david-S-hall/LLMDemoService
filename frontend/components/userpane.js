import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { ConfigProvider, theme } from 'antd';
import { Flex, Button, Avatar, Dropdown, Typography, Modal } from 'antd';

const { Text } = Typography;


function UserSetting(){
    const [isModalOpen, setIsModalOpen] = useState(false);
    const showModal = () => {
        setIsModalOpen(true);
    };
    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };
    return (
        <>
            <Flex gap='small' onClick={showModal}>
            <SettingOutlined />
                设置
            </Flex>
            <ConfigProvider theme={{
                algorithm: theme.defaultAlgorithm,
            }}>
            <Modal title="设置"
                footer=""
                open={isModalOpen}
                onOk={() => toggleModal()} onCancel={() => toggleModal()}>
                <p>Some contents...</p>
                <p>Some contents...</p>
                <p>Some contents...</p>
            </Modal>
            </ConfigProvider>
        </>
    )
}


export default function UserPane() {

    const handleSignin = (e) => {
        e.preventDefault();
        signIn();
    }

    const handleSignout = (e) => {
        e.preventDefault();
        signOut();
    }

    const items = [
        {
            key: '1',
            label: <UserSetting />,
        },
        {
            key: '2',
            label: <Flex gap='small' onClick={handleSignout}><LogoutOutlined />注销</Flex>,
        }
    ];

    const { data: session } = useSession();
    return session ?
    (
        <Dropdown menu={{ items }} trigger={['click']}>
            <Button
                type='text'
                block
                size='large'
                style={{ textAlign: 'left', height: '100%', padding: '5px' }}>
                <Flex gap='small' align='center'>
                    <Avatar size='middle' src={<img src={session.user.image} alt="avatar" />} />
                    <Text strong>{session.user.userId}{session.user.name ?? session.user.email}</Text>
                </Flex>
            </Button>    
        </Dropdown>
    ):
    (
        <Button type='text'
                block
                size='large'
                onClick={ handleSignin }
                style={{ textAlign: 'left', height: '100%' }}>
            <Flex gap='small' align='center'>
                <Avatar size='middle' icon={<UserOutlined />} />
                <Text strong>点击登录</Text>
            </Flex>
        </Button>
    );
}