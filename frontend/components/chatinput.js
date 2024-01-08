import { useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Flex, Button, Input } from 'antd';

const { TextArea } = Input;


export default function ChatInput ({ callback, submitting }) {
    const [userInput, setUserInput] = useState('');
    const disabled = (userInput === '') ? true : false;

    const isSubmitted = () => {
        setUserInput('');
    }
    const onSubmit = () => {
        const text = userInput;
        callback(text, isSubmitted);
    }
    const onPressEnter = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (userInput.trim() !== ""){
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
                placeholder="请输入要进行命题的文章:"
                value={ userInput }
                autoSize={{ maxRows: 20 }}
                size='middle'
                bordered={false}
                disabled={ submitting }
                onChange={ (e) => setUserInput(e.target.value) }
                onPressEnter={ onPressEnter }/>
            <Button
                type="primary"
                size='middle'
                disabled={ disabled || submitting }
                // style={{background: '#5050A0'}}
                icon={<UploadOutlined />}
                onClick={ onClick }/>
        </Flex>
        </div>
    )
}