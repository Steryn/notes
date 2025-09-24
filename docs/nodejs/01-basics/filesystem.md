# 文件系统操作

## 🎯 学习目标

- 掌握Node.js文件系统模块的基本使用
- 学会同步和异步文件操作
- 理解文件流的概念和使用
- 掌握目录操作和路径处理
- 学会文件监控和事件处理
- 了解文件权限和安全考虑

## 📚 文件系统模块基础

### 引入fs模块

```javascript
const fs = require('fs');
const path = require('path');

// 或者使用Promise版本
const fsPromises = require('fs').promises;
```

### 同步 vs 异步操作

```javascript
// 同步操作（阻塞）
try {
  const data = fs.readFileSync('file.txt', 'utf8');
  console.log(data);
} catch (error) {
  console.error('读取文件失败:', error);
}

// 异步操作（非阻塞）
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件失败:', err);
    return;
  }
  console.log(data);
});
```

## 📁 文件读取和写入

### 基本文件操作

```javascript
const fs = require('fs');

// 读取文件
fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取失败:', err);
    return;
  }
  console.log('文件内容:', data);
});

// 写入文件
const content = 'Hello, Node.js!';
fs.writeFile('output.txt', content, 'utf8', (err) => {
  if (err) {
    console.error('写入失败:', err);
    return;
  }
  console.log('文件写入成功');
});

// 追加内容
fs.appendFile('log.txt', '新的日志条目\n', (err) => {
  if (err) {
    console.error('追加失败:', err);
    return;
  }
  console.log('内容追加成功');
});
```

### 使用Promise版本

```javascript
const fsPromises = require('fs').promises;

async function fileOperations() {
  try {
    // 读取文件
    const data = await fsPromises.readFile('data.txt', 'utf8');
    console.log('文件内容:', data);
    
    // 写入文件
    await fsPromises.writeFile('output.txt', 'Hello, World!', 'utf8');
    console.log('文件写入成功');
    
    // 追加内容
    await fsPromises.appendFile('log.txt', '新的日志条目\n');
    console.log('内容追加成功');
    
  } catch (error) {
    console.error('操作失败:', error);
  }
}

fileOperations();
```

### 文件存在性检查

```javascript
// 检查文件是否存在
fs.access('file.txt', fs.constants.F_OK, (err) => {
  if (err) {
    console.log('文件不存在');
  } else {
    console.log('文件存在');
  }
});

// 检查文件权限
fs.access('file.txt', fs.constants.R_OK | fs.constants.W_OK, (err) => {
  if (err) {
    console.log('文件不可读写');
  } else {
    console.log('文件可读写');
  }
});

// 使用stat获取文件信息
fs.stat('file.txt', (err, stats) => {
  if (err) {
    console.error('获取文件信息失败:', err);
    return;
  }
  
  console.log('文件信息:');
  console.log('大小:', stats.size, '字节');
  console.log('创建时间:', stats.birthtime);
  console.log('修改时间:', stats.mtime);
  console.log('是否为文件:', stats.isFile());
  console.log('是否为目录:', stats.isDirectory());
});
```

## 📂 目录操作

### 创建和删除目录

```javascript
// 创建目录
fs.mkdir('new-directory', (err) => {
  if (err) {
    console.error('创建目录失败:', err);
    return;
  }
  console.log('目录创建成功');
});

// 创建嵌套目录
fs.mkdir('path/to/nested/directory', { recursive: true }, (err) => {
  if (err) {
    console.error('创建目录失败:', err);
    return;
  }
  console.log('嵌套目录创建成功');
});

// 删除目录
fs.rmdir('empty-directory', (err) => {
  if (err) {
    console.error('删除目录失败:', err);
    return;
  }
  console.log('目录删除成功');
});

// 删除非空目录（递归）
fs.rm('directory-with-files', { recursive: true, force: true }, (err) => {
  if (err) {
    console.error('删除目录失败:', err);
    return;
  }
  console.log('目录及其内容删除成功');
});
```

### 读取目录内容

