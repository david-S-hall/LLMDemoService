import requests
import json
from typing import Annotated

from .base import register_tool

__all__ = ['call_sd_api']


API_URL = "https://stablediffusionapi.com/api/v3/text2img"
API_KEY = ''

@register_tool
def call_sd_api(
    prompt: Annotated[str, 'Text prompt for generating image, keywords separate by comma.', True],
) -> str:
    """
    Generate a 512*512 image described as `prompt` by stable diffusion api.
    """

    payload = json.dumps({
        "key": API_KEY,
        "prompt": prompt,
        "negative_prompt": None,
        "width": "512",
        "height": "512",
        "samples": "1",
        "num_inference_steps": "20",
        "seed": None,
        "guidance_scale": 7.5,
        "safety_checker": 'yes',
        "multi_lingual": "no",
        "panorama": "no",
        "self_attention": "no",
        "upscale": "no",
        "embeddings_model": None,
        "webhook": None,
        "track_id": None
    })

    headers = {'Content-Type': 'application/json'}

    try:
        response = requests.request("POST", API_URL, headers=headers, data=payload)
        payback = json.loads(response.text)
        img_link = payback['output'][0]
        return str({'markdown_link': f'![image]({img_link}'})
    except Exception as e:
        return '图片生成失败，检查配置'
