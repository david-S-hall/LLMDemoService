from typing import Annotated
from .base import register_tool

__all__ = ['random_number_generator']

@register_tool
def random_number_generator(
        seed: Annotated[int, 'The random seed used by the generator', True],
        range: Annotated[tuple[int, int], 'The range of the generated numbers', True],
) -> int:
    """
    Generates a random number x, s.t. range[0] <= x < range[1]
    """
    if not isinstance(seed, int):
        raise TypeError("Seed must be an integer")
    if not isinstance(range, (tuple, list)):
        raise TypeError("Range must be a tuple")
    if not isinstance(range[0], int) or not isinstance(range[1], int):
        raise TypeError("Range must be a tuple of integers")

    import random
    return random.Random(seed).randint(*range)