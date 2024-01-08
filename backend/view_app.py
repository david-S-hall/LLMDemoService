import json
from typing import List
from pydantic import BaseModel, Field, field_validator
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import ServerSentEvent, EventSourceResponse

from backend.api import LLMAPI
from backend.mongodb import MongoDBPool
from arguments import api_config, mongo_config

from processing_interface.stream_chat import generate_stream_response


# initialize
mongotool = MongoDBPool()

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


class FeedbackDict(BaseModel):
    response_index: int = Field(0)
    type: str = Field('thumb')
    score: int = Field(None)
    comment: str = Field('')

class Feedback(BaseModel):
    query_id: str = Field(..., description='The _id field of generation in MongoDB')
    feedback_dict: dict = Field(..., description='The main body of the feedback')
    
    @field_validator('feedback_dict', mode='before')
    def validate_feedback(cls, value):
        value = FeedbackDict(**value).model_dump()
        return value

@app.post("/feedback")
async def upload_feedback(args: Feedback):
    try:
        mongotool.feedback(query_id=args.query_id, feedback_dict=args.feedback_dict)
        return {'status': 200}
    except Exception as e:
        print(e)
        return {'status': 500}

@app.get("/export_history")
async def export_history():
    results = mongotool.export_feedback(collection='generation')
    return json.dumps(results)

class Query(BaseModel):
    previous_qid: str = Field('', description='The last query id.')
    query: str = Field(..., description='The chat query')

@app.post("/chat/stream")
async def stream_chat(args: Query, req: Request):    
    llm = LLMAPI()
    history = mongotool.get(args.previous_qid)['history'] if args.previous_qid != "" else []
    uploaded = mongotool.build_geneartion({
        'task': 'chat',
        'query': args.query,
    })
    query_id = uploaded['_id']

    async def event_generator(request: Request):
        result = ''
        for result in generate_stream_response(
            llm=llm, query=args.query, history=history
        ):
            if await request.is_disconnected():  
                print("连接已中断")  
                break

            result['query_id'] = str(query_id)
            
            yield {
                "event": "stream_chat",
                "retry": 15000,
                "data": json.dumps(result)
            }

        yield {"event": "stream_chat", "retry": 0, "data": '[DONE]'}
        uploaded.update(result)
        mongotool.update(query_id, uploaded)

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