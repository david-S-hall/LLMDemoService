#! /bin/bash
SHELL_FOLDER=$(dirname $(readlink -f "$0"))
CACHE_DIR=$SHELL_FOLDER/cache

if ! test -e $CACHE_DIR; then
    mkdir $CACHE_DIR
fi

# 安装环境
apt-get install -y curl
curl -sL https://deb.nodesource.com/setup_20.x | bash -
apt-get update
apt-get install -y mongodb
apt-get install -y nodejs
apt-get install -y npm

npm config set registry https://registry.npmmirror.com
npm install next -g
npm install yarn -g --force
yarn config set registry https://registry.npmmirror.com --global

pip install -r requirements.txt

if ! test -e /etc/supervisor; then
    mkdir /etc/supervisor
fi
rm /etc/supervisor/supervisord.conf
ln -s $SHELL_FOLDER/configs/supervisor/supervisord.conf /etc/supervisor/supervisord.conf

# 运行基础服务
service mongodb start
python -m scripts.build_runtime_config
supervisord -c configs/supervisor/supervisord.conf