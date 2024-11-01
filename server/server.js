const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); 

const app = express();
app.use(cors());
app.use(bodyParser.json());  // 使用 body-parser 中间件解析 JSON 请求体

// Get base directory from command line arguments
if (process.argv.length < 3) {
    console.error("请提供文件夹路径作为启动参数");
    process.exit(1);
}

const baseDirectory = process.argv[2];
const cacheDirectory = path.join(baseDirectory, '.cache');
  if (!fs.existsSync(cacheDirectory)) {
      fs.mkdirSync(cacheDirectory);
  }

// Check if the directory exists
if (!fs.existsSync(baseDirectory) || !fs.lstatSync(baseDirectory).isDirectory()) {
    console.error("提供的路径不是一个有效的文件夹");
    process.exit(1);
}

// Root endpoint
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    res.sendFile(indexPath);
});

// Get file
app.get('/file/*', (req, res) => {
    const filePath = path.join(baseDirectory, req.params[0]);
    if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
        return res.status(404).send('文件未找到');
    }
    res.sendFile(filePath);
});

// Get video
app.get('/video/*', (req, res) => {
    const filePath = path.join(baseDirectory, req.params[0]);

    if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
        return res.status(404).send('文件未找到');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
            return res.status(416).send('请求范围不满足');
        }

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': 'video/mp4' });
        fs.createReadStream(filePath).pipe(res);
    }
});

// List files detail
app.get('/files-detail/*', (req, res) => {
    const dirPath = path.join(baseDirectory, req.params[0]);

    if (!fs.existsSync(dirPath) || !fs.lstatSync(dirPath).isDirectory()) {
        return res.status(404).send('文件夹未找到');
    }

    const items = fs.readdirSync(dirPath);
    const fileDetails = items.map(item => {
        const itemFullPath = path.join(dirPath, item);
        const isFile = fs.lstatSync(itemFullPath).isFile();
        return {
            name: item,
            size: isFile ? fs.statSync(itemFullPath).size : null,
            modified_time: isFile ? fs.statSync(itemFullPath).mtime.toISOString() : null,
            type: isFile ? 'file' : 'dir'
        };
    });

    res.json(fileDetails);
});

// Save label endpoint
app.post('/save_label', (req, res) => {
  const { video_name, boxes } = req.body;
  const filePath = path.join(cacheDirectory, `${video_name}.json`);

  // Create a new label object with unique IDs
  const newBoxes = boxes.map(box => ({ ...box, uid: uuidv4() }));

  let data = { metadata: {}, labels: [] };

  // Check if the file already exists
  if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      data = JSON.parse(fileContent);
  }

  // Add new boxes to labels
  data.labels.push(...newBoxes);

  // Write updated data back to the file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  res.status(200).send({ message: 'Labels saved successfully' });
});

// Read label endpoint
app.get('/read_label/:video_name', (req, res) => {
  const { video_name } = req.params;
  const filePath = path.join(cacheDirectory, `${video_name}.json`);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      res.status(200).send(data);
  } else {
      res.status(404).send({ message: 'Label not found' });
  }
});

// Start server
const PORT = 8888;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
