PROMPT_TEMPLATE = '''20个字以内概括以下文本的主题或话题：
--------
{query}
{response}
--------
总结:'''

def generate_summary(llm, query, response):
    prompt = PROMPT_TEMPLATE.format(query=query, response=response)
    summary, _ = llm.chat(prompt)
    print(summary)
    return summary.split('\n')[0]