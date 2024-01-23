import inspect
import traceback
from copy import deepcopy
from pprint import pformat
from types import GenericAlias
from typing import get_origin, Annotated

_TOOL_HOOKS = {}
_TOOL_DESCRIPTIONS = {}


def register_tool(func: callable):
    tool_name = func.__name__
    tool_description = inspect.getdoc(func).strip()
    python_params = inspect.signature(func).parameters
    tool_params = {
        "type": "object",
        "properties": {},
        "required": []
    }
    for name, param in python_params.items():
        annotation = param.annotation
        if annotation is inspect.Parameter.empty:
            raise TypeError(f"Parameter `{name}` missing type annotation")
        if get_origin(annotation) != Annotated:
            raise TypeError(f"Annotation type for `{name}` must be typing.Annotated")

        typ, (description, required) = annotation.__origin__, annotation.__metadata__
        typ: str = str(typ) if isinstance(typ, GenericAlias) else typ.__name__
        if not isinstance(description, str):
            raise TypeError(f"Description for `{name}` must be a string")
        if not isinstance(required, bool):
            raise TypeError(f"Required for `{name}` must be a bool")

        if required:
            tool_params['required'].append(name)
        tool_params['properties'][name] = {
            "type": typ,
            "description": description
        }

    tool_def = {
        "name": tool_name,
        "description": tool_description,
        "parameters": tool_params
    }

    # print("[registered tool] " + pformat(tool_def))
    _TOOL_HOOKS[tool_name] = func
    _TOOL_DESCRIPTIONS[tool_name] = tool_def

    return func


def use_tool(tool_name: str, tool_params: dict) -> str:
    if tool_name not in _TOOL_HOOKS:
        return f"Tool `{tool_name}` not found. Please use a provided tool."
    tool_call = _TOOL_HOOKS[tool_name]
    try:
        ret = tool_call(**tool_params)
    except:
        ret = traceback.format_exc()
    return str(ret)


def get_tool_descriptions(choices=None) -> dict:
    if choices is None:
        return deepcopy(_TOOL_DESCRIPTIONS)
    else:
        assert isinstance(choices, list)
        temp_descriptions = {}
        for name in choices:
            if name in _TOOL_DESCRIPTIONS:
                temp_descriptions[name] = _TOOL_DESCRIPTIONS[name]
        return temp_descriptions


class AgentToolBox(object):
    _TOOL_HOOKS = {}
    _TOOL_DESCRIPTIONS = {}

    def register_tool(self, func: callable):
        tool_name = func.__name__
        tool_description = inspect.getdoc(func).strip()
        python_params = inspect.signature(func).parameters
        tool_params = {
            "type": "object",
            "properties": {},
            "required": []
        }
        for name, param in python_params.items():
            annotation = param.annotation
            if annotation is inspect.Parameter.empty:
                raise TypeError(f"Parameter `{name}` missing type annotation")
            if get_origin(annotation) != Annotated:
                raise TypeError(f"Annotation type for `{name}` must be typing.Annotated")

            typ, (description, required) = annotation.__origin__, annotation.__metadata__
            typ: str = str(typ) if isinstance(typ, GenericAlias) else typ.__name__
            if not isinstance(description, str):
                raise TypeError(f"Description for `{name}` must be a string")
            if not isinstance(required, bool):
                raise TypeError(f"Required for `{name}` must be a bool")

            if required:
                tool_params['required'].append(name)
            tool_params['properties'][name] = {
                "type": typ,
                "description": description
            }

        tool_def = {
            "name": tool_name,
            "description": tool_description,
            "parameters": tool_params
        }

        # print("[registered tool] " + pformat(tool_def))
        self._TOOL_HOOKS[tool_name] = func
        self._TOOL_DESCRIPTIONS[tool_name] = tool_def

        return func


    def use_tool(self, tool_name: str, tool_params: dict) -> str:
        if tool_name not in self._TOOL_HOOKS:
            return f"Tool `{tool_name}` not found. Please use a provided tool."
        tool_call = self._TOOL_HOOKS[tool_name]
        try:
            ret = tool_call(**tool_params)
        except:
            ret = traceback.format_exc()
        return str(ret)


    def get_tool_descriptions(self, choices=None) -> dict:
        if choices is None:
            return deepcopy(self._TOOL_DESCRIPTIONS)
        else:
            assert isinstance(choices, list)
            temp_descriptions = {}
            for name in choices:
                if name in self._TOOL_DESCRIPTIONS:
                    temp_descriptions[name] = self._TOOL_DESCRIPTIONS[name]
            return temp_descriptions