import requests
import json
import random
from typing import Annotated

from .base import register_tool

__all__ = ['call_sd_api']


API_URL = "https://stablediffusionapi.com/api/v3/text2img"
API_KEY = ''

# API_URL = 'http://0.0.0.0:7860/api/v1/text2img'

@register_tool
def call_sd_api(
    prompt: Annotated[str, 'Text for generating image, using `English` keywords separated by comma.', True],
) -> str:
    """
    Generate a image described as `prompt` in English.
    """
    
    height, width = random.choices([(512, 512), (768, 512), (512, 768)], weights=[6, 2, 2])[0]

    payload = json.dumps({
        "key": API_KEY,
        "prompt": prompt,
        "negative_prompt": '',
        "height": height,
        "width": width,
        "samples": 1,
        "num_inference_steps": 30,
        "guidance_scale": 8,
        "safety_checker": "yes",
        "multi_lingual": "no",
        "panorama": "no",
        "self_attention": "no",
        "upscale": "no"
    })

    headers = {'Content-Type': 'application/json'}

    try:
        response = requests.request("POST", API_URL, headers=headers, data=payload)
        payback = json.loads(response.text)
        img_link = payback['output'][0]
        # return str({'markdown_link': f'![image]({img_link}'})
        return str({'image_link': f'![image]({img_link}'})
        # return str({'image_link': f'<img src="{img_link}" alt="image" />'})
    except Exception as e:
        return '图片生成失败，检查配置'
