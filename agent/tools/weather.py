from typing import Annotated
from pypinyin import pinyin
from .base import register_tool


__all__ = ['get_weather']


def is_contains_chinese(strs):
    for _char in strs:
        if '\u4e00' <= _char <= '\u9fa5':
            return True
    return False

@register_tool
def get_weather(
        city_name: Annotated[str, 'The name of the city to be queried.', True],
) -> str:
    """
    Get the current weather of the `city_name` city.
    """

    if not isinstance(city_name, str):
        raise TypeError("City name must be a string")
    
    if is_contains_chinese(city_name):
        city_name = ''.join([w[0] for w in pinyin(city_name, style=0)])

    key_selection = {
        "current_condition": ["temp_C", "FeelsLikeC", "humidity", "weatherDesc", "observation_time"],
    }
    import requests
    try:
        resp = requests.get(f"https://wttr.in/{city_name}?format=j1")
        resp.raise_for_status()
        resp = resp.json()
        ret = {k: {_v: resp[k][0][_v] for _v in v} for k, v in key_selection.items()}
    except:
        import traceback
        ret = "Error encountered while fetching weather data!\n" + traceback.format_exc()

    return str(ret)