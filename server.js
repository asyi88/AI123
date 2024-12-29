const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// 确保路径是相对于项目根目录
const publicPath = path.join(__dirname, 'public');
const imagesPath = path.join(__dirname, 'images');

// 配置文件上传
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const logDir = path.join(__dirname, 'logs');
        try {
            await fs.mkdir(logDir, { recursive: true });
            cb(null, logDir);
        } catch (error) {
            cb(error, null);
        }
    },
    filename: function (req, file, cb) {
        // 使用日期作为文件名
        const date = new Date().toISOString().split('T')[0];
        cb(null, `chat-log-${date}.txt`);
    }
});

const upload = multer({ storage: storage });

// 服务静态文件
app.use(express.static(publicPath));
app.use('/images', express.static(imagesPath));

// 处理日志上传
app.post('/api/log', upload.single('log'), async (req, res) => {
    try {
        const file = req.file;
        const logPath = file.path;
        
        // 追加模式写入日志
        await fs.appendFile(logPath, req.file.buffer);
        
        res.json({ success: true });
    } catch (error) {
        console.error('日志记录错误:', error);
        res.status(500).json({ error: '日志记录失败' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 