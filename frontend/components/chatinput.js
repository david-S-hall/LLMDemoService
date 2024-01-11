import { UploadOutlined } from '@ant-design/icons';
import { Flex, Button, Input } from 'antd';

import { useChatState } from 'components/chatstate'

const { TextArea } = Input;


export default function ChatInput ({}) {
    const chatState = useChatState();

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
                background: 'white',
                padding: '10px 10px 10px 0',
                border: '1px solid #d9d9e3',
                borderRadius: '16px',
                overflow: 'auto',
                textAlign: 'right'}}
        >
        <Flex align='flex-end'>
            <TextArea
                id='query_input'
                placeholder="Message:"
                value={ chatState.userInput }
                autoSize={{ maxRows: 20 }}
                size='middle'
                bordered={false}
                disabled={ chatState.loading }
                onChange={ (e) => chatState.setUserInput(e.target.value) }
                onPressEnter={ onPressEnter }/>
            <Button
                type="primary"
                size='middle'
                disabled={ chatState.userInput === '' || chatState.loading }
                // style={{background: '#5050A0'}}
                icon={<UploadOutlined />}
                onClick={ onClick }/>
        </Flex>
        </div>
    )
}