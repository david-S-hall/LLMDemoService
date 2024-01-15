import { createContext, useContext, useState, useEffect } from 'react';
import { createIntl, createIntlCache } from 'react-intl';
import { IntlProvider } from 'react-intl';
import { ConfigProvider } from 'antd';
import { useSession } from 'next-auth/react';

import zh_CN from './zh_CN';
import en_US from './en_US';

import antd_zh_CN from 'antd/es/locale/zh_CN';
import antd_en_US from 'antd/es/locale/en_US';

const messages = {
    'zh-CN': zh_CN,
    'en-US': en_US
};

const antdMessages = {
    'zh-CN': antd_zh_CN,
    'en-US': antd_en_US
};

const langList = Object.entries(messages).map(([key, value]) => key)

const IntlContext = createContext();


export const IntlStateProvider = ({ children }) => {
    const { data: session } = useSession();
    const [curLang, setCurLang] = useState('en-US');
    const langInfo = {
        'zh-CN': '中文',
        'en-US': 'English'
    }
    const switchLang = ( lang ) => {
        if ( langList.includes(lang) ) {
            setCurLang(lang);
        } else if ( langList.includes(lang.substring(0, 2)) ) {
            setCurLang(lang.substring(0, 2));
        }
    }
    const intl = createIntl(
        { locale: curLang, messages: messages[curLang]},
        createIntlCache()
    );

    useEffect(() => {
        const userLang = session?.user.lang ? session.user.lang : navigator.language;
        if (langList.includes(userLang)) {
            setCurLang(userLang);
        } else if (langList.includes(userLang.substring(0, 2))) {
            setCurLang(userLang.substring(0, 2));
        }
    }, [])

    return (
        <IntlContext.Provider value={{ curLang, switchLang, langInfo, intl }}>
            <IntlProvider locale={curLang} messages={messages[curLang]} >
                <ConfigProvider locale={antdMessages[curLang]}>
                    {children}
                </ConfigProvider>
            </IntlProvider>
        </IntlContext.Provider>
    );
}

export function useIntlState() {
    return useContext(IntlContext);
}
