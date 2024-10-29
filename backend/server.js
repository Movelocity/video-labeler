const express = require('express');
const fs = require('fs');
const path = require('path');
const process = require('process');

const app = express();

// 从命令行获取文件夹路径
if (process.argv.length < 3) {
    console.log("请提供文件夹路径作为启动参数");
    process.exit(1);
}

const baseDirectory = process.argv[2];

// 检查文件夹路径是否存在
if (!fs.existsSync(baseDirectory) || !fs.lstatSync(baseDirectory).isDirectory()) {
    console.log("提供的路径不是一个有效的文件夹");
    process.exit(1);
}

app.get('/', (req, res) => {
    fs.readFile('index.html', 'utf-8', (err, content) => {
        if (err) {
            res.status(500).send("无法读取index.html");
            return;
        }
        res.send(content);
    });
});

app.get('/file/*', (req, res) => {
    const filePath = req.params[0];
    const fullPath = path.join(baseDirectory, filePath);

    if (!fs.existsSync(fullPath) || !fs.lstatSync(fullPath).isFile()) {
        res.status(404).send("文件未找到");
        return;
    }

    res.sendFile(fullPath);
});

app.get('/video/*', (req, res) => {
    const filePath = req.params[0];
    const fullPath = path.join(baseDirectory, filePath);

    if (!fs.existsSync(fullPath) || !fs.lstatSync(fullPath).isFile()) {
        res.status(404).send("文件未找到");
        return;
    }

    const fileSize = fs.statSync(fullPath).size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
            res.status(416).send("请求范围不满足");
            return;
        }

        const contentLength = end - start + 1;
        const headers = {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
        };

        res.writeHead(206, headers);

        const stream = fs.createReadStream(fullPath, { start, end });
        stream.pipe(res);
    } else {
        res.writeHead(200, { "Content-Length": fileSize, "Content-Type": "video/mp4" });
        fs.createReadStream(fullPath).pipe(res);
    }
});

app.get('/files-detail/*', (req, res) => {
    const filePath = req.params[0];
    const fullPath = path.join(baseDirectory, filePath);

    if (!fs.existsSync(fullPath) || !fs.lstatSync(fullPath).isDirectory()) {
        res.status(404).send("文件夹未找到");
        return;
    }

    fs.readdir(fullPath, (err, items) => {
        if (err) {
            res.status(500).send("无法读取目录");
            return;
        }

        const fileDetails = items.map(item => {
            const itemFullPath = path.join(fullPath, item);
            const isFile = fs.lstatSync(itemFullPath).isFile();
            return {
                name: item,
                size: isFile ? fs.statSync(itemFullPath).size : null,
                modified_time: isFile ? new Date(fs.statSync(itemFullPath).mtime).toISOString() : null,
                type: isFile ? "file" : "dir"
            };
        });

        res.json(fileDetails);
    });
});

const port = 8888;
app.listen(port, () => {
    console.log(`Server running at http://0.0.0.0:${port}/`);
});
