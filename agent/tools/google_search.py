import requests
from typing import Annotated
from .base import register_tool

__all__ = ['search_google']


API_KEY = ''

# Referencing source code https://github.com/InternLM/lagent/blob/main/lagent/actions/google_search.py
# Register and create a free API key at https://serper.dev.

@register_tool
def search_google(
    query: Annotated[str, 'The query text for searching', True],
) -> str:
    """
    Search information about `query` on Google search engine
    """
    
    num_results = 5
    search_type = 'search'
    
    response = requests.post(
        f'https://google.serper.dev/{search_type}',
        headers={
            'X-API-KEY': API_KEY,
            'Content-Type': 'application/json',
        },
        params={
            'q': query,
            'k': num_results
        },
        timeout=5
    )
    
    if response.status_code != 200:
        return "No matched Google search Result."
 
    snippets = _parse_results(response.json())
    
    if len(snippets) == 0:
        return 'No good Google Search Result was found'
    
    return str({'snippets': snippets})


def _parse_results(results):
    snippets = []

    if results.get('answerBox'):
        answer_box = results.get('answerBox', {})
        if answer_box.get('answer'):
            return [answer_box.get('answer')]
        elif answer_box.get('snippet'):
            return [answer_box.get('snippet').replace('\n', ' ')]
        elif answer_box.get('snippetHighlighted'):
            return answer_box.get('snippetHighlighted')

    if results.get('knowledgeGraph'):
        kg = results.get('knowledgeGraph', {})
        title = kg.get('title')
        entity_type = kg.get('type')
        if entity_type:
            snippets.append(f'{title}: {entity_type}.')
        description = kg.get('description')
        if description:
            snippets.append(description)
        for attribute, value in kg.get('attributes', {}).items():
            snippets.append(f'{title} {attribute}: {value}.')

    for result in results[self.result_key_for_type[
            self.search_type]][:self.k]:
        if 'snippet' in result:
            snippets.append(result['snippet'])
        for attribute, value in result.get('attributes', {}).items():
            snippets.append(f'{attribute}: {value}.')

    return snippets