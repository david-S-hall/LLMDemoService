import os
import json
import yaml
from urllib.parse import urljoin

from arguments import *


if __name__ == '__main__':
    main_dir = os.getcwd()
    
    supervisor_cfg_dir = os.path.join(main_dir, 'configs/supervisor')
    
    # Building model app configuration
    with open(os.path.join(supervisor_cfg_dir, 'model_supervisor.conf'), 'w') as f:
        f.write('[program:model_app]\n' \
                'startsecs=600\n' \
                f'directory={main_dir}\n' \
                'command=gunicorn backend.model_app:app -c configs/backend/model_app_conf.py\n')
    
    # Building view app configuration
    with open(os.path.join(supervisor_cfg_dir, 'view_supervisor.conf'), 'w') as f:
        f.write('[program:view_app]\n' \
                'startsecs=30\n' \
                f'directory={main_dir}\n' \
                'command=gunicorn backend.view_app:app -c configs/backend/view_app_conf.py\n')

    # Building frontend configuration
    
    # api route
    with open(os.path.join(main_dir, frontend_route_def), 'r') as f:
        routes = yaml.load(f, Loader=yaml.CLoader)
        base_url = 'http://'+api_config.view['url']
        for k, v in routes.items():
            if isinstance(v, str):
                routes[k] = urljoin(base_url, v)
        routes['url'] = base_url
        with open(os.path.join(main_dir, 'frontend/config', 'route.json'), 'w') as fout:
            fout.write(json.dumps(routes))
    
    with open(os.path.join(cache_dir, 'FRONTEND_PORT'), 'w') as f:
        f.write(str(api_config.ui['port']))

    # next-auth oauth env
    with open(os.path.join(main_dir, 'frontend', '.env.local'), 'w') as f:
        for k, v in frontend_config['env'].items():
            f.write(f'{k}="{v}"\n')
        