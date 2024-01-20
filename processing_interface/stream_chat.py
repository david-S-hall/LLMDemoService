import json

from arguments import llm_config

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
        'temperature': 0.1,
        'top_p': 0.7,
        'repetition_penalty': 1.0,
        'select_model': MODEL_NAME,
    }

    if getattr(MODEL, 'agent_chat', None):
        gen_kwargs['use_agent'] = True

    for response, history in llm.stream_chat(prompt, history=history, **gen_kwargs):
        yield {'response': response}
    yield {'prompt': prompt, 'response': response, 'history': history}

    print(json.dumps(history, indent='  ', ensure_ascii=False))