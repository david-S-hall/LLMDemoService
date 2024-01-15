import json
from typing import List
from pydantic import BaseModel, Field, field_validator
from fastapi import FastAPI, Request, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from backend.api import LLMAPI
from backend.mongodb import MongoDBPool
from arguments import api_config

from processing_interface.stream_chat import generate_stream_response
from processing_interface.summary import generate_summary


# initialize
mongotool = MongoDBPool()
llm = LLMAPI()

app = FastAPI(
    title="View layer service API for UI",
    version='0.0.1'
)

origins = [
    f"http://{api_config.ui['host']}",
    f"http://{api_config.ui['url']}",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check health of application
@app.get('/notify/v1/health')
def get_health():
    """
    Usage on K8S
    readinessProbe:
        httpGet:   path: /notify/v1/health
            port: 80
    livenessProbe:
        httpGet:
            path: /notify/v1/health
            port: 80
    :return:
        dict(msg='OK')
    """
    return dict(msg='OK')

#########################################################
###################### Feedback #########################
#########################################################

class FeedbackDict(BaseModel):
    type: str = Field('thumb')
    score: int = Field(None)
    comment: str = Field('')

class Feedback(BaseModel):
    chat_id: str = Field(..., description='The _id field of chat session in MongoDB')
    turn_idx: int = Field(0, description='The response turn index in chat history')
    feedback_dict: dict = Field(..., description='The main body of the feedback')
    
    @field_validator('feedback_dict', mode='before')
    def validate_feedback(cls, value):
        value = FeedbackDict(**value).model_dump()
        return value

@app.post("/feedback")
async def upload_feedback(args: Feedback):
    try:
        feedback = mongotool.build(args.dict(), collection='feedback')
        chat = mongotool.get(args.chat_id, collection='chat')
        chat['feedback_ids'].append(feedback['_id'])
        mongotool.update(args.chat_id, chat, collection='chat')
        return {'status': 200}
    except Exception as e:
        print(e)
        return {'status': 500}

#########################################################
#################### User Profile #######################
#########################################################

@app.get('/user/profile')
async def get_user_profile(
    user_id: str = Query('', description='The user_id field in mongodb collection `user`.'),
    action: str = Query('check', description='The action for processing user profile')):

    user_profile = mongotool.get(None, {'user_id': user_id}, 'user') if user_id != '' else None

    if user_profile is None and action == 'fetch':
        user_profile = mongotool.build({'user_id': user_id, 'chat_list': []}, 'user')

    if user_profile is None:
        user_profile = {'status': 0}
    else:
        user_profile['status'] = 1
        user_profile['chat_list'] = user_profile['chat_list'][-1:-11:-1]
        del user_profile['_id']

    return user_profile

@app.get('/user/chat')
async def modify_user_chats(
    user_id: str = Query('', description='The user_id field in mongodb collection `user`.'),
    chat_id: str = Query('', description='The _id in mongodb collection `chat`.'),
    action: str = Query('rename', description='The action for processing user chat_list, choices=["rename", "delete"].'),
    name: str = Query('New Chat', description='The new name (summary) of the chat.')):

    user_profile = mongotool.get(None, {'user_id': user_id}, 'user') if user_id != '' else None
    if user_profile is None:
        return {'status': 0, 'message': '用户信息不存在'}
    
    clist = user_profile['chat_list']
    for i in range(len(clist)-1, -1, -1):
        if str(clist[i]['chat_id']) == chat_id:
            if action == 'rename':
                clist[i]['summary'] = name
            elif action == 'delete':
                del clist[i]
            
            mongotool.update(user_profile['_id'], user_profile, 'user')
            return {'status': 1, 'message': '修改成功'}
    
    return {'status': 0, 'message': '未找到相关聊天记录'}


#########################################################
##################### Chat Session ######################
#########################################################

@app.get("/chat/startup")
async def start_new_chat(user_id: str = Query('', description='The user id.')):
    chat = mongotool.build({
        'user_id': user_id,
        'task': 'chat',
        'llm_history': [],
        'history': [],
        'feedback_ids': []
    }, collection='chat')
    
    payback = {'chat_id': str(chat['_id']), 'summary': "New Chat"}
    user_profile = mongotool.get(None, {'user_id': user_id}, 'user') if user_id != '' else None
    if user_profile is not None:
        user_profile['chat_list'].append(payback)
        mongotool.update(user_profile['_id'], user_profile, 'user')
    
    return payback

@app.get("/chat/info")
async def get_chat_info(chat_id: str = Query('', description='The _id in mongodb of collection `chat`'),
                        user_id: str = Query('', description='The user_id field of data')):
    try:
        chat = mongotool.get(chat_id, {'user_id': user_id}, collection='chat')
        if chat is not None:
            history = []
            for i, turn in enumerate(chat['history']):
                history.append({'role': 'user', 'turn_idx': i, 'texts': turn['query'].split('\n')})
                history.append({'role': 'assistant', 'turn_idx': i, 'texts': turn['response']})
            return {'status': 1, 'chat_id': chat_id, 'history': history}
        else:
            return {'status': -1}
    except Exception as e:
        print(e)
        return {'status': -1}

class Query(BaseModel):
    chat_id: str = Field(None, description='The mongodb id of chat session.')
    query: str = Field(..., description='The chat query.')

@app.post("/chat/stream")
async def stream_chat(args: Query, req: Request, res: Response):
    res.headers['Content-Type'] = 'text/event-stream'
    res.headers['Cache-Control'] = 'no-cache'

    chat = mongotool.get(args.chat_id, collection='chat')
    chat_id = args.chat_id
    user_id = str(chat['user_id'])

    async def event_generator(request: Request):
        last_msg = ""
        for result in generate_stream_response(
            llm=llm, query=args.query, history=chat['llm_history']
        ):
            if await request.is_disconnected():  
                print("连接已中断")  
                break
            
            
            yield {
                "event": "stream_chat",
                "retry": 15000,
                "data": json.dumps({
                    'texts': result['response'][len(last_msg):],
                })
            }
            last_msg = result['response']

        # after process
        if user_id != '' and len(chat['history']) == 0:
            summary = generate_summary(llm, args.query, result['response'])
            user_profile = mongotool.get(None, {'user_id': user_id}, 'user')
            clist = user_profile['chat_list']

            for i in range(len(clist)-1, -1, -1):
                if str(clist[i]['chat_id']) == chat_id:
                    clist[i]['summary'] = summary
                    break
            mongotool.update(user_profile['_id'], user_profile, 'user')
        
        yield {"event": "stream_chat", "retry": 0, "data": '[DONE]'}
            
        chat['llm_history'] = result['history']
        chat['history'].append({
            'query': args.query,
            'prompt': result['prompt'],
            'response': result['response']
        })

        mongotool.update(chat_id, chat, collection='chat')

    return EventSourceResponse(event_generator(req))


def main():
    from arguments import api_config
    import uvicorn
    uvicorn.run('backend.view_app:app',
                host=api_config.view['host'],
                port=api_config.view['port'],
                reload=True,
                reload_dirs=['backend', 'processing_interface'])
    
if __name__ == '__main__':
    main()