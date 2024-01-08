import os
import json
from typing import Dict, Union, List, Optional

import torch

from accelerate import load_checkpoint_and_dispatch
from langchain.llms.base import LLM
from transformers import AutoModel, AutoTokenizer, AutoConfig
from transformers.generation.logits_process import LogitsProcessor
from transformers.generation.utils import LogitsProcessorList


class ChatGLMCFG:
    num_gpus = 1

    multi_gpu_model_cache_dir = "./temp_model_dir"
    llm_name_or_path = 'THUDM/chatglm3-6b'  # 本地模型文件 or huggingface远程仓库
    fp16 = True
    quantization_bit = None

    ptuning_checkpoint = None
    pre_seq_len = None
    prefix_projection = False

DEFAULT_CFG = ChatGLMCFG()


class InvalidScoreLogitsProcessor(LogitsProcessor):
    def __call__(self, input_ids: torch.LongTensor, scores: torch.FloatTensor) -> torch.FloatTensor:
        if torch.isnan(scores).any() or torch.isinf(scores).any():
            scores.zero_()
            scores[..., 5] = 5e4
        return scores


def build_chat_input(tokenizer, query, history=None, role="user", metadata=''):
    if history is None:
        history = []
    input_ids = []
    for item in history:
        content = item["content"]
        if item["role"] == "system" and "tools" in item:
            content = content + "\n" + json.dumps(item["tools"], indent=4, ensure_ascii=False)
        input_ids.extend(tokenizer.build_single_message(item["role"], item.get("metadata", ""), content))
    input_ids.extend(tokenizer.build_single_message(role, metadata, query))
    input_ids.extend([tokenizer.get_command("<|assistant|>")])
    return tokenizer.batch_encode_plus([input_ids], return_tensors="pt", is_split_into_words=True)


