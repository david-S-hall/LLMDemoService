import os
import shutil
from configparser import ConfigParser

if __name__ == '__main__':
    main_dir = os.getcwd()
    
    supervisor_cfg_dir = os.path.join(main_dir, 'configs/supervisor')
    
    if not os.path.exists('/etc/supervisor'):
        os.makedirs('/etc/supervisor')
    
    if not os.path.exists('/etc/supervisor/supervisord.conf'):
        shutil.copy(os.path.join(supervisor_cfg_dir, 'supervisord.conf'),
                    '/etc/supervisor/supervisord.conf')
    else:
        supervisor_cfg = ConfigParser()
        supervisor_cfg.read('/etc/supervisor/supervisord.conf')
        
        sub_cfg_path = os.path.join(main_dir, 'configs', 'supervisor', '*_supervisor.conf')
        cur_sub_files = supervisor_cfg.get('include', 'files').split(' ')
        if sub_cfg_path not in cur_sub_files:
            cur_sub_files.append(sub_cfg_path)
        cur_sub_files = ' '.join(cur_sub_files)
        
        supervisor_cfg.set('include', 'files', cur_sub_files)
        with open('/etc/supervisor/supervisord.conf', 'w') as f:
            supervisor_cfg.write(f)