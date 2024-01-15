import NextAuth, { type NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from "next-auth/providers/google"

import { getAPIRoutes } from 'lib/config';

const APIRoutes = getAPIRoutes();

export const authOptions: NextAuthOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages:{
        signIn: '/auth/login',
    },
    callbacks: {
        async jwt ({ token, trigger, session }) {
            if (trigger === 'update') {
                if (session?.lang) token.lang = session.lang;
                if (session?.theme) token.theme = session.theme;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                const profile = await fetch(APIRoutes.user_profile+'?user_id='+token.sub+'&action=fetch')
                .then((response) => response.json())
                .then((data) => data)
                session.user = {
                    ...session.user,
                    ...profile,
                    id: token.sub,
                    lang: token?.lang ? token.lang : null,
                    theme: token?.theme ? token.theme : null,
                }
            }
            return session;
        }
    }
}

export default (req, res) => NextAuth(req, res, authOptions)