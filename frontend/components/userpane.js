import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { ConfigProvider, theme, Typography } from 'antd';
import { Flex, Button, Avatar, Dropdown, Modal, Radio, Divider } from 'antd';
import { useIntlState } from 'config/locale';
import { useChatState } from 'lib/chatstate';

const { Text } = Typography;


function UserSetting(){
    const { data: session, update: updateSession } = useSession();
    const chatState = useChatState();
    const intlState = useIntlState();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Flex gap='small' onClick={() => {setIsModalOpen(true)}}>
                <SettingOutlined />{intlState.intl.formatMessage({id: 'setting'})}
            </Flex>
            <ConfigProvider theme={chatState.getTheme()}>
            <Modal 
                title={intlState.intl.formatMessage({id: 'setting'})}
                footer=""
                centered
                open={isModalOpen}
                onCancel={() => setIsModalOpen(!isModalOpen)}
                >
            <Divider style={{ margin: '15px 0' }} />
            <Flex vertical gap='middle'>
            
                {/* International */}
                <Flex gap='large' align='center'>
                    <Text style={{ width: '100px', fontSize: 16 }}>{intlState.intl.formatMessage({id: 'setting.UILanguage'})}</Text>
                    <Radio.Group
                        size='large'
                        buttonStyle='solid'
                        optionType='button'
                        options={
                            Object.entries(intlState.langInfo).map(([key, value]) => ({
                                value: key,
                                label: value
                            }))
                        }
                        value={intlState.curLang}
                        onChange={async (e) => {intlState.switchLang(e.target.value); await updateSession({ lang: e.target.value }); }}
                    />
                </Flex>

                {/* UI Theme */}
                <Flex gap='large' align='center'>
                    <Text style={{ width: '100px', fontSize: 16 }}>{intlState.intl.formatMessage({id: 'setting.UITheme'})}</Text>
                    <Radio.Group
                        size='large'
                        buttonStyle='solid'
                        optionType='button'
                        options={
                            chatState.themeList.map((theme) => ({
                                value: theme,
                                label: intlState.intl.formatMessage({id: `setting.UITheme.${theme}`})
                            }))
                        }
                        value={chatState.theme}
                        onChange={async (e) => {chatState.switchTheme(e.target.value); await updateSession({ theme: e.target.value }); }}
                    />
                </Flex>
            </Flex>
            </Modal>
            </ConfigProvider>
        </>
    )
}


export default function UserPane() {
    const intlState = useIntlState();
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
            label: 
            <Flex gap='small' onClick={handleSignout}>
                <LogoutOutlined />{intlState.intl.formatMessage({id: 'auth.logout'})}
            </Flex>,
        }
    ];
    const buttonConfig = {
        type: 'text',
        block: true,
        size: 'large',
        style: { textAlign: 'left', height: '2.5rem', padding: '5px' }
    }

    const { data: session } = useSession();
    return session ?
    (
        <Dropdown menu={{ items }} trigger={['click']}>
            <Button {...buttonConfig}>
                <Flex gap='small' align='center'>
                    <Avatar size='middle' src={<img src={session.user.image} alt="avatar" />} />
                    <Text strong>{session.user.userId}{session.user.name ?? session.user.email}</Text>
                </Flex>
            </Button>    
        </Dropdown>
    ):
    (
        <Button {...buttonConfig} onClick={ handleSignin } >
            <Flex gap='small' align='center'>
                <Avatar size='middle' icon={<UserOutlined />} />
                <Text strong>{intlState.intl.formatMessage({id: 'auth.login'})}</Text>
            </Flex>
        </Button>
    );
}