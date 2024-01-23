import re

from .tools import DefaultAgentToolBox
from .lm_template import LMTemplateParser
from .transform import trans_agent_history


# Referencing https://github.com/InternLM/lagent/blob/main/lagent/agents/rewoo.py


# The Chinese Prompts for ReWOO

PLANNER_PROMPT_ZH = """你是一个任务分解器, 你需要将用户的问题拆分成多个简单的子任务。
请拆分出多个子任务项，从而能够得到充分的信息以解决问题, 返回格式参考如下案例：
```
Plan: 当前子任务要解决的问题
#E0 = func_1[param1='a']
Plan: 当前子任务要解决的问题
#E1 = func_2[#E1]
```\n
其中对于一条#E[id] = 工具名称[工具参数]:
1. #E[id] 用于存储Plan id的执行结果, 可被用作占位符。
2. 每个 #E[id] 所执行的内容应与当前Plan解决的问题严格对应。
3. 工具参数可以是正常输入text, 或是 #E[依赖的索引], 或是两者都可以。
4. 工具名称必须从以下工具中选择：
{tool_description}\n-----
注意：每个Plan后有且仅有一个#E[id]。
开始！"""

WORKER_PROMPT_ZH = """
想法: {thought}\n回答: {action_resp}\n
"""

SOLVER_PROMPT_ZH = """解决接下来的任务或者问题。为了帮助你，我们提供了一些相关的计划
和相应的解答。注意其中一些信息可能存在噪声，因此你需要谨慎的使用它们。\n
{question}\n{worker_log}现在开始根据以上信息回答这个任务或者问题
---------"""

REFORMAT_PROMPT_ZH = """回答格式错误: {err_msg}。 请重新回答:
"""

# The English prompts for ReWOO

PLANNER_PROMPT_EN = """You are a task decomposer, and you need
to break down the user's problem into multiple simple subtasks.
Please split out multiple subtask items so that sufficient
information can be obtained to solve the problem.
The return format is as follows:
```
Plan: the problem to be solved by the current subtask
#E0 = func_1[param1='a']
Plan: the problem to be solved by the current subtask
#E1 = func_2[#E1]
```\n
For each `#E[id] = tool_name[tool_param]`:
1. #E[id] is used to store the execution result of the plan
id and can be used as a placeholder.
2. The content implemented by each #E[id] should strictly
correspond to the problem currently planned to be solved.
3. Tool parameters can be entered as normal text, or
#E[dependency_id], or both.
4. The tool name must be selected from the tool:
{tool_description}.\n-----
Note: Each plan should be followed by only one #E.
Start! """

WORKER_PROMPT_EN = """
Thought: {thought}\nResponse: {action_resp}\n
"""

SOLVER_PROMPT_EN = """Solve the following task or problem.
To assist you, we provide some plans and corresponding evidences
that might be helpful. Notice that some of these information
contain noise so you should trust them with caution.\n
{question}\n{worker_log}Now begin to solve the task or problem.
Respond with the answer directly with no extra words.
---------"""

SOLVER_PROMPT_ZH = """解决接下来的任务或者问题。为了帮助你，我们提供了一些相关的计划
和相应的解答。注意其中一些信息可能存在噪声，因此你需要谨慎的使用它们。\n
{question}\n{worker_log}现在开始根据以上信息回答这个任务或者问题
---------"""

REFORMAT_PROMPT_ZH = """回答格式错误: {err_msg}。 请重新回答:
"""


REFORMAT_PROMPT_EN = """Response Format Error: {err_msg}. Please reply again:
"""


META_TEMPLATE = [
    dict(role='system', begin='<|System|>:', end='\n'),
    dict(role='user', begin='<|User|>:', end='\n'),
    dict(
        role='assistant',
        begin='<|Bot|>:',
        end='<eoa>\n',
        generate=True)
]


