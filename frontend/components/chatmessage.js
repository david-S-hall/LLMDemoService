import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react';

import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { UserOutlined, MessageTwoTone } from '@ant-design/icons';
import { LikeOutlined, DislikeOutlined } from '@ant-design/icons';
import { ConfigProvider, theme, Typography  } from 'antd';
import { Card, Flex, Modal } from 'antd';
import { Avatar, Input, Button  } from 'antd';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, coyWithoutShadows, darcula } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useIntlState } from 'config/locale';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

import styles from 'styles/markdown.module.css'

let codeTheme = vscDarkPlus

codeTheme['pre[class*="language-"]'].margin = '0 0 .5em 0';
codeTheme['pre[class*="language-"]'].borderRadius = '0 0 .375rem .375rem'
codeTheme['pre[class*="language-"]'].fontSize = '0.7rem'
codeTheme['code[class*="language-"]'].fontSize = '0.9rem'

function Markdown ( {children} ) {
    return (
        <ReactMarkdown className={styles.markdown} rehypePlugins={[rehypeHighlight, remarkGfm, rehypeRaw]} 
            components={{
                code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                        <Flex vertical>
                        <div className={styles.codeTitle}>
                            <Text className={styles.codeTitleText}>Language: {match[1].toLocaleUpperCase()}</Text>
                        </div>
                        <SyntaxHighlighter
                            wrapLongLines={true}
                            children={String(children).replace(/\n$/, '')}
                            style={codeTheme}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                        </Flex>
                    ) : (
                        <code {...props} className={className}>
                        {children}
                        </code>
                    )
                }
            }}
        >
        {children}
        </ReactMarkdown>
    )
}

function Feedback ( {chat_id, turn_idx, response, callback} ) {
    const intlState = useIntlState();
    const [rating, setRating] = useState(-1);
    const [reason, setReason] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copyIcon, setCopyIcon] = useState(< CopyOutlined />);
    const rateLike = () => {
        setRating(1);
        setIsModalOpen(true);
    };
    const rateDislike = () => {
        setRating(0);
        setIsModalOpen(true);
    }
    const ratingOk = () => {
        setIsModalOpen(false);
        callback({
            chat_id: chat_id,
            turn_idx: turn_idx,
            feedback_dict: {
                type: 'thumb',
                score: rating,
                comment: reason
            }
        });
        setReason('');
    };
    const ratingCancel = () => {
        setRating(-1);
        setIsModalOpen(false);
    }

    const copyResponse = () => {
        navigator.clipboard.writeText(response).then(() => {
            setCopyIcon(< CheckOutlined />);
        });
    }
    useEffect(() => {
        const timer = setTimeout(() => {setCopyIcon(< CopyOutlined />)}, 1000);
        return () => {clearTimeout(timer);}
    }, [copyIcon]);

    return (
        <>
        <Flex gap='5px'>
            { rating !== 0 ? (<Button type='text' size='small' icon={< LikeOutlined />} onClick={rateLike} disabled={rating === 1} />) : ('')}
            { rating !== 1 ? (<Button type='text' size='small' icon={< DislikeOutlined />} onClick={rateDislike} disabled={rating === 0} />) : ('')}
            <Button type='text' size='small' icon={ copyIcon } onClick={copyResponse} />
        </Flex>
        <Modal
            title={intlState.intl.formatMessage({id: 'chat.feedback.title'})} //okText='提交' cancelText='取消'
            open={isModalOpen}
            onOk={ratingOk}
            onCancel={ratingCancel}>
            <p>{intlState.intl.formatMessage({id: 'chat.feedback.description'})}</p>
            <TextArea 
                value={ reason }
                onChange={ (e) => setReason(e.target.value) }/>
        </Modal>
        </>
    )
}

function UserMessage( {chat_id, turn_idx, title, texts } ) {
    const { data: session } = useSession()
    const themeTokens = theme.useToken().token;
    const userIcon = session ? <Avatar size='small' src={<img src={session.user.image} alt="avatar" />} /> :
                               <Avatar size='small' style={{ backgroundColor: '#87d068' }} icon={<UserOutlined /> }/>;
    const userTitle = session ? session.user.name ?? session.user.email : title;
    return (
        <Card bordered={false} style={{ padding: '0', background: themeTokens.colorBgUserMsg}}>
        <Flex gap='small'>
            <div>{userIcon}</div>
            <div style={{ width: '100%', fontWeight: 'normal' }}>
            <Flex vertical>
                <Title level={5} style={{margin: '0 0 10px 0' }}>{userTitle}</Title>
                {...texts.map((text, index) => {
                    const keyBody = chat_id+'_'+turn_idx+'_'+index;
                    return (<Paragraph style={{marginBottom: '0.5em'}}>
                        <Text className={styles.userContent} key={keyBody} >{text}</Text>
                    </Paragraph>)
                })}
            </Flex>
            </div>
        </Flex>
        </Card>
    );
}

UserMessage.defaultProps = {
    title: 'You'
};

function AssistantMessage( { title, children, texts, chat_id, turn_idx, onFeedback, loading } ) {
    const themeTokens = theme.useToken().token;
    return (
        <Card bordered={false} style={{ padding: '0', background: themeTokens.colorBgLLMMsg}}>
        <Flex gap='small'>
            <div><Avatar size="small" style={{ backgroundColor: '#1677ff' }} icon={<MessageTwoTone />}/></div>
            <div style={{width: '100%'}}>
                <Title level={5} style={{margin: 0}}>{title}</Title>
                <div style={{padding: '5px 0'}} >
                    <Markdown>{texts}</Markdown>
                    { !loading ? 
                    <Feedback
                    chat_id={ chat_id }
                    turn_idx={ turn_idx }
                    response={ texts }
                    callback={ onFeedback }/> : ""}
                </div>
                {children}
            </div>
        </Flex>
        </Card>
    );
}

AssistantMessage.defaultProps = {
    title: 'LLM'
};

export default function ChatMessage( props ) {
    return (
        <ConfigProvider theme={{algorithm: theme.defaultAlgorithm}}>
        { (props.role === 'user') ? (<UserMessage {...props} />) : <AssistantMessage {...props} />}
        </ConfigProvider>
    );
}