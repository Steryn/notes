# Streams基础

## 🎯 学习目标

- 深入理解Node.js Streams的核心概念
- 掌握四种基本Stream类型的使用
- 学会Stream的组合和管道操作
- 了解背压处理和错误管理

## 📚 核心概念

### Stream类型概述

```javascript
// Node.js Stream类型
const streamTypes = {
  readable: {
    description: '可读流 - 数据源',
    examples: ['fs.createReadStream', 'http.IncomingMessage', 'process.stdin'],
    characteristics: ['产生数据', '可以被消费', '支持暂停/恢复']
  },
  writable: {
    description: '可写流 - 数据目标',
    examples: ['fs.createWriteStream', 'http.ServerResponse', 'process.stdout'],
    characteristics: ['消费数据', '可以写入', '支持结束信号']
  },
  duplex: {
    description: '双工流 - 既可读又可写',
    examples: ['net.Socket', 'tls.TLSSocket', 'crypto.Cipher'],
    characteristics: ['独立的读写', '双向通信', '网络连接']
  },
  transform: {
    description: '转换流 - 处理数据',
    examples: ['zlib.createGzip', 'crypto.createHash', '自定义转换'],
    characteristics: ['读写关联', '数据变换', '中间处理']
  }
};

console.log('Stream类型:', streamTypes);
```

## 🔍 可读流详解

### 基础可读流实现

