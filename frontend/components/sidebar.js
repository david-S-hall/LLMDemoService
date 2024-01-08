import React from 'react';
import {
    LeftOutlined,
    RightOutlined,
} from '@ant-design/icons';
import { Button, Layout } from 'antd';

const { Sider } = Layout;


const SideBarButton = ({ text, onClick, icon }) => {
    return (
        <Button type='text'
                block='true'
                onClick={onClick}
                icon={icon}
                style={{ textAlign: 'left' }}>{text}
        </Button>
    )
}

const CollapseButton = ({ distance, collapsed, onClick, style }) => {
    style.left = '0';
    style.width= '20px';
    style.zIndex = '40';
    style.position = 'fixed';
    style.transform = 'translateX('+distance+'px)';
    return (
        <Button type='text'
                size='large'
                onClick={onClick}
                style={style}
                icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
        />
    )
}

CollapseButton.defaultProps = {
    style: {}
};

const SideBar = ({ children, collapsed, onCollapse, width }) => {
    return (
        <Sider 
            width={width+'px'}
            theme='dark'
            collapsible
            collapsedWidth='0'
            collapsed={collapsed}
            onCollapse={onCollapse}
            trigger={null}
            zeroWidthTriggerStyle={{ width: '18px', top: '45vh', insetInlineEnd: '-18px'}}
            breakpoint='md'
            style={{ overflowY: 'auto',  height: '100%' }}>
            <div style={{ padding: '10px 20px' }}>
                { children }
            </div>
        </Sider>
    );
}

SideBar.SideBarButton = SideBarButton;
SideBar.CollapseButton = CollapseButton;
export default SideBar;