```javascript
// 读取目录内容
fs.readdir('.', (err, files) => {
  if (err) {
    console.error('读取目录失败:', err);
    return;
  }
  
  console.log('目录内容:');
  files.forEach(file => {
    console.log('-', file);
  });
});

// 读取目录详细信息
fs.readdir('.', { withFileTypes: true }, (err, files) => {
  if (err) {
    console.error('读取目录失败:', err);
    return;
  }
  
  files.forEach(file => {
    const type = file.isDirectory() ? '目录' : '文件';
    console.log(`${type}: ${file.name}`);
  });
});
```

## 🌊 文件流

### 读取流

```javascript
const fs = require('fs');

// 创建读取流
const readStream = fs.createReadStream('large-file.txt', {
  encoding: 'utf8',
  highWaterMark: 1024 // 缓冲区大小
});

// 监听数据事件
readStream.on('data', (chunk) => {
  console.log('接收到数据块:', chunk.length, '字节');
  console.log('内容:', chunk.substring(0, 100) + '...');
});

// 监听结束事件
readStream.on('end', () => {
  console.log('文件读取完成');
});

// 监听错误事件
readStream.on('error', (err) => {
  console.error('读取流错误:', err);
});
```

### 写入流

```javascript
// 创建写入流
const writeStream = fs.createWriteStream('output.txt', {
  encoding: 'utf8',
  flags: 'w' // 写入模式
});

// 写入数据
writeStream.write('第一行数据\n');
writeStream.write('第二行数据\n');
writeStream.write('第三行数据\n');

// 结束写入
writeStream.end();

// 监听完成事件
writeStream.on('finish', () => {
  console.log('文件写入完成');
});

// 监听错误事件
writeStream.on('error', (err) => {
  console.error('写入流错误:', err);
});
```

### 管道操作

```javascript
// 使用管道复制文件
const readStream = fs.createReadStream('source.txt');
const writeStream = fs.createWriteStream('destination.txt');

readStream.pipe(writeStream);

writeStream.on('finish', () => {
  console.log('文件复制完成');
});

// 带错误处理的管道
readStream
  .on('error', (err) => {
    console.error('读取错误:', err);
    writeStream.destroy();
  })
  .pipe(writeStream)
  .on('error', (err) => {
    console.error('写入错误:', err);
  });
```

## 📍 路径处理

### path模块使用

```javascript
const path = require('path');

const filePath = '/Users/username/Documents/file.txt';

// 获取路径的不同部分
console.log('目录名:', path.dirname(filePath));
console.log('文件名:', path.basename(filePath));
console.log('扩展名:', path.extname(filePath));
console.log('文件名（无扩展名）:', path.basename(filePath, path.extname(filePath)));

// 路径拼接
const dir = '/Users/username/Documents';
const filename = 'file.txt';
const fullPath = path.join(dir, filename);
console.log('完整路径:', fullPath);

// 路径解析
const parsed = path.parse(filePath);
console.log('解析结果:', parsed);
// 输出: { root: '/', dir: '/Users/username/Documents', base: 'file.txt', ext: '.txt', name: 'file' }

// 路径规范化
const normalized = path.normalize('/Users/username/../Documents/./file.txt');
console.log('规范化路径:', normalized);

// 相对路径
const relative = path.relative('/Users/username', '/Users/username/Documents/file.txt');
console.log('相对路径:', relative);

// 绝对路径
const absolute = path.resolve('file.txt');
console.log('绝对路径:', absolute);
```

## 👀 文件监控

### 监控文件变化

```javascript
// 监控文件
fs.watchFile('file.txt', (curr, prev) => {
  console.log('文件发生变化');
  console.log('当前修改时间:', curr.mtime);
  console.log('之前修改时间:', prev.mtime);
});

// 停止监控
setTimeout(() => {
  fs.unwatchFile('file.txt');
  console.log('停止监控文件');
}, 10000);

// 使用watch方法（更高效）
const watcher = fs.watch('directory', (eventType, filename) => {
  console.log(`事件类型: ${eventType}`);
  console.log(`文件名: ${filename}`);
});

// 关闭监控器
setTimeout(() => {
  watcher.close();
  console.log('监控器已关闭');
}, 10000);
```

## 🛠️ 实践项目：文件管理器

让我们创建一个简单的文件管理器项目：

### 1. 项目结构

```
file-manager/
├── package.json
├── index.js
├── lib/
│   ├── fileManager.js
│   ├── pathUtils.js
│   └── logger.js
├── data/
└── tests/
    └── fileManager.test.js
```

