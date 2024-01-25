import json
import re
from copy import deepcopy


def build_chat_input(tokenizer, query, history=None, role="user"):
    if history is None:
        history = []
    input_ids = []
    for item in history:
        content = item["content"]
        if item["role"] == "system" and "tools" in item:
            content = content + "\n" + json.dumps(item["tools"], indent=4, ensure_ascii=False)
        input_ids.extend(tokenizer.build_single_message(item["role"], item.get("metadata", ""), content))
    input_ids.extend(tokenizer.build_single_message(role, "", query))
    input_ids.extend([tokenizer.get_command("<|assistant|>")])
    return tokenizer.batch_encode_plus([input_ids], return_tensors="pt", is_split_into_words=True)


def process_response(output, history):
    content = ""
    history = deepcopy(history)

    for response in output.split("<|assistant|>"):
        if "\n" in response:
            metadata, content = response.split("\n", maxsplit=1)
        else:
            metadata, content = response, ""

        if not metadata.strip():
            content = content.strip()
            history.append({"role": "assistant", "metadata": metadata, "content": content})
            content = content.replace("[[训练时间]]", "2023年")
        else:
            history.append({"role": "assistant", "metadata": metadata, "content": content})
            if history[0]["role"] == "system" and "tools" in history[0]:
                
                def tool_call(**kwargs):
                    return kwargs
                try:
                    # content = "\n".join(content.split("\n")[1:-1])
                    # parameters = eval(content)
                    pattern = r'```([^\n]*)\n(.*?)```'
                    matches = re.findall(pattern, content, re.DOTALL)
                    parameters = eval(matches[-1][1])
                except:
                    parameters = '[PENDING]'
                content = {"name": metadata.strip(), "parameters": parameters}
            else:
                content = {"name": metadata.strip(), "content": content}

    return content, history