```javascript
// readable-stream.js
const { Readable } = require('stream');

// 简单的数据生成器
class NumberGenerator extends Readable {
  constructor(options = {}) {
    super(options);
    this.current = options.start || 1;
    this.max = options.max || 100;
    this.interval = options.interval || 100;
  }

  _read() {
    if (this.current <= this.max) {
      // 生成数据
      const data = {
        number: this.current,
        timestamp: Date.now(),
        message: `Number ${this.current}`
      };
      
      this.push(JSON.stringify(data) + '\n');
      this.current++;
      
      // 模拟异步数据生成
      if (this.interval > 0) {
        setTimeout(() => {
          // 触发下一次读取
        }, this.interval);
      }
    } else {
      // 数据结束
      this.push(null);
    }
  }
}

// 文件内容读取器
class FileContentReader extends Readable {
  constructor(filePath, options = {}) {
    super(options);
    this.filePath = filePath;
    this.chunkSize = options.chunkSize || 64 * 1024; // 64KB
    this.position = 0;
    this.fd = null;
    this.fileSize = 0;
    
    this._openFile();
  }

  async _openFile() {
    try {
      const fs = require('fs').promises;
      const stats = await fs.stat(this.filePath);
      this.fileSize = stats.size;
      
      // 打开文件
      this.fd = await fs.open(this.filePath, 'r');
    } catch (error) {
      this.destroy(error);
    }
  }

  _read() {
    if (!this.fd) {
      // 文件还未打开，稍后重试
      setTimeout(() => this._read(), 10);
      return;
    }

    if (this.position >= this.fileSize) {
      // 文件读取完成
      this.push(null);
      return;
    }

    // 读取文件块
    const buffer = Buffer.allocUnsafe(this.chunkSize);
    
    this.fd.read(buffer, 0, this.chunkSize, this.position)
      .then(({ bytesRead }) => {
        if (bytesRead > 0) {
          this.position += bytesRead;
          this.push(buffer.slice(0, bytesRead));
        } else {
          this.push(null);
        }
      })
      .catch(error => {
        this.destroy(error);
      });
  }

  _destroy(error, callback) {
    if (this.fd) {
      this.fd.close().finally(() => callback(error));
    } else {
      callback(error);
    }
  }
}

// HTTP数据流
class HttpDataStream extends Readable {
  constructor(url, options = {}) {
    super(options);
    this.url = url;
    this.response = null;
    this.isDestroyed = false;
    
    this._makeRequest();
  }

  _makeRequest() {
    const https = require('https');
    const http = require('http');
    
    const client = this.url.startsWith('https:') ? https : http;
    
    const request = client.get(this.url, (response) => {
      this.response = response;
      
      // 设置编码
      if (response.headers['content-type']?.includes('text')) {
        response.setEncoding('utf8');
      }
      
      // 处理响应数据
      response.on('data', (chunk) => {
        if (!this.isDestroyed) {
          this.push(chunk);
        }
      });
      
      response.on('end', () => {
        if (!this.isDestroyed) {
          this.push(null);
        }
      });
      
      response.on('error', (error) => {
        this.destroy(error);
      });
    });

    request.on('error', (error) => {
      this.destroy(error);
    });
  }

  _read() {
    // HTTP流是被动的，不需要主动读取
  }

  _destroy(error, callback) {
    this.isDestroyed = true;
    if (this.response) {
      this.response.destroy();
    }
    callback(error);
  }
}

// 使用示例
async function demonstrateReadableStreams() {
  console.log('🔍 可读流演示...\n');

  // 1. 数字生成器
  console.log('1. 数字生成器:');
  const numberGen = new NumberGenerator({ start: 1, max: 5, interval: 200 });
  
  numberGen.on('data', (chunk) => {
    const data = JSON.parse(chunk.toString().trim());
    console.log(`  生成: ${data.message} at ${new Date(data.timestamp).toISOString()}`);
  });
  
  numberGen.on('end', () => {
    console.log('  ✅ 数字生成完成\n');
  });

  // 等待数字生成完成
  await new Promise(resolve => numberGen.on('end', resolve));

  // 2. 对象模式流
  console.log('2. 对象模式流:');
  const objectStream = new Readable({
    objectMode: true,
    read() {
      const data = [
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 35 },
        null // 结束标记
      ];
      
      const item = data.shift();
      this.push(item);
    }
  });

  objectStream.on('data', (obj) => {
    console.log('  对象:', obj);
  });

  objectStream.on('end', () => {
    console.log('  ✅ 对象流结束\n');
  });

  // 3. 流控制演示
  console.log('3. 流控制演示:');
  const controlledStream = new Readable({
    read() {
      // 不立即推送数据
    }
  });

  // 手动推送数据
  setTimeout(() => {
    controlledStream.push('第一块数据\n');
  }, 500);

  setTimeout(() => {
    controlledStream.push('第二块数据\n');
  }, 1000);

  setTimeout(() => {
    controlledStream.push('第三块数据\n');
    controlledStream.push(null); // 结束
  }, 1500);

  controlledStream.on('data', (chunk) => {
    console.log(`  接收: ${chunk.toString().trim()}`);
  });

  controlledStream.on('end', () => {
    console.log('  ✅ 控制流结束\n');
  });
}

module.exports = {
  NumberGenerator,
  FileContentReader,
  HttpDataStream,
  demonstrateReadableStreams
};
```

## ✍️ 可写流详解

### 基础可写流实现

