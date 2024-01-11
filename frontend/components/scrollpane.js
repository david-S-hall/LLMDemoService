import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownOutlined } from '@ant-design/icons';
import { Flex, Space, FloatButton } from 'antd';

export default function ScrollPane ({ children, scrollList, parentRef }) {
    const [distX, setDistX] = useState(0)
    const [distY, setDistY] = useState(100)
    const [isBackTopVis, setIsBackTopVis] = useState(false);
    const bottomRef = useRef(null);

    const scrollToBottom = () => {
        if (bottomRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }
    const setBackVisPosition = () => {
        const node = parentRef.current;
        setDistX(node.offsetLeft + node.clientWidth / 2);
        setDistY(node.offsetTop + node.clientHeight - 50);
    }
    const toggleIsBackTopVis = () => {
        const node = parentRef.current;
        if (node.scrollTop > node.scrollHeight - node.clientHeight - 200){
            setIsBackTopVis(false);
        } else {
            setIsBackTopVis(true);
        }
    }

    useEffect(() => {
        const node = parentRef.current;
        if (node.scrollTop > (node.scrollHeight - node.clientHeight * 5)){
            scrollToBottom();
        }
    }, [scrollList]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {setBackVisPosition();})
        const node = parentRef.current
    
        if (node) {
            node.addEventListener("scroll", toggleIsBackTopVis);
            resizeObserver.observe(node)
        }

        return () => {
            if (node) {
                node.removeEventListener("scroll", toggleIsBackTopVis);
                resizeObserver.unobserve(node)
            }
        }
    }, []);

    return (
        <Flex vertical style={{ width: '100%', padding: '5px 20px' }}>
            <Space direction='vertical' size='small' >
            {children}
            {
                (isBackTopVis) ?
                <FloatButton 
                    icon={ <ArrowDownOutlined/> }
                    onClick={ scrollToBottom }
                    style={{ top: distY, left: '0', transform: 'translateX('+distX+'px)' }}
                /> 
                : ''
            }
            
            </Space>
            <div ref={bottomRef}/>
        </Flex>
    )
}