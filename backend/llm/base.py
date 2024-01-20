from langchain.llms.base import LLM


class BaseLLMService(LLM):
    max_length: int = 8192
    tokenizer: object = None
    model: object = None