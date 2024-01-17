import { useEffect, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Flex, Button, Input, theme } from 'antd';
import { useIntlState } from 'config/locale';
import { useChatState } from 'lib/chatstate';

const { TextArea } = Input;


export default function ChatInput ({}) {
    const themeTokens = theme.useToken().token;
    const chatState = useChatState();
    const intlState = useIntlState();
    const [isComposition, setIsComposition] = useState(false);

    const onSubmit = () => {
        chatState.setLoading(true)
    }
    const onClick = () => { onSubmit(); }
    const onPressEnter = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (isComposition) {
                setIsComposition(false);
            } else if (chatState.userInput.trim() !== ""){
                onSubmit();
            }
        }
    }

    const handleComposition = (e) => {
        e.preventDefault();
        if (e.type === 'compositionstart'){
            setIsComposition(true)
        } else if (e.type === 'compositionend') {
            setIsComposition(false)
        } 
    }

    return (
        <div style={{
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
                style={{ padding: '.8rem' }}
                disabled={ chatState.loading }
                onChange={ (e) => chatState.setUserInput(e.target.value) }
                onCompositionStart={ handleComposition }
                onCompositionUpdate={ handleComposition }
                onCompositionEnd={ handleComposition }
                onPressEnter={ onPressEnter }/>
            <Button
                type="primary"
                size='middle'
                style={{ margin: '11px .55rem 11px 0' }}
                disabled={ chatState.userInput === '' || chatState.loading }
                icon={<UploadOutlined />}
                onClick={ onClick }/>
        </Flex>
        </div>
    )
}