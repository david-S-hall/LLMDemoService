import { getServerSession } from "next-auth/next";
import { getAPIRoutes } from "lib/config";
import { authOptions } from 'pages/api/auth/[...nextauth]';


const APIRoutes = getAPIRoutes();

export default async function handler (req, res) {
    const session = await getServerSession(req, res, authOptions)
    const user_id = session ? session.user.id : '';
    const processList = req.query.process;

    if ( processList[0] === 'profile' ) {
        if ( req.method === 'GET' ) {
            const action = req.query.action ? req.query.action : 'fetch';
            const profile = await fetch(APIRoutes.user_profile+`?user_id=${user_id}&action=${action}`)
                    .then((response) => response.json())
                    .then((data) => data);
            res.status(200).json(profile)
        } else {
            res.status(405).json({ message: 'Invalid Method'})
        }

    } else if ( processList[0] === 'chat' ) {
        if ( req.method === 'GET' ) {
            const action = req.query.action;
            const chat_id = req.query.chat_id;
            const name = req.query.name ? req.query.name : 'New Chat';
            const profile = await fetch(APIRoutes.user_chat_modify+`?user_id=${user_id}&chat_id=${chat_id}&action=${action}&name=${name}`)
                    .then((response) => response.json())
                    .then((data) => data);
            res.status(200).json(profile)
        } else {
            res.status(405).json({ message: 'Invalid Method'})
        }
    }

}