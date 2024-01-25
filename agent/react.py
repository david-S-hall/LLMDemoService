from .tools import DefaultAgentToolBox
from .lm_template import LMTemplateParser
from .transform import trans_agent_history


# Referencing code https://github.com/InternLM/lagent/blob/main/lagent/agents/react.py

# The Chinese prompts for ReAct

CALL_PROTOCOL_ZH = """你是一个解决用户问题的助手。
你可以利用以下外部工具。\n{tool_description}
选择一个单一的操作，并以以下返回格式回复：
```{thought} 想一想你需要解决什么问题，你需要哪个工具？
{action} func_1
{action_input} func_1[param_1='a',param_2=3]```\n
对于你的回复：
1. 只选择一个操作。
2. 操作应该是 {action_names} 中的一个。
3. 操作输入只能采用格式 `{action_input} tool_name[tool_params]`。\n
开始！"""

FORCE_STOP_PROMPT_ZH = '你需要基于历史消息返回一个最终结果'

# The English prompts for ReAct

CALL_PROTOCOL_EN = """You are a assistant to solve user's problem.
You can utilize following external tools.\n{tool_description}
Select a single action, and reply in following return format:
```{thought} Think what you need to solve, which tool do you need?
{action} func_1
{action_input} func_1[param_1='a',param_2=3]```\n
For your response:
1. Select only one action.
2. Action should be one of {action_names}.
3. Action input is only in format `{action_input} tool_name[tool_params]`.\n
Begin!"""

FORCE_STOP_PROMPT_EN = """You should directly give results
 based on history information."""

META_TEMPLATE = [
    dict(role='system', begin='<|System|>:', end='\n'),
    dict(role='user', begin='<|User|>:', end='\n'),
    dict(
        role='assistant',
        begin='<|Bot|>:',
        end='<eoa>\n',
        generate=True)
]

FINISH_ACTION = {
    'finish_action': {
        'name': 'finish_action',
        'description': 'Final response based on history information',
        'parameters': {
            'type': 'object',
            'properties': {
                'response': {
                    'type': 'str',
                    'description': 'The string-type final response.'
                }
            },
        'required': ['response']
        }
    }
}

def react_agent_chat(llm, query, chat_history=[], lang='ZH', max_turn=4, **gen_kwargs):
    assert lang.upper() in ['ZH', 'EN']

    dialog_formatter = LMTemplateParser(META_TEMPLATE)
    toolbox = DefaultAgentToolBox()
    tool_description = toolbox.get_tool_descriptions()
    tool_description.update(FINISH_ACTION)

    total_response = ''
    final_response = ''
    force_stop = False
    chat_history = trans_agent_history(chat_history)
    inner_history = [dict(role='user', content=query)]

    def trans_param_dict(param_text):
        try:
            params = eval(f'dict({param_text})')
        except Exception as e:
            params = param_text
        return params

    for turn_idx in range(max_turn):
        # finish if:
        # 1. Over the max_turn number, finish in this turn
        # 2. Select a finish action, finish in this turn
        # 3. Action type is invalid, finish in next turn (for summary)
        if turn_idx == max_turn - 1: force_stop = True

        react_template = format_react_template(
            chat_history,
            inner_history,
            tool_description,
            force_stop,
            lang=lang.upper())
        
        react_prompt = dialog_formatter.parse_template(react_template)

        for response, _ in llm.stream_chat(react_prompt, history=[], **gen_kwargs):
            # Special judge for chatglm
            if not isinstance(response, str): continue

            # Parse the first action from response
            thought, action, action_input = parse_action(response)
            if action != 'finish_action' and force_stop:
                thought, action, action_input = '', 'finish_action', response
            
            if action == 'finish_action':
                # For finish action, the only param is the response
                try:
                    yield total_response+action_input, chat_history
                except Exception as e:
                    pass
            elif action != '':
                yield total_response+'[TOOLPENDING]', chat_history

        # Build valid format response to avoid duplicated actions
        valid_response = f'Thought:{thought}\nAction:{action}\nAction Input:{action_input}\n' if action != '' else response+'\n'
        inner_history.append(dict(role='assistant', content=valid_response))

        if action == 'finish_action':
            final_response = action_input
            yield total_response+final_response, chat_history
            break
        elif action == '':
            force_stop = True
            inner_history.append(dict(role='system', content='Invalid action\n'))
        else:
            action_return = toolbox.use_tool(action, trans_param_dict(action_input))
            inner_history.append(dict(role='system', content=format_response(action_return.strip())))
            total_response += '[TOOLPENDING][TOOLDONE]'
            yield total_response, chat_history
    
    chat_history.append(dict(role='user', content=query))
    chat_history.append(dict(role='assistant', content=final_response))
    yield total_response+final_response, chat_history

def format_react_template(
    chat_history,
    inner_step,
    tool_description,
    force_stop: bool = False,
    lang='ZH') -> list:
    """Generate the ReAct format prompt.

    Args:
        chat_history (List[Dict]): The history log in previous runs.
        inner_step (List[Dict]): The log in the current run.
        tool_description (Dict): The description of agent tools
        force_stop (boolean): whether force the agent to give responses
            under pre-defined turns.

    Returns:
        List[Dict]: ReAct format prompt.
    """

    call_protocol = globals()[f'CALL_PROTOCOL_{lang}'].format(
        tool_description=tool_description,
        action_names=list(tool_description.keys()),
        thought='Thought:',
        action='Action:',
        action_input='Action Input:',
        response='Response:',
        finish='Final Answer:',
    )
    formatted = []
    formatted.append(dict(role='system', content=call_protocol))
    formatted += chat_history
    formatted += inner_step
    if force_stop:
        formatted.append(dict(role='system', content=globals()[f'FORCE_STOP_PROMPT_{lang}']))
    return formatted


def parse_action(message):
    """Parse the action returns in a ReAct format.

    Args:
        message (str): The response from LLM with ReAct format.

    Returns:
        tuple: the return value is a tuple contains:
            - thought (str): contain LLM thought of the current step.
            - action (str): contain action scheduled by LLM.
            - action_input (str): contain the required action input
                for current action.
    """

    import re
    
    pattern = r'Thought:([^\n]*)\nAction'
    thought_match = re.findall(pattern, message)
    thought = thought_match[0].strip() if len(thought_match) > 0 else ''
    
    pattern = r"Action:([^\n]*)\nAction *Input:(.*)"
    action_match = re.findall(pattern, message)
    
    if len(action_match) == 0:
        return thought, '', ''

    action_name, action_input = action_match[0][0].strip(), action_match[0][1].strip()
    
    args_pattern = r'(.*?)[\[(](.+)[\])]?'
    args_match = re.findall(args_pattern, action_input)

    if len(args_match) > 0 and args_match[0][1] != '' and action_name in args_match[0][0]:
        action_input = args_match[0][1]
        if action_input[-1] in '])': action_input = action_input[:-1]
    
    # special judgement for finish action
    if action_name == 'finish_action':
        response_pattern = r'\{?[\'\"]?response[\'\"]?[:=].*?[\'\"](.*)'
        response_match = re.findall(response_pattern, action_input)
        action_input = response_match[0] if len(response_match) > 0 else ''
        action_input = action_input[:-1] if action_input != '' and action_input[-1] == '}' else action_input
        action_input = action_input[:-1] if action_input != '' and action_input[-1] in '\'\"' else action_input

    return thought, action_name, action_input


def format_response(action_return) -> str:
    return f'Observation:{action_return}' 

    