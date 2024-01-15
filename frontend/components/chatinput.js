import { UploadOutlined } from '@ant-design/icons';
import { Flex, Button, Input, theme } from 'antd';
import { useIntlState } from 'config/locale';
import { useChatState } from 'lib/chatstate';

const { TextArea } = Input;


export default function ChatInput ({}) {
    const themeTokens = theme.useToken().token;
    const chatState = useChatState();
    const intlState = useIntlState();

    const onSubmit = () => {
        chatState.setLoading(true)
    }
    const onPressEnter = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (chatState.userInput.trim() !== ""){
                onSubmit();
            }
        }
    }
    const onClick = () => { onSubmit(); }

    return (
        <div style={{
                // padding: '.6rem',
                // padding: '0 .8rem .8rem 0',
                background: themeTokens.colorBgElevated,
                border: '1px solid #d9d9e3',
                borderRadius: '16px',
                overflow: 'auto',
                textAlign: 'right'}}
        >
        <Flex align='flex-end'>
            <TextArea
                id='query_input'
                placeholder={intlState.intl.formatMessage({ id: 'chat.userInput.placeholder' })}
                value={ chatState.userInput }
                autoSize={{ maxRows: 20 }}
                size='middle'
                bordered={false}
                style={{ padding: '.875rem' }}
                disabled={ chatState.loading }
                onChange={ (e) => chatState.setUserInput(e.target.value) }
                onPressEnter={ onPressEnter }/>
            <Button
                type="primary"
                size='middle'
                style={{ margin: '.55rem .55rem .55rem 0' }}
                disabled={ chatState.userInput === '' || chatState.loading }
                icon={<UploadOutlined />}
                onClick={ onClick }/>
        </Flex>
        </div>
    )
}