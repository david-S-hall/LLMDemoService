from .base import get_tool_descriptions, use_tool, AgentToolBox

from . import (
    weather,
    random_num,
    wikipedia,
    stable_diffusion,
)


class DefaultAgentToolBox(AgentToolBox):

    def __init__(self):
        import importlib

        for module in [weather,
                       random_num,
                       wikipedia,
                       stable_diffusion]:
    
            importlib.reload(module)
            if "__all__" not in module.__dict__: continue

            for func_name in module.__dict__['__all__']:
                self.register_tool(getattr(module, func_name))


__all__ = [
    'DefaultAgentToolBox', 'AgentToolBox',
    'get_tool_descriptions', 'use_tool',
]