class ChatGLMService(LLM):
    max_length: int = 8192
    tokenizer: object = None
    model: object = None

    def __init__(self):
        super().__init__()

    @property
    def _llm_type(self) -> str:
        return "ChatGLM"

    def _stream_call(self,
                     query: str,
                     history: List[Dict] = None,
                     role: str = "user",
                     past_key_values=None,
                     max_length: int = 8192,
                     do_sample=True,
                     top_p=0.8,
                     temperature=0.8,
                     logits_processor=None,
                     return_past_key_values=False,
                     **kwargs) -> str:

        for payload in self.model.stream_chat(self.tokenizer, query, history,
                                              role, past_key_values, max_length,
                                              do_sample, top_p, temperature,
                                              logits_processor, return_past_key_values, **kwargs):
            yield payload[0], payload[1]

    def _call(self,
              query,
              history=None,
              role='user',
              metadata='',
              num_beams=1,
              do_sample=True,
              top_p=0.8,
              temperature=0.1,
              logits_processor = None,
              **kwargs) -> str:

        # response, _ = self.model.chat(
        #     self.tokenizer,
        #     query,
        #     history=[], #self.history,
        #     temperature=self.temperature,
        #     max_length=self.max_length,
        #     **kwargs
        # )

        history = [] if history is None else history

        if logits_processor is None:
            logits_processor = LogitsProcessorList()
        logits_processor.append(InvalidScoreLogitsProcessor())

        gen_kwargs = {"max_length": self.max_length, "num_beams": num_beams, "do_sample": do_sample, "top_p": top_p,
                      "temperature": temperature, "logits_processor": logits_processor, **kwargs}
        inputs = build_chat_input(self.tokenizer, query, history=history, role=role, metadata=metadata)
        inputs = inputs.to(self.model.device)
        eos_token_id = [self.tokenizer.eos_token_id, self.tokenizer.get_command("<|user|>"),
                        self.tokenizer.get_command("<|observation|>")]
        outputs = self.model.generate(**inputs, **gen_kwargs, eos_token_id=eos_token_id)
        outputs = outputs.tolist()[0][len(inputs["input_ids"][0]):-1]
        response = self.tokenizer.decode(outputs)

        history.append({"role": role, "content": query})
        response, history = self.model.process_response(response, history)

        return response, history

    def load_model(self, model_args=DEFAULT_CFG):
        self.model = self._load_model(model_args)
        if model_args.num_gpus > 1:
            self.load_model_on_gpus(model_args.llm_name_or_path,
                                    model_args.num_gpus,
                                    model_args.multi_gpu_model_cache_dir)
        else:
            self.model = self.model.cuda()
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_args.llm_name_or_path,
                trust_remote_code=True
            )
    
    def _load_model(self, model_args):
        config = AutoConfig.from_pretrained(model_args.llm_name_or_path, trust_remote_code=True)
        config.pre_seq_len = model_args.pre_seq_len
        config.prefix_projection = model_args.prefix_projection
        
        model = AutoModel.from_pretrained(model_args.llm_name_or_path, config=config, trust_remote_code=True)
        if model_args.ptuning_checkpoint is not None:
            print("Loading ptuning model.")
            prefix_state_dict = torch.load(os.path.join(model_args.ptuning_checkpoint, "pytorch_model.bin"))
            new_prefix_state_dict = {}
            for k, v in prefix_state_dict.items():
                if k.startswith("transformer.prefix_encoder."):
                    new_prefix_state_dict[k[len("transformer.prefix_encoder."):]] = v
            model.transformer.prefix_encoder.load_state_dict(new_prefix_state_dict, strict=True)
        
        if model_args.quantization_bit is not None:
            print(f"Quantized to {model_args.quantization_bit} bit")
            model = model.quantize(model_args.quantization_bit)
        
        if model_args.pre_seq_len is not None:
            # P-tuning v2
            model = model.half()
            model.transformer.prefix_encoder.float()
        else:
            # Finetune
            if model_args.fp16:
                model = model.half()
            else:
                model = model.float()
        model = model.eval()
        
        return model

    def auto_configure_device_map(self, num_gpus: int) -> Dict[str, int]:
        # transformer.word_embeddings 占用1层
        # transformer.final_layernorm 和 lm_head 占用1层
        # transformer.layers 占用 28 层
        # 总共30层分配到num_gpus张卡上
        num_trans_layers = 28
        per_gpu_layers = 30 / num_gpus

        # bugfix: 在linux中调用torch.embedding传入的weight,input不在同一device上,导致RuntimeError
        # windows下 model.device 会被设置成 transformer.word_embeddings.device
        # linux下 model.device 会被设置成 lm_head.device
        # 在调用chat或者stream_chat时,input_ids会被放到model.device上
        # 如果transformer.word_embeddings.device和model.device不同,则会导致RuntimeError
        # 因此这里将transformer.word_embeddings,transformer.final_layernorm,lm_head都放到第一张卡上
        device_map = {'transformer.word_embeddings': 0,
                      'transformer.final_layernorm': 0, 'lm_head': 0}

        used = 2
        gpu_target = 0
        for i in range(num_trans_layers):
            if used >= per_gpu_layers:
                gpu_target += 1
                used = 0
            assert gpu_target < num_gpus
            device_map[f'transformer.layers.{i}'] = gpu_target
            used += 1

        return device_map

    def load_model_on_gpus(self,
                           model_name_or_path: Union[str, os.PathLike], num_gpus: int = 2,
                           multi_gpu_model_cache_dir: Union[str, os.PathLike] = "./temp_model_dir",
                           ):
        # https://github.com/THUDM/ChatGLM-6B/issues/200
        self.model = AutoModel.from_pretrained(model_name_or_path, trust_remote_code=True)
        self.model = self.model.eval()

        device_map = self.auto_configure_device_map(num_gpus)
        try:
            self.model = load_checkpoint_and_dispatch(
                self.model, model_name_or_path, device_map=device_map, offload_folder="offload",
                offload_state_dict=True).half()
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_name_or_path,
                trust_remote_code=True
            )
        except ValueError:
            # index.json not found
            print(f"index.json not found, auto fixing and saving model to {multi_gpu_model_cache_dir} ...")

            assert multi_gpu_model_cache_dir is not None, "using auto fix, cache_dir must not be None"
            self.model.save_pretrained(multi_gpu_model_cache_dir, max_shard_size='2GB')
            self.model = load_checkpoint_and_dispatch(
                self.model, multi_gpu_model_cache_dir, device_map=device_map,
                offload_folder="offload", offload_state_dict=True).half()
            self.tokenizer = AutoTokenizer.from_pretrained(
                multi_gpu_model_cache_dir,
                trust_remote_code=True
            )
            print(f"loading model successfully, you should use checkpoint_path={multi_gpu_model_cache_dir} next time")

# if __name__ == '__main__':
#     config = LangChainCFG()
#     chatLLM = ChatGLMService()
#     chatLLM.load_model(model_name_or_path=config.llm_model_name)