```javascript
// writable-stream.js
const { Writable } = require('stream');
const fs = require('fs');

// 控制台输出流
class ConsoleWriter extends Writable {
  constructor(options = {}) {
    super(options);
    this.prefix = options.prefix || '[LOG]';
    this.colorize = options.colorize !== false;
    this.timestamps = options.timestamps !== false;
  }

  _write(chunk, encoding, callback) {
    try {
      let message = chunk.toString();
      
      // 添加时间戳
      if (this.timestamps) {
        const timestamp = new Date().toISOString();
        message = `${timestamp} ${message}`;
      }
      
      // 添加前缀
      message = `${this.prefix} ${message}`;
      
      // 着色（简单实现）
      if (this.colorize) {
        if (message.includes('ERROR')) {
          message = `\x1b[31m${message}\x1b[0m`; // 红色
        } else if (message.includes('WARN')) {
          message = `\x1b[33m${message}\x1b[0m`; // 黄色
        } else if (message.includes('INFO')) {
          message = `\x1b[36m${message}\x1b[0m`; // 青色
        }
      }
      
      process.stdout.write(message);
      callback();
      
    } catch (error) {
      callback(error);
    }
  }

  _writev(chunks, callback) {
    try {
      // 批量写入优化
      const messages = chunks.map(chunk => {
        let message = chunk.chunk.toString();
        
        if (this.timestamps) {
          const timestamp = new Date().toISOString();
          message = `${timestamp} ${message}`;
        }
        
        return `${this.prefix} ${message}`;
      });
      
      process.stdout.write(messages.join(''));
      callback();
      
    } catch (error) {
      callback(error);
    }
  }
}

// 内存缓冲区写入器
class MemoryWriter extends Writable {
  constructor(options = {}) {
    super(options);
    this.buffer = [];
    this.totalSize = 0;
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
  }

  _write(chunk, encoding, callback) {
    if (this.totalSize + chunk.length > this.maxSize) {
      callback(new Error('Memory buffer overflow'));
      return;
    }

    this.buffer.push({
      data: chunk,
      encoding: encoding,
      timestamp: Date.now()
    });
    
    this.totalSize += chunk.length;
    callback();
  }

  // 获取缓冲区内容
  getBuffer() {
    return this.buffer.map(item => ({
      data: item.data.toString(item.encoding),
      timestamp: new Date(item.timestamp).toISOString()
    }));
  }

  // 清空缓冲区
  clearBuffer() {
    const oldSize = this.totalSize;
    this.buffer = [];
    this.totalSize = 0;
    return oldSize;
  }

  // 获取统计信息
  getStats() {
    return {
      chunks: this.buffer.length,
      totalSize: this.totalSize,
      maxSize: this.maxSize,
      utilization: (this.totalSize / this.maxSize * 100).toFixed(2) + '%'
    };
  }
}

// 文件写入器（带缓冲）
class BufferedFileWriter extends Writable {
  constructor(filePath, options = {}) {
    super(options);
    this.filePath = filePath;
    this.bufferSize = options.bufferSize || 64 * 1024; // 64KB
    this.flushInterval = options.flushInterval || 5000; // 5秒
    
    this.buffer = [];
    this.bufferLength = 0;
    this.fileHandle = null;
    this.flushTimer = null;
    
    this._openFile();
    this._startFlushTimer();
  }

  async _openFile() {
    try {
      this.fileHandle = await fs.promises.open(this.filePath, 'a');
    } catch (error) {
      this.destroy(error);
    }
  }

  _write(chunk, encoding, callback) {
    if (!this.fileHandle) {
      // 文件还未打开，稍后重试
      setTimeout(() => this._write(chunk, encoding, callback), 10);
      return;
    }

    // 添加到缓冲区
    this.buffer.push(chunk);
    this.bufferLength += chunk.length;

    // 检查是否需要刷新
    if (this.bufferLength >= this.bufferSize) {
      this._flush(callback);
    } else {
      callback();
    }
  }

  async _flush(callback) {
    if (this.buffer.length === 0) {
      if (callback) callback();
      return;
    }

    try {
      const data = Buffer.concat(this.buffer);
      await this.fileHandle.write(data);
      await this.fileHandle.sync(); // 强制写入磁盘
      
      this.buffer = [];
      this.bufferLength = 0;
      
      if (callback) callback();
      
    } catch (error) {
      if (callback) callback(error);
    }
  }

  _startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this._flush();
    }, this.flushInterval);
  }

  _final(callback) {
    // 流结束时刷新缓冲区
    this._flush(callback);
  }

  _destroy(error, callback) {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.fileHandle) {
      this.fileHandle.close().finally(() => callback(error));
    } else {
      callback(error);
    }
  }
}

// 多路复用写入器
class MultiWriter extends Writable {
  constructor(writers, options = {}) {
    super(options);
    this.writers = writers || [];
    this.writeStrategy = options.strategy || 'all'; // 'all', 'first', 'round-robin'
    this.currentIndex = 0;
  }

  _write(chunk, encoding, callback) {
    switch (this.writeStrategy) {
      case 'all':
        this._writeToAll(chunk, encoding, callback);
        break;
      case 'first':
        this._writeToFirst(chunk, encoding, callback);
        break;
      case 'round-robin':
        this._writeRoundRobin(chunk, encoding, callback);
        break;
      default:
        callback(new Error('Unknown write strategy'));
    }
  }

  _writeToAll(chunk, encoding, callback) {
    let completedWrites = 0;
    let hasError = false;

    if (this.writers.length === 0) {
      callback();
      return;
    }

    this.writers.forEach((writer) => {
      writer.write(chunk, encoding, (error) => {
        if (error && !hasError) {
          hasError = true;
          callback(error);
        } else {
          completedWrites++;
          if (completedWrites === this.writers.length && !hasError) {
            callback();
          }
        }
      });
    });
  }

  _writeToFirst(chunk, encoding, callback) {
    if (this.writers.length === 0) {
      callback(new Error('No writers available'));
      return;
    }

    this.writers[0].write(chunk, encoding, callback);
  }

  _writeRoundRobin(chunk, encoding, callback) {
    if (this.writers.length === 0) {
      callback(new Error('No writers available'));
      return;
    }

    const writer = this.writers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.writers.length;
    
    writer.write(chunk, encoding, callback);
  }

  // 添加写入器
  addWriter(writer) {
    this.writers.push(writer);
  }

  // 移除写入器
  removeWriter(writer) {
    const index = this.writers.indexOf(writer);
    if (index > -1) {
      this.writers.splice(index, 1);
    }
  }
}

// 使用示例
async function demonstrateWritableStreams() {
  console.log('✍️ 可写流演示...\n');

  // 1. 控制台写入器
  console.log('1. 控制台写入器:');
  const consoleWriter = new ConsoleWriter({ 
    prefix: '[DEMO]',
    colorize: true 
  });

  consoleWriter.write('INFO: 这是一条信息\n');
  consoleWriter.write('WARN: 这是一条警告\n');
  consoleWriter.write('ERROR: 这是一条错误\n');

  // 2. 内存写入器
  console.log('\n2. 内存写入器:');
  const memoryWriter = new MemoryWriter({ maxSize: 1024 });

  memoryWriter.write('第一条数据\n');
  memoryWriter.write('第二条数据\n');
  memoryWriter.write('第三条数据\n');

  console.log('  缓冲区内容:', memoryWriter.getBuffer());
  console.log('  统计信息:', memoryWriter.getStats());

  // 3. 批量写入演示
  console.log('\n3. 批量写入演示:');
  const batchWriter = new Writable({
    write(chunk, encoding, callback) {
      console.log(`  单次写入: ${chunk.toString().trim()}`);
      callback();
    },
    writev(chunks, callback) {
      console.log(`  批量写入 ${chunks.length} 个块:`);
      chunks.forEach((chunk, index) => {
        console.log(`    ${index + 1}: ${chunk.chunk.toString().trim()}`);
      });
      callback();
    }
  });

  // 快速连续写入触发批量处理
  batchWriter.write('消息1\n');
  batchWriter.write('消息2\n');
  batchWriter.write('消息3\n');

  // 等待写入完成
  await new Promise(resolve => {
    batchWriter.end(() => resolve());
  });

  console.log('  ✅ 可写流演示完成');
}

module.exports = {
  ConsoleWriter,
  MemoryWriter,
  BufferedFileWriter,
  MultiWriter,
  demonstrateWritableStreams
};
```

## 🔄 Transform流实现

### 数据转换流

```javascript
// transform-stream.js
const { Transform } = require('stream');

// JSON解析转换流
class JSONParser extends Transform {
  constructor(options = {}) {
    super({ 
      ...options,
      objectMode: true // 输出对象
    });
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    
    // 尝试解析JSON对象
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // 保留不完整的行
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        try {
          const obj = JSON.parse(trimmed);
          this.push(obj);
        } catch (error) {
          this.emit('error', new Error(`JSON解析失败: ${error.message}, 行: ${trimmed}`));
          return;
        }
      }
    }
    
    callback();
  }

  _flush(callback) {
    // 处理最后的缓冲区内容
    if (this.buffer.trim()) {
      try {
        const obj = JSON.parse(this.buffer.trim());
        this.push(obj);
      } catch (error) {
        this.emit('error', new Error(`最后一行JSON解析失败: ${error.message}`));
        return;
      }
    }
    callback();
  }
}

// 数据过滤转换流
class DataFilter extends Transform {
  constructor(filterFn, options = {}) {
    super({ 
      ...options,
      objectMode: true 
    });
    this.filterFn = filterFn;
    this.filteredCount = 0;
    this.totalCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.totalCount++;
    
    try {
      if (this.filterFn(chunk)) {
        this.push(chunk);
      } else {
        this.filteredCount++;
      }
      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback) {
    // 输出统计信息
    this.push({
      _stats: {
        total: this.totalCount,
        filtered: this.filteredCount,
        passed: this.totalCount - this.filteredCount
      }
    });
    callback();
  }

  getStats() {
    return {
      total: this.totalCount,
      filtered: this.filteredCount,
      passed: this.totalCount - this.filteredCount,
      filterRate: (this.filteredCount / this.totalCount * 100).toFixed(2) + '%'
    };
  }
}

// 数据聚合转换流
class DataAggregator extends Transform {
  constructor(options = {}) {
    super({ 
      ...options,
      objectMode: true 
    });
    this.windowSize = options.windowSize || 10;
    this.window = [];
    this.aggregateFn = options.aggregateFn || this._defaultAggregate;
  }

  _defaultAggregate(window) {
    if (window.length === 0) return null;
    
    // 简单的统计聚合
    const numbers = window.filter(item => typeof item === 'number');
    if (numbers.length === 0) return { count: window.length };
    
    return {
      count: window.length,
      sum: numbers.reduce((a, b) => a + b, 0),
      avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
      min: Math.min(...numbers),
      max: Math.max(...numbers)
    };
  }

  _transform(chunk, encoding, callback) {
    this.window.push(chunk);
    
    if (this.window.length >= this.windowSize) {
      const aggregated = this.aggregateFn([...this.window]);
      if (aggregated !== null) {
        this.push(aggregated);
      }
      
      // 滑动窗口
      this.window = this.window.slice(Math.floor(this.windowSize / 2));
    }
    
    callback();
  }

  _flush(callback) {
    // 处理剩余的窗口数据
    if (this.window.length > 0) {
      const aggregated = this.aggregateFn([...this.window]);
      if (aggregated !== null) {
        this.push(aggregated);
      }
    }
    callback();
  }
}

// 数据验证转换流
class DataValidator extends Transform {
  constructor(schema, options = {}) {
    super({ 
      ...options,
      objectMode: true 
    });
    this.schema = schema;
    this.validCount = 0;
    this.invalidCount = 0;
    this.strictMode = options.strictMode !== false;
  }

  _validateObject(obj) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(this.schema)) {
      const value = obj[field];
      
      // 检查必需字段
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`字段 '${field}' 是必需的`);
        continue;
      }
      
      if (value !== undefined && value !== null) {
        // 类型检查
        if (rules.type && typeof value !== rules.type) {
          errors.push(`字段 '${field}' 类型应为 ${rules.type}，实际为 ${typeof value}`);
        }
        
        // 范围检查
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`字段 '${field}' 值 ${value} 小于最小值 ${rules.min}`);
        }
        
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`字段 '${field}' 值 ${value} 大于最大值 ${rules.max}`);
        }
        
        // 长度检查
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`字段 '${field}' 长度 ${value.length} 小于最小长度 ${rules.minLength}`);
        }
        
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`字段 '${field}' 长度 ${value.length} 大于最大长度 ${rules.maxLength}`);
        }
        
        // 正则表达式检查
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`字段 '${field}' 值 '${value}' 不匹配模式 ${rules.pattern}`);
        }
      }
    }
    
    return errors;
  }

  _transform(chunk, encoding, callback) {
    const errors = this._validateObject(chunk);
    
    if (errors.length === 0) {
      this.validCount++;
      this.push(chunk);
    } else {
      this.invalidCount++;
      
      if (this.strictMode) {
        callback(new Error(`数据验证失败: ${errors.join(', ')}`));
        return;
      } else {
        // 非严格模式，添加错误信息
        this.push({
          ...chunk,
          _validationErrors: errors
        });
      }
    }
    
    callback();
  }

  getValidationStats() {
    return {
      valid: this.validCount,
      invalid: this.invalidCount,
      total: this.validCount + this.invalidCount,
      validRate: (this.validCount / (this.validCount + this.invalidCount) * 100).toFixed(2) + '%'
    };
  }
}

// 使用示例
async function demonstrateTransformStreams() {
  console.log('🔄 Transform流演示...\n');

  const { Readable } = require('stream');
  const { pipeline } = require('stream/promises');

  // 1. JSON解析演示
  console.log('1. JSON解析转换流:');
  
  const jsonData = new Readable({
    read() {
      const data = [
        '{"id": 1, "name": "Alice", "age": 25}\n',
        '{"id": 2, "name": "Bob", "age": 30}\n',
        '{"id": 3, "name": "Charlie", "age": 35}\n',
        null
      ];
      this.push(data.shift());
    }
  });

  const jsonParser = new JSONParser();
  const results = [];

  try {
    await pipeline(
      jsonData,
      jsonParser,
      new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          results.push(chunk);
          console.log(`  解析对象:`, chunk);
          callback();
        }
      })
    );
    console.log('  ✅ JSON解析完成\n');
  } catch (error) {
    console.error('  ❌ JSON解析失败:', error.message);
  }

  // 2. 数据过滤演示
  console.log('2. 数据过滤转换流:');
  
  const numberStream = new Readable({
    objectMode: true,
    read() {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null];
      this.push(numbers.shift());
    }
  });

  const evenFilter = new DataFilter(num => typeof num === 'number' && num % 2 === 0);

  try {
    await pipeline(
      numberStream,
      evenFilter,
      new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          if (chunk._stats) {
            console.log('  过滤统计:', chunk._stats);
          } else {
            console.log(`  通过过滤的数字: ${chunk}`);
          }
          callback();
        }
      })
    );
    console.log('  ✅ 数据过滤完成\n');
  } catch (error) {
    console.error('  ❌ 数据过滤失败:', error.message);
  }

  // 3. 数据聚合演示
  console.log('3. 数据聚合转换流:');
  
  const dataStream = new Readable({
    objectMode: true,
    read() {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, null];
      this.push(data.shift());
    }
  });

  const aggregator = new DataAggregator({ windowSize: 5 });

  try {
    await pipeline(
      dataStream,
      aggregator,
      new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          console.log('  聚合结果:', chunk);
          callback();
        }
      })
    );
    console.log('  ✅ 数据聚合完成');
  } catch (error) {
    console.error('  ❌ 数据聚合失败:', error.message);
  }

  console.log('\n✅ Transform流演示完成');
}

module.exports = {
  JSONParser,
  DataFilter,
  DataAggregator,
  DataValidator,
  demonstrateTransformStreams
};
```

Node.js Streams提供了强大的数据处理能力，是构建高效I/O应用的基础！
