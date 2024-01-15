import { getServerSession } from "next-auth/next";
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getAPIRoutes } from "lib/config";

const APIRoutes = getAPIRoutes();

export default async function handler (req, res) {
    const session = await getServerSession(req, res, authOptions)
    const user_id = session ? session.user.id : '';
    const processList = req.query.process;

    if ( processList[0] === 'create_chat' ) {
        const response = await fetch(APIRoutes.startup_chat+'?user_id='+user_id)
            .then((response) => response.json())
            .then((data) => data);
        res.status(200).json(response);
    } else {
        const chat_id = processList[0];

        if ( req.query.action === 'get_info' ) {
            const response = await fetch(APIRoutes.get_chat_info+'?user_id='+user_id+'&chat_id='+chat_id)
                .then((response) => response.json())
                .then((data) => data);
            res.status(200).json(response);

        } else if ( req.query.action === 'stream' ) {
            if ( req.method === 'GET' ) { res.status(405).end() }
            // res.setHeader('content-type', 'text/event-stream; charset=utf-8');
            // res.setHeader('content-type', 'text/text; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');
            res.setHeader('cache-control', 'no-cache');
            res.setHeader('connection', 'keep-alive');
            res.setHeader('x-accel-buffering', 'no');

            const response = await fetch(APIRoutes.stream_chat, {
                method: 'POST',
                headers: { 'accept': 'text/event-stream', 'Content-Type': 'application/json' },
                body: JSON.stringify({...req.body, "chat_id": chat_id }),
            })
    
            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
            while (true) {
                const {value, done} = await reader.read();
                if (done) {
                    res.end(); 
                    break;
                } else {
                    res.write(value);
                }
            }

        } else if ( req.query.action === 'feedback' ) {

            const response = await fetch(APIRoutes.feedback, {
                method: 'POST',
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({...req.body, "chat_id": chat_id })
              })
              .then((response) => response.json())
              .then((data) => data);
            res.status(200).json(response);

        }
    }
}