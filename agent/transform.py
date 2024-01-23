
def trans_general_history(history=[]):
    if len(history) == 0 or (isinstance(history[0], (tuple, list)) and len(history[0]) == 2): return history
    new_history = []
    query, response = None, None
    for i, msg in enumerate(history):
        if msg['role'] == 'user':
            if response is not None:
                new_history.append([query, response])
                response = ''
            query = msg['content']
        elif msg['role'] == 'assistant':
            response = msg.get('content', response)
        
        if i == len(history) - 1 and response != new_history[-1][-1]:
            new_history.append([query, response])
    return new_history
    

def trans_agent_history(history=[]):
    if len(history) == 0 or (isinstance(history[0], dict) and 'role' in history[0]): return history
    new_history = []
    for query, response in history:
        new_history.append(dict(role='user', content=query))
        new_history.append(dict(role='assistant', content=response))
    return new_history
    