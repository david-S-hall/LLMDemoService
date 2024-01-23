from typing import Dict, List
import torch
from langchain.llms.base import LLM
from transformers import AutoTokenizer, AutoModelForCausalLM

from agent.transform import trans_general_history


class InternLMCFG:
    num_gpus = 1

    llm_name_or_path = 'internlm/internlm2-chat-7b'
    fp16 = False
    quantization_bit = None


DEFAULT_CFG = InternLMCFG()


class InternLMService(LLM):
    max_length: int = 8192
    tokenizer: object = None
    model: object = None

    def __init__(self):
        super().__init__()

    @property
    def _llm_type(self) -> str:
        return "InternLM"

    def _stream_call(self,
                     query: str,
                     history: List[Dict] = None,
                     role: str = None,
                     max_length: int = 8192,
                     do_sample=True,
                     top_p=0.8,
                     temperature=0.8,
                     **kwargs) -> str:

        history = trans_general_history(history) if history is not None else history
        for response, history in self.model.stream_chat(self.tokenizer, query, history, max_length,
                                                        do_sample, temperature, top_p, **kwargs):
            yield response, history

    def _call(self,
              query,
              history=None,
              role=None,
              do_sample=True,
              top_p=0.8,
              temperature=0.1,
              **kwargs) -> str:
        
        history = trans_general_history(history) if history is not None else history
        response, history = self.model.chat(
            self.tokenizer,
            query,
            history=history,
            do_sample=do_sample,
            temperature=temperature,
            top_p=top_p,
            **kwargs
        )

        return response, history
    
    def load_model(self, model_args=DEFAULT_CFG):
        base_cfg = DEFAULT_CFG
        for k, v in model_args.items():
            setattr(base_cfg, k, v)
        model_args = base_cfg

        load_config = {}
        if model_args.fp16:
            load_config['torch_dtype'] = torch.float16
        
        tokenizer = AutoTokenizer.from_pretrained("internlm/internlm2-chat-7b", trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(model_args.llm_name_or_path, trust_remote_code=True, **load_config).cuda()
    
        if model_args.quantization_bit is not None:
            print(f"Quantized to {model_args.quantization_bit} bit")
            model = model.quantize(model_args.quantization_bit)
        
        model = model.eval()
        
        self.tokenizer = tokenizer
        self.model = model
