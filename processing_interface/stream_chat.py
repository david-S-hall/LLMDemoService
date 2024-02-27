import json

from arguments import llm_config, agent_type, default_lang
from agent import rewoo_agent_chat, react_agent_chat


MODEL_NAME = list(llm_config.keys())[0]
MODEL = llm_config[MODEL_NAME].modelobj

PROMPT_TEMPLATE = \
'''{content}'''


def generate_stream_response(llm, query, history):
    '''
    Arguments:
    * llm - (object): A callable llm interface.
    * query - (str): The query upload by user.

    yield return:
    * word - (str): separate response words
    '''

    prompt = PROMPT_TEMPLATE.format(content=query)

    gen_kwargs = { 
        'select_model': MODEL_NAME,
    }
 
    # ReWOO Agent
    if agent_type == 'rewoo':
        gen_kwargs['repetition_penalty'] = 1.05
        for response, history in rewoo_agent_chat(llm, prompt, history, lang=default_lang, **gen_kwargs):
            yield {'response': response}

    # ReACT Agent
    elif agent_type == 'react':
        gen_kwargs['temperature'] = 0.1
        gen_kwargs['repetition_penalty'] = 1.05
        for response, history in react_agent_chat(llm, prompt, history, lang=default_lang, **gen_kwargs):
            yield {'response': response}
    
    # Built-in Agent for ChatGLM or No-Agent
    else:
        if agent_type == 'built-in' and getattr(MODEL, 'agent_chat', None):
            gen_kwargs['use_agent'] = True

        for response, history in llm.stream_chat(prompt, history=history, **gen_kwargs):
            yield {'response': response}

    yield {'prompt': prompt, 'response': response, 'history': history}

    print(json.dumps(history, indent='  ', ensure_ascii=False))