### 2. 创建文件管理器类

```javascript
// lib/fileManager.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);

class FileManager {
  constructor(basePath = '.') {
    this.basePath = path.resolve(basePath);
  }
  
  // 获取文件信息
  async getFileInfo(filePath) {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const stats = await stat(fullPath);
      
      return {
        name: path.basename(fullPath),
        path: filePath,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        permissions: stats.mode
      };
    } catch (error) {
      throw new Error(`获取文件信息失败: ${error.message}`);
    }
  }
  
  // 列出目录内容
  async listDirectory(dirPath = '.') {
    try {
      const fullPath = path.join(this.basePath, dirPath);
      const files = await readdir(fullPath, { withFileTypes: true });
      
      const fileList = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file.name);
          return await this.getFileInfo(filePath);
        })
      );
      
      return fileList;
    } catch (error) {
      throw new Error(`列出目录失败: ${error.message}`);
    }
  }
  
  // 创建文件
  async createFile(filePath, content = '') {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const dir = path.dirname(fullPath);
      
      // 确保目录存在
      await this.ensureDirectoryExists(dir);
      
      await writeFile(fullPath, content, 'utf8');
      return await this.getFileInfo(filePath);
    } catch (error) {
      throw new Error(`创建文件失败: ${error.message}`);
    }
  }
  
  // 读取文件
  async readFile(filePath) {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const content = await readFile(fullPath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`读取文件失败: ${error.message}`);
    }
  }
  
  // 更新文件
  async updateFile(filePath, content) {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await writeFile(fullPath, content, 'utf8');
      return await this.getFileInfo(filePath);
    } catch (error) {
      throw new Error(`更新文件失败: ${error.message}`);
    }
  }
  
  // 删除文件
  async deleteFile(filePath) {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        await rmdir(fullPath);
      } else {
        await unlink(fullPath);
      }
      
      return true;
    } catch (error) {
      throw new Error(`删除文件失败: ${error.message}`);
    }
  }
  
  // 创建目录
  async createDirectory(dirPath) {
    try {
      const fullPath = path.join(this.basePath, dirPath);
      await mkdir(fullPath, { recursive: true });
      return await this.getFileInfo(dirPath);
    } catch (error) {
      throw new Error(`创建目录失败: ${error.message}`);
    }
  }
  
  // 复制文件
  async copyFile(sourcePath, destPath) {
    try {
      const sourceFullPath = path.join(this.basePath, sourcePath);
      const destFullPath = path.join(this.basePath, destPath);
      const destDir = path.dirname(destFullPath);
      
      // 确保目标目录存在
      await this.ensureDirectoryExists(destDir);
      
      const content = await readFile(sourceFullPath, 'utf8');
      await writeFile(destFullPath, content, 'utf8');
      
      return await this.getFileInfo(destPath);
    } catch (error) {
      throw new Error(`复制文件失败: ${error.message}`);
    }
  }
  
  // 移动文件
  async moveFile(sourcePath, destPath) {
    try {
      await this.copyFile(sourcePath, destPath);
      await this.deleteFile(sourcePath);
      return await this.getFileInfo(destPath);
    } catch (error) {
      throw new Error(`移动文件失败: ${error.message}`);
    }
  }
  
  // 搜索文件
  async searchFiles(pattern, searchPath = '.') {
    try {
      const files = await this.listDirectory(searchPath);
      const results = [];
      
      for (const file of files) {
        if (file.name.includes(pattern)) {
          results.push(file);
        }
        
        // 如果是目录，递归搜索
        if (file.isDirectory) {
          const subResults = await this.searchFiles(pattern, path.join(searchPath, file.name));
          results.push(...subResults);
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`搜索文件失败: ${error.message}`);
    }
  }
  
  // 确保目录存在
  async ensureDirectoryExists(dirPath) {
    try {
      await stat(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await mkdir(dirPath, { recursive: true });
      } else {
        throw error;
      }
    }
  }
}

module.exports = FileManager;
```

### 3. 创建路径工具

