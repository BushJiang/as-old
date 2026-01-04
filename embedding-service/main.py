"""
本地嵌入向量服务
使用 bge-m3 模型生成 1024 维向量
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import torch
from sentence_transformers import SentenceTransformer
import uvicorn

app = FastAPI(title="如故嵌入服务", version="1.0.0")

# 全局模型变量
model: Optional[SentenceTransformer] = None


class EmbeddingRequest(BaseModel):
    """嵌入请求"""
    model: str = "bge-m3"
    input: str | List[str]
    encoding_format: str = "float"


class EmbeddingData(BaseModel):
    """嵌入数据"""
    embedding: List[float]
    index: int
    object: str = "embedding"


class EmbeddingResponse(BaseModel):
    """嵌入响应"""
    data: List[EmbeddingData]
    model: str
    usage: Optional[dict] = None


@app.on_event("startup")
async def load_model():
    """启动时加载模型"""
    global model
    print("正在加载 bge-m3 模型...")
    model = SentenceTransformer("BAAI/bge-m3", device="cpu")
    print("✅ bge-m3 模型加载完成")


@app.get("/")
async def root():
    """健康检查"""
    return {
        "status": "ok",
        "model": "bge-m3",
        "dimensions": 1024
    }


@app.get("/health")
async def health():
    """健康检查"""
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }


@app.post("/v1/embeddings", response_model=EmbeddingResponse)
async def create_embeddings(request: EmbeddingRequest):
    """
    生成嵌入向量

    兼容 OpenAI API 格式
    """
    if model is None:
        raise HTTPException(status_code=503, detail="模型未加载")

    # 处理输入
    texts = request.input if isinstance(request.input, list) else [request.input]

    try:
        # 生成嵌入
        embeddings = model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False
        )

        # 转换为列表格式
        data = [
            EmbeddingData(
                embedding=embedding.tolist(),
                index=i
            )
            for i, embedding in enumerate(embeddings)
        ]

        return EmbeddingResponse(
            data=data,
            model=request.model,
            usage={
                "prompt_tokens": sum(len(t.split()) for t in texts),
                "total_tokens": sum(len(t.split()) for t in texts)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成嵌入失败: {str(e)}")


@app.post("/embeddings")
async def create_embeddings_legacy(request: EmbeddingRequest):
    """兼容旧版 API 格式"""
    return await create_embeddings(request)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8765,
        reload=True,
        log_level="info"
    )