def rewoo_agent_chat(llm, query, chat_history=[], lang='ZH', max_turn=2, **gen_kwargs):
    assert lang.upper() in ['ZH', 'EN']

    dialog_formatter = LMTemplateParser(META_TEMPLATE)
    toolbox = DefaultAgentToolBox()

    total_response = ""
    reformat_request = ''
    chat_history = trans_agent_history(chat_history)
    inner_history = [dict(role='user', content=query)]
    
    thoughts, actions = [], []
    actions_input, actions_response = [], []
    for turn_idx in range(max_turn):
        planner = format_planner(chat_history, inner_history, toolbox.get_tool_descriptions(), reformat_request, lang=lang)      
        planner_prompt = dialog_formatter.parse_template(planner)
        response, _ = llm.chat(planner_prompt, history=[], temperature=0.1)
        inner_history.append(dict(role='assistant', content=response))
        
        try:
            thoughts, actions, actions_input = parse_worker(response)
            break
        except Exception as e:
            reformat_request = str(e)
    
    def trans_param_dict(param_text):
        try:
            params = eval(f'dict({param_text})')
        except Exception as e:
            params = param_text
        return params

    for action_id in range(len(actions)):
        total_response += '[TOOLPENDING]'
        yield total_response, chat_history

        prev_ptrs = re.findall(r'#E\d+', actions_input[action_id])

        for prev_ptr in prev_ptrs:
            ptr_num = int(prev_ptr.strip('#E')) - 1  # start from 0
            actions_input[action_id] = actions_input[action_id].replace(
                prev_ptr, actions_response[ptr_num])

        try:
            action_return = toolbox.use_tool(actions[action_id], trans_param_dict(actions_input[action_id]))
        except Exception as e:
            action_return = 'Invalid tool usage'
        actions_response.append(action_return)

        total_response += '[TOOLDONE]'
        yield total_response, chat_history
    

    solver_prompt, worker_log = format_solver(query, thoughts, actions_response, lang=lang)
    inner_history.append(dict(role='system', content=worker_log))
    
    chat_history.append(dict(role='user', content=query))
    chat_history.append(dict(role='assistant', content=''))
    final_prompt = dialog_formatter.parse_template(solver_prompt)

    for final_response, _ in llm.stream_chat(final_prompt, history=[], **gen_kwargs):
        chat_history[-1]['content'] = final_response
        yield total_response+final_response, chat_history


def format_planner(chat_history, inner_history, tool_description, reformat_request='', lang='ZH'):
    planner_prompt = globals()[f'PLANNER_PROMPT_{lang.upper()}'].format(tool_description=tool_description)
    formatted = [dict(role='system', content=planner_prompt)]
    formatted += chat_history
    formatted += inner_history
    if reformat_request != '':
        formatted.append(dict(
            role='system',
            content=globals()[f'REFORMAT_PROMPT_{lang.upper()}'].format(err_msg=reformat_request)
        ))
    return formatted


def parse_worker(message):
    """Parse the LLM generated planner response and convert it into the
    worker format.

    Args:
        message (str): The response from LLM with ReWOO planner format.

    Returns:
        tuple: the return value is a tuple contains:
            - thought_list (List(str)): contain LLM thoughts of the user
                request.
            - action_list (List(str)): contain actions scheduled by LLM.
            - action_input_list (List(str)): contain the required action
                    input for above actions.
    """
    action_list = []
    action_input_list = []
    thought_list = []
    thoughts = re.findall('Plan: (.+)', message)
    action_units = re.findall('#E[0-9]* = (.+)', message)
    assert len(thoughts) == len(action_units), \
        'Each Plan should only correspond to only ONE action'
    for thought, action_unit in zip(thoughts, action_units):
        # action_name, action_input = re.findall(r'(.*?)\[(.*?)\]',
        #                                         action_unit.strip())[0]
        action_name, action_input = re.findall(r'(.*?)[\[(](.*?)[\])]',
                                                action_unit.strip())[0]
        action_list.append(action_name.strip())
        action_input_list.append(action_input.strip())
        thought_list.append(thought.strip())
    return thought_list, action_list, action_input_list


def format_solver(question, thought_list, action_return_list, lang='ZH'):
    """Generate the prompt for solver in a ReWOO format.

    Args:
        question (str): The user request in the current run.
        thought_list (List[str]): thoughts generated from LLM for
            each action.
        action_return_list (List[ActionReturn]): action returns
            from workers.

    Returns:
        tuple: the return value is a tuple contains:
            - solver_prompt (str): the generated prompt for solver
                    in a ReWOO format.
            - worker_log (str): contain action responses from workers.
                Used for inner log.
    """
    worker_log = ''
    for thought, action_return in zip(thought_list, action_return_list):
        worker_response = globals()[f'WORKER_PROMPT_{lang.upper()}'].format(
            thought=thought, action_resp=action_return)
        worker_log += worker_response
    solver_prompt = globals()[f'SOLVER_PROMPT_{lang.upper()}'].format(question=question, worker_log=worker_log)
    return solver_prompt, worker_log