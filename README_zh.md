# A Simple LLM DEMO Service for Deployment

## 安装环境

```bash
./install.sh
```

## 启动demo

### 一键启动
```bash
./run.sh
```

### 开发模式

#### LLM & embedding
```bash
./run.sh model stop (可选,如后台模式未开启跳过此步)
./run.sh model dev
```

#### 视图层
```bash
./run.sh view stop (可选,如后台模式未开启跳过此步)
./run.sh view dev
```

#### 前端
```bash
./run.sh frontend dev
```

## 服务配置

### LLM服务
- 默认端口10080
- 可通过修改configs/global.yml的api一节修改配置主机端口

### MongoDB
- 通过`/etc/mongodb.conf`修改端口等配置，用`systemctl`或`service`启动或重启mongodb服务
- **（必需）** 将mongodb的主机和端口填在`configs/global.yml`的`mongo`对应一节

## 服务维护

### 服务重启

**后端模型层**
```bash
./run.sh model restart
```

**后端视图层**
```bash
./run.sh view restart
```

### 反馈结果处理

**导出**
```bash
python -m scripts.history_data_process --operation export --output_dir $EXPORT_DIR --output_name $EXPORT_NAME --split_size $SPLIT_SIZE
```

- EXPORT_DIR: 导出反馈结果目录
- EXPORT_NAME: 导出反馈结果文件名（不含后缀名，自动为`.jsonl`）
- SPLIT_SIZE: 导出单个文件结果条数，默认0
    - 0: 全部存储在一个文件`{EXPORT_NAME}.jsonl`里
    - \>0: 存储在名为`{EXPORT_NAME}_{idx}.jsonl`的分块文件里，每个文件SPLIT_SIZE条数据

**清空**
```bash
python -m scripts.history_data_process --operation delete
```
