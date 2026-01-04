# 如故嵌入向量服务

本地 bge-m3 嵌入模型服务，用于生成用户资料的向量表示。

## 技术栈

- **模型**: BAAI/bge-m3 (1024维)
- **框架**: FastAPI
- **模型运行**: sentence-transformers + PyTorch

## 安装

### 1. 创建 Python 虚拟环境

```bash
cd embedding-service
uv venv
```

### 2. 安装依赖

```bash
uv pip install -r requirements.txt
```

## 运行

### 开发模式（自动重载）

```bash
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8765
```

### 生产模式

```bash
uv run uvicorn main:app --host 127.0.0.1 --port 8765
```

## API 端点

### 健康检查

```bash
curl http://127.0.0.1:8765/
```

### 生成嵌入向量

```bash
curl -X POST http://127.0.0.1:8765/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "bge-m3",
    "input": "你好，世界"
  }'
```

响应格式：

```json
{
  "data": [
    {
      "embedding": [0.123, -0.456, ...],  // 1024维数组
      "index": 0,
      "object": "embedding"
    }
  ],
  "model": "bge-m3",
  "usage": {
    "prompt_tokens": 2,
    "total_tokens": 2
  }
}
```

## 配置

在项目根目录的 `.env` 文件中设置：

```bash
EMBEDDING_API_URL=http://127.0.0.1:8765/v1/embeddings
EMBEDDING_API_KEY=  # 本地服务不需要 key
```

## 注意事项

1. 首次运行时会下载 bge-m3 模型（约 2GB），需要等待
2. 模型加载后占用内存约 3-4GB
3. 默认使用 CPU 运行，如有 CUDA 可修改 `device="cuda"`
4. 服务端口默认为 8765，可在 main.py 中修改
