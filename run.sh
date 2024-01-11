#! /bin/bash
SHELL_FOLDER=$(dirname $(readlink -f "$0"))
CACHE_DIR=$SHELL_FOLDER/cache

cd $SHELL_FOLDER

function model_service_ops() {
    case $1 in
    dev)
        python -m backend.model_app
        ;;
    stop)
        supervisorctl stop model_app
        ;;
    restart)
        supervisorctl update
        supervisorctl restart model_app
        ;;
    *)
        supervisorctl update
        supervisorctl start model_app
        ;;
    esac
}

function view_service_ops() {
    case $1 in
    dev)
        python -m backend.view_app
        ;;
    stop)
        supervisorctl stop view_app
        ;;
    restart)
        supervisorctl update
        supervisorctl restart view_app
        ;;
    *)
        supervisorctl update
        supervisorctl start view_app
        ;;
    esac
}

function frontend_service_ops() {
    cd $SHELL_FOLDER/frontend
    case $1 in
    dev)
        # npm install
        yarn
        PORT=$FRONTEND_PORT npm run dev
        ;;
    *)
        yarn
        npx next build
        PORT=$FRONTEND_PORT npx next start
        ;;
    esac
}

# 生成配置文件

echo 'Building runtime configurations'
python -m scripts.build_runtime_config

FRONTEND_PORT=$(cat cache/FRONTEND_PORT)
rm cache/FRONTEND_PORT

case $1 in
model)
    echo 'Starting LLM & embedding service.'
    model_service_ops $2
    ;;
view)
    echo 'Starting view service for frontend.'
    view_service_ops $2
    ;;
frontend)
    echo 'Starting frontend service.'
    frontend_service_ops $2
    ;;
all)
    echo 'Starting entire service.'
    model_service_ops $2
    view_service_ops $2
    frontend_service_ops $2
    ;;
*)
    echo 'Unrecognized service name'
    ;;
esac
