from typing import Annotated, Optional, Any
import wikipedia
from .base import register_tool

__all__ = ['search_wikipedia']

top_k_results: int = 3
lang: str = "en"
load_all_available_meta: bool = False
doc_content_chars_max: int = 4000

@register_tool
def search_wikipedia(
    query: Annotated[str, 'The query text for searching entity', True],
    lang: Annotated[str, 'Language of wikipedia site', False] = 'en',
    doc_content_chars_max: Annotated[int, 'Limitation on max char numbers of content', False] = 2000
) -> str:
    """
    Get the info of `query` on Wikipedia.
    """
    try:
        wikipedia.set_lang(lang)
    except:
        pass

    page_titles = wikipedia.search(query[:100])
    summaries = []
    for page_title in page_titles[: top_k_results]:
        if wiki_page := fetch_page(page_title):
            if summary := f"Page: {page_title}\nSummary: {wiki_page.summary}":
                summaries.append(summary)

    if not summaries:
        return "No good Wikipedia Search Result was found"

    return str({'summary': "\n\n".join(summaries)[: doc_content_chars_max]})


def fetch_page(page: str) -> Optional[str]:
    try:
        return wikipedia.page(title=page, auto_suggest=False)
    except (
        wikipedia.exceptions.PageError,
        wikipedia.exceptions.DisambiguationError,
    ):
        return None