```javascript
// lib/pathUtils.js
const path = require('path');

class PathUtils {
  static normalizePath(inputPath) {
    return path.normalize(inputPath);
  }
  
  static joinPaths(...paths) {
    return path.join(...paths);
  }
  
  static getFileName(filePath) {
    return path.basename(filePath);
  }
  
  static getFileExtension(filePath) {
    return path.extname(filePath);
  }
  
  static getDirectoryName(filePath) {
    return path.dirname(filePath);
  }
  
  static getFileNameWithoutExtension(filePath) {
    const basename = path.basename(filePath);
    const ext = path.extname(filePath);
    return basename.replace(ext, '');
  }
  
  static isAbsolutePath(inputPath) {
    return path.isAbsolute(inputPath);
  }
  
  static getRelativePath(from, to) {
    return path.relative(from, to);
  }
  
  static resolvePath(inputPath) {
    return path.resolve(inputPath);
  }
  
  static parsePath(inputPath) {
    return path.parse(inputPath);
  }
  
  static formatPath(parsedPath) {
    return path.format(parsedPath);
  }
  
  static isValidFileName(fileName) {
    // 检查文件名是否包含非法字符
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(fileName) && fileName.length > 0;
  }
  
  static sanitizeFileName(fileName) {
    // 清理文件名，移除非法字符
    return fileName.replace(/[<>:"/\\|?*]/g, '_');
  }
}

module.exports = PathUtils;
```

### 4. 创建日志记录器

```javascript
// lib/logger.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const appendFile = promisify(fs.appendFile);
const mkdir = promisify(fs.mkdir);

class Logger {
  constructor(logDir = 'logs') {
    this.logDir = logDir;
    this.ensureLogDir();
  }
  
  async ensureLogDir() {
    try {
      await mkdir(this.logDir, { recursive: true });
    } catch (error) {
      // 目录可能已存在，忽略错误
    }
  }
  
  getLogFileName() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return path.join(this.logDir, `${year}-${month}-${day}.log`);
  }
  
  formatLogEntry(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    return JSON.stringify(logEntry) + '\n';
  }
  
  async writeLog(level, message, data = {}) {
    try {
      const logFile = this.getLogFileName();
      const logEntry = this.formatLogEntry(level, message, data);
      await appendFile(logFile, logEntry);
    } catch (error) {
      console.error('写入日志失败:', error);
    }
  }
  
  info(message, data) {
    console.log(`[INFO] ${message}`);
    this.writeLog('INFO', message, data);
  }
  
  error(message, data) {
    console.error(`[ERROR] ${message}`);
    this.writeLog('ERROR', message, data);
  }
  
  warn(message, data) {
    console.warn(`[WARN] ${message}`);
    this.writeLog('WARN', message, data);
  }
  
  debug(message, data) {
    console.log(`[DEBUG] ${message}`);
    this.writeLog('DEBUG', message, data);
  }
}

module.exports = Logger;
```

### 5. 创建主程序

```javascript
// index.js
const FileManager = require('./lib/fileManager');
const Logger = require('./lib/logger');
const PathUtils = require('./lib/pathUtils');

class FileManagerApp {
  constructor() {
    this.fileManager = new FileManager('./data');
    this.logger = new Logger('./logs');
  }
  
  async run() {
    try {
      this.logger.info('文件管理器启动');
      
      // 创建测试目录
      await this.fileManager.createDirectory('test');
      this.logger.info('创建测试目录');
      
      // 创建测试文件
      await this.fileManager.createFile('test/hello.txt', 'Hello, World!');
      await this.fileManager.createFile('test/readme.md', '# 测试文件\n这是一个测试文件。');
      this.logger.info('创建测试文件');
      
      // 列出目录内容
      const files = await this.fileManager.listDirectory('test');
      this.logger.info('列出目录内容', { fileCount: files.length });
      files.forEach(file => {
        console.log(`- ${file.name} (${file.isFile ? '文件' : '目录'})`);
      });
      
      // 读取文件内容
      const content = await this.fileManager.readFile('test/hello.txt');
      console.log('文件内容:', content);
      
      // 复制文件
      await this.fileManager.copyFile('test/hello.txt', 'test/hello-copy.txt');
      this.logger.info('复制文件');
      
      // 搜索文件
      const searchResults = await this.fileManager.searchFiles('hello');
      console.log('搜索结果:', searchResults.map(f => f.name));
      
      // 获取文件信息
      const fileInfo = await this.fileManager.getFileInfo('test/hello.txt');
      console.log('文件信息:', fileInfo);
      
      // 演示路径工具
      console.log('\n=== 路径工具演示 ===');
      const testPath = '/Users/username/Documents/file.txt';
      console.log('文件名:', PathUtils.getFileName(testPath));
      console.log('扩展名:', PathUtils.getFileExtension(testPath));
      console.log('目录名:', PathUtils.getDirectoryName(testPath));
      console.log('解析路径:', PathUtils.parsePath(testPath));
      
      this.logger.info('文件管理器运行完成');
      
    } catch (error) {
      this.logger.error('文件管理器运行失败', { error: error.message });
      console.error('错误:', error.message);
    }
  }
}

// 运行应用
if (require.main === module) {
  const app = new FileManagerApp();
  app.run();
}

module.exports = FileManagerApp;
```

