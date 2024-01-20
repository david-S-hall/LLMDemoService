import requests
import json
from sseclient import SSEClient

from arguments import api_config


CHAT_URL = f'http://{api_config.model["url"]}/api/chat'
STREAM_CHAT_URL = f'http://{api_config.model["url"]}/api/stream_chat'
EMBEDDING_URL = f'http://{api_config.model["url"]}/api/embedding'


class EmbeddingAPI(object):

    def __init__(self, url=EMBEDDING_URL):
        self.url = url

    def embed_query(self, query):
        return self(query)[0]
    
    def embed_documents(self, texts):
        return self(texts)

    def __call__(self,
                 texts):
        if isinstance(texts, str):
            texts = [texts]
        payload = {
            'texts': json.dumps(texts, ensure_ascii=False)
        }

        payback = requests.post(url=self.url, json=payload)
        payback = json.loads(payback.text)

        if payback['status'] == 200:
            data = payback['data']
            embeddings = data['embeddings']
        else:
            embeddings = []

        return embeddings


class LLMAPI(object):

    def __init__(self,
                 chat_url=CHAT_URL,
                 stream_chat_url=STREAM_CHAT_URL):
        self.chat_url = chat_url
        self.stream_chat_url = stream_chat_url
    
    def chat(self, query, **kwargs):
        return self(query, **kwargs)
    
    def stream_chat(self, query, **kwargs):
        kwargs['stream'] = True
        return self(query, **kwargs)
    
    def __call__(self,
                 query,
                 history=[],
                 role='user',
                 temperature=0.1,
                 top_p=0.7,
                 repetition_penalty=1.0,
                 select_model=None,
                 stream=False,
                 **kwargs):
        payload = {
            'query': query,
            'history': history,
            'role': role,
            'temperature': temperature,
            'top_p': top_p,
            'repetition_penalty': repetition_penalty,
            'select_model': select_model,
            **kwargs
        }
        
        if stream:
            response = requests.post(url=self.stream_chat_url, json=payload, stream=True, headers={'Accept': 'text/event-stream'})
            if response.status_code != 200:
                raise ValueError('传入参数错误')
            client = SSEClient(response)

            def generator():
                history.append((query, ''))
                for e in client.events():
                    if e.event != 'stream_chat': continue
                    if e.data == '[DONE]': break
                    data = json.loads(e.data)
                    if 'history' in data:
                        yield data['response'], data['history']
                    else:
                        yield data['response'], history
            return generator()
        else:
            payback = requests.post(url=self.chat_url, json=payload)
            if payback.status_code != 200:
                raise ValueError('传入参数错误')

            payback = json.loads(payback.text)

            data = payback['data']
            response, history = data['response'], data['history']

            return response, history
