from .base import get_tool_descriptions, use_tool, AgentToolBox
from . import (
    weather,
    random_num,
    wikipedia,
    google_search,
    stable_diffusion,
)


class DefaultAgentToolBox(AgentToolBox):

    def __init__(self):
        from arguments import agent_func_list
        import importlib

        for module in [
                       weather,
                       wikipedia,
                       stable_diffusion,
                       random_num,
                       google_search,]:
    
            importlib.reload(module)
            if "__all__" not in module.__dict__: continue

            for func_name in module.__dict__['__all__']:
                if func_name not in agent_func_list: continue
                self.register_tool(getattr(module, func_name))


__all__ = [
    'DefaultAgentToolBox', 'AgentToolBox',
    'get_tool_descriptions', 'use_tool',
]
