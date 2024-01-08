import time

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
    for response, history in llm.stream_chat(prompt, history=history, temperature=0.1, top_p=0.7, repetition_penalty=1.0):
        yield {'response': response}
    yield {'prompt': prompt, 'response': response, 'history': history}