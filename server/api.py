from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, StreamingResponse
import os
import sys
import uvicorn
import datetime
import asyncio

app = FastAPI()

# 从命令行获取文件夹路径
if len(sys.argv) < 2:
    print("请提供文件夹路径作为启动参数")
    sys.exit(1)

base_directory = sys.argv[1]

# 检查文件夹路径是否存在
if not os.path.isdir(base_directory):
    print("提供的路径不是一个有效的文件夹")
    sys.exit(1)

@app.get("/")
async def root():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    return HTMLResponse(content)


@app.get("/file/{file_path:path}")
async def get_file(file_path: str):
    # 构造完整文件路径
    full_path = os.path.join(base_directory, file_path)
    
    # 检查文件是否存在且是一个文件
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="文件未找到")
    
    return FileResponse(full_path)

@app.get("/video/{file_path:path}")
async def get_video(file_path: str, request: Request):
    full_path = os.path.join(base_directory, file_path)
    
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="文件未找到")
    
    file_size = os.path.getsize(full_path)
    
    range_header = request.headers.get("Range")
    
    start = 0
    end = file_size - 1
    
    if range_header:
        start, end = range_header.replace("bytes=", "").split("-")
        start = int(start)
        end = int(end) if end else file_size - 1
    
    # 确保范围有效
    if start >= file_size:
        raise HTTPException(status_code=416, detail="请求范围不满足")
    
    # 计算实际需要读取的字节数
    content_length = end - start + 1
    
    # 创建一个生成器来流式传输文件内容
    async def iterfile():
        with open(full_path, mode="rb") as file:
            file.seek(start)
            remaining = content_length
            while remaining > 0:
                chunk_size = min(8192, remaining)  # 增加块大小到8KB
                data = file.read(chunk_size)
                if not data:
                    break
                remaining -= len(data)
                try:
                    yield data
                    await asyncio.sleep(0)  # 让出控制权，允许其他协程运行
                except Exception:
                    # 连接可能已关闭，退出循环
                    break

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
    }
    
    status_code = 206 if range_header else 200
    
    return StreamingResponse(iterfile(), headers=headers, media_type="video/mp4", status_code=status_code)


@app.get("/files-detail/{file_path:path}", response_class=JSONResponse)
async def list_files_detail(file_path: str):
    full_path = os.path.join(base_directory, file_path)

    if not os.path.isdir(full_path):
        raise HTTPException(status_code=404, detail="文件夹未找到")

    items = os.listdir(full_path)
    file_details = []

    for item in items:
        item_full_path = os.path.join(full_path, item)
        isFile = os.path.isfile(item_full_path)
        item_info = {
            "name": item,
            "size": os.path.getsize(item_full_path) if isFile else None,
            "modified_time": datetime.datetime.fromtimestamp(
                os.path.getmtime(item_full_path)
            ).isoformat() if isFile else None,
            "type": "file" if isFile else "dir"
        }
        file_details.append(item_info)

    return JSONResponse(content=file_details)


if __name__ == "__main__":
    try:
        uvicorn.run(app, host="0.0.0.0", port=8888)
    except ConnectionResetError:  # 这个错误似乎无法捕获
        print('远程主机强迫关闭了一个现有的连接')
    except KeyboardInterrupt:
        print("Server stopped gracefully.")