### 6. 创建测试文件

```javascript
// tests/fileManager.test.js
const fs = require('fs');
const path = require('path');
const FileManager = require('../lib/fileManager');

async function runTests() {
  console.log('开始运行文件管理器测试...\n');
  
  const testDir = path.join(__dirname, 'test-data');
  const fileManager = new FileManager(testDir);
  
  try {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    // 测试创建目录
    console.log('测试创建目录...');
    await fileManager.createDirectory('test-dir');
    console.log('✅ 目录创建成功');
    
    // 测试创建文件
    console.log('测试创建文件...');
    await fileManager.createFile('test-dir/test.txt', '测试内容');
    console.log('✅ 文件创建成功');
    
    // 测试读取文件
    console.log('测试读取文件...');
    const content = await fileManager.readFile('test-dir/test.txt');
    if (content === '测试内容') {
      console.log('✅ 文件读取成功');
    } else {
      console.log('❌ 文件读取失败');
    }
    
    // 测试获取文件信息
    console.log('测试获取文件信息...');
    const fileInfo = await fileManager.getFileInfo('test-dir/test.txt');
    if (fileInfo.name === 'test.txt' && fileInfo.isFile) {
      console.log('✅ 文件信息获取成功');
    } else {
      console.log('❌ 文件信息获取失败');
    }
    
    // 测试列出目录
    console.log('测试列出目录...');
    const files = await fileManager.listDirectory('test-dir');
    if (files.length === 1 && files[0].name === 'test.txt') {
      console.log('✅ 目录列表获取成功');
    } else {
      console.log('❌ 目录列表获取失败');
    }
    
    // 测试复制文件
    console.log('测试复制文件...');
    await fileManager.copyFile('test-dir/test.txt', 'test-dir/test-copy.txt');
    const copiedContent = await fileManager.readFile('test-dir/test-copy.txt');
    if (copiedContent === '测试内容') {
      console.log('✅ 文件复制成功');
    } else {
      console.log('❌ 文件复制失败');
    }
    
    // 测试搜索文件
    console.log('测试搜索文件...');
    const searchResults = await fileManager.searchFiles('test');
    if (searchResults.length >= 2) {
      console.log('✅ 文件搜索成功');
    } else {
      console.log('❌ 文件搜索失败');
    }
    
    console.log('\n✅ 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    // 清理测试目录
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
        console.log('测试文件已清理');
      }
    } catch (error) {
      console.log('清理测试文件失败:', error.message);
    }
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
```

### 7. 更新package.json

```json
{
  "name": "file-manager",
  "version": "1.0.0",
  "description": "Node.js文件管理器项目",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node tests/fileManager.test.js"
  },
  "keywords": ["file", "manager", "filesystem", "node"],
  "author": "您的名字",
  "license": "MIT"
}
```

## 📝 总结

在这一章中，我们学习了：

1. **文件系统基础**：fs模块的基本使用
2. **文件操作**：读取、写入、删除文件
3. **目录操作**：创建、删除、列出目录
4. **文件流**：处理大文件的流式操作
5. **路径处理**：path模块的使用
6. **文件监控**：监控文件变化
7. **实践项目**：创建了一个完整的文件管理器

## 🔗 下一步

接下来我们将学习：

- [HTTP模块和网络编程](./http.md)
- [Express框架入门](../02-express/README.md)
- [路由和中间件](../02-express/routing-middleware.md)

继续学习，掌握Node.js的网络编程！🚀
