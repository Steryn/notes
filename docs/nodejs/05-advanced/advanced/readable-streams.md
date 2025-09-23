# 可读流

## 🎯 学习目标

- 深入理解可读流的工作原理和生命周期
- 掌握自定义可读流的实现方法
- 学会可读流的性能优化和错误处理
- 了解背压处理和流控制机制

## 📚 核心概念

### 可读流基础

```javascript
// 可读流的核心概念
const readableStreamConcepts = {
  modes: {
    flowing: {
      description: '流动模式 - 数据自动流出',
      triggers: ['data事件监听', 'pipe()调用', 'resume()调用'],
      characteristics: ['自动读取', '事件驱动', '高吞吐量']
    },
    paused: {
      description: '暂停模式 - 手动读取数据',
      triggers: ['创建时默认', 'pause()调用', '移除data监听器'],
      characteristics: ['手动控制', 'read()方法', '精确控制']
    }
  },
  states: {
    readable: '可读状态 - 有数据可读',
    ended: '结束状态 - 没有更多数据',
    destroyed: '销毁状态 - 流已被销毁'
  },
  buffers: {
    internal: '内部缓冲区 - 存储待读取数据',
    highWaterMark: '高水位标记 - 缓冲区大小限制'
  }
};

console.log('可读流概念:', readableStreamConcepts);
```

## 🛠️ 自定义可读流实现

### 基础可读流

```javascript
// basic-readable-stream.js
const { Readable } = require('stream');
const fs = require('fs');

// 数字序列生成器
class NumberSequenceStream extends Readable {
  constructor(options = {}) {
    super(options);
    this.start = options.start || 1;
    this.end = options.end || 100;
    this.current = this.start;
    this.step = options.step || 1;
    this.delay = options.delay || 0;
  }

  _read() {
    if (this.current <= this.end) {
      const data = {
        number: this.current,
        timestamp: Date.now(),
        isEven: this.current % 2 === 0
      };

      if (this.delay > 0) {
        setTimeout(() => {
          this.push(JSON.stringify(data) + '\n');
        }, this.delay);
      } else {
        this.push(JSON.stringify(data) + '\n');
      }

      this.current += this.step;
    } else {
      // 结束流
      this.push(null);
    }
  }
}

// 文件行读取器
class LineReaderStream extends Readable {
  constructor(filePath, options = {}) {
    super(options);
    this.filePath = filePath;
    this.fd = null;
    this.position = 0;
    this.buffer = Buffer.alloc(0);
    this.encoding = options.encoding || 'utf8';
    this.chunkSize = options.chunkSize || 64 * 1024; // 64KB
    this.lineNumber = 0;
    
    this._openFile();
  }

  async _openFile() {
    try {
      this.fd = await fs.promises.open(this.filePath, 'r');
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

    this._readChunk();
  }

  async _readChunk() {
    try {
      const chunk = Buffer.alloc(this.chunkSize);
      const { bytesRead } = await this.fd.read(chunk, 0, this.chunkSize, this.position);
      
      if (bytesRead === 0) {
        // 文件读取完毕，处理剩余缓冲区
        if (this.buffer.length > 0) {
          this._emitLine(this.buffer.toString(this.encoding));
        }
        this.push(null);
        return;
      }

      this.position += bytesRead;
      this.buffer = Buffer.concat([this.buffer, chunk.slice(0, bytesRead)]);
      
      this._processBuffer();

    } catch (error) {
      this.destroy(error);
    }
  }

  _processBuffer() {
    let lineStart = 0;
    
    for (let i = 0; i < this.buffer.length; i++) {
      if (this.buffer[i] === 0x0A) { // \n
        const line = this.buffer.slice(lineStart, i).toString(this.encoding);
        this._emitLine(line);
        lineStart = i + 1;
      }
    }
    
    // 保留未完成的行
    if (lineStart < this.buffer.length) {
      this.buffer = this.buffer.slice(lineStart);
    } else {
      this.buffer = Buffer.alloc(0);
    }
  }

  _emitLine(line) {
    this.lineNumber++;
    const lineData = {
      number: this.lineNumber,
      content: line.replace(/\r$/, ''), // 移除\r
      length: line.length
    };
    
    this.push(JSON.stringify(lineData) + '\n');
  }

  _destroy(error, callback) {
    if (this.fd) {
      this.fd.close().finally(() => callback(error));
    } else {
      callback(error);
    }
  }
}

// HTTP响应流包装器
class HTTPResponseStream extends Readable {
  constructor(url, options = {}) {
    super(options);
    this.url = url;
    this.response = null;
    this.headers = null;
    this.statusCode = null;
    
    this._makeRequest();
  }

  _makeRequest() {
    const https = require('https');
    const http = require('http');
    const { URL } = require('url');
    
    const parsedUrl = new URL(this.url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const request = client.get(this.url, (response) => {
      this.response = response;
      this.headers = response.headers;
      this.statusCode = response.statusCode;
      
      // 发出响应头信息
      this.emit('response', {
        statusCode: response.statusCode,
        headers: response.headers
      });
      
      response.on('data', (chunk) => {
        this.push(chunk);
      });
      
      response.on('end', () => {
        this.push(null);
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
}

// 使用示例
async function demonstrateBasicReadableStreams() {
  console.log('🔍 基础可读流演示...\n');

  // 1. 数字序列生成器
  console.log('1. 数字序列生成器:');
  const numberStream = new NumberSequenceStream({ 
    start: 1, 
    end: 5, 
    delay: 200 
  });

  numberStream.on('data', (chunk) => {
    const data = JSON.parse(chunk.toString().trim());
    console.log(`  生成数字: ${data.number}, 偶数: ${data.isEven}`);
  });

  numberStream.on('end', () => {
    console.log('  ✅ 数字序列生成完成\n');
  });

  // 等待数字流完成
  await new Promise(resolve => numberStream.on('end', resolve));

  // 2. 对象模式流
  console.log('2. 对象模式可读流:');
  const objectStream = new Readable({
    objectMode: true,
    read() {
      const users = [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' },
        { id: 3, name: 'Charlie', role: 'moderator' },
        null // 结束标记
      ];
      
      this.push(users.shift());
    }
  });

  objectStream.on('data', (user) => {
    console.log(`  用户: ${user.name} (${user.role})`);
  });

  objectStream.on('end', () => {
    console.log('  ✅ 对象流结束\n');
  });

  // 3. 可控流演示
  console.log('3. 流控制演示:');
  const controlledStream = new Readable({
    read() {
      // 不立即推送数据
    }
  });

  let counter = 0;
  const pushData = () => {
    counter++;
    if (counter <= 3) {
      controlledStream.push(`数据块 ${counter}\n`);
      setTimeout(pushData, 500);
    } else {
      controlledStream.push(null);
    }
  };

  setTimeout(pushData, 100);

  controlledStream.on('data', (chunk) => {
    console.log(`  接收: ${chunk.toString().trim()}`);
  });

  controlledStream.on('end', () => {
    console.log('  ✅ 控制流结束');
  });
}

module.exports = {
  NumberSequenceStream,
  LineReaderStream,
  HTTPResponseStream,
  demonstrateBasicReadableStreams
};
```

### 高级可读流实现

```javascript
// advanced-readable-stream.js
const { Readable } = require('stream');
const EventEmitter = require('events');

// 数据库查询流
class DatabaseQueryStream extends Readable {
  constructor(query, options = {}) {
    super({ objectMode: true, ...options });
    this.query = query;
    this.batchSize = options.batchSize || 100;
    this.offset = 0;
    this.isFinished = false;
    this.totalRows = 0;
    
    // 模拟数据库连接
    this.db = options.db || this._createMockDB();
  }

  _createMockDB() {
    // 模拟数据库
    return {
      query: async (sql, params) => {
        // 模拟查询延迟
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const offset = params[0] || 0;
        const limit = params[1] || this.batchSize;
        
        // 生成模拟数据
        const rows = [];
        for (let i = 0; i < limit && offset + i < 1000; i++) {
          rows.push({
            id: offset + i + 1,
            name: `User ${offset + i + 1}`,
            email: `user${offset + i + 1}@example.com`,
            created_at: new Date()
          });
        }
        
        return rows;
      }
    };
  }

  async _read() {
    if (this.isFinished) {
      return;
    }

    try {
      const rows = await this.db.query(
        `${this.query} LIMIT ? OFFSET ?`,
        [this.batchSize, this.offset]
      );

      if (rows.length === 0) {
        this.isFinished = true;
        this.push(null);
        return;
      }

      // 推送每一行数据
      for (const row of rows) {
        this.push(row);
        this.totalRows++;
      }

      this.offset += rows.length;

      // 如果返回的行数少于批次大小，说明已经到末尾
      if (rows.length < this.batchSize) {
        this.isFinished = true;
        this.push(null);
      }

    } catch (error) {
      this.destroy(error);
    }
  }

  getTotalRows() {
    return this.totalRows;
  }
}

// 分页数据流
class PaginatedDataStream extends Readable {
  constructor(dataSource, options = {}) {
    super({ objectMode: true, ...options });
    this.dataSource = dataSource;
    this.pageSize = options.pageSize || 50;
    this.currentPage = 1;
    this.totalPages = 0;
    this.isLoading = false;
  }

  async _read() {
    if (this.isLoading) {
      return;
    }

    if (this.totalPages > 0 && this.currentPage > this.totalPages) {
      this.push(null);
      return;
    }

    this.isLoading = true;

    try {
      const result = await this.dataSource.getPage(this.currentPage, this.pageSize);
      
      if (this.totalPages === 0) {
        this.totalPages = result.totalPages;
      }

      if (result.data && result.data.length > 0) {
        for (const item of result.data) {
          this.push(item);
        }
      }

      this.currentPage++;

      if (this.currentPage > this.totalPages || result.data.length === 0) {
        this.push(null);
      }

    } catch (error) {
      this.destroy(error);
    } finally {
      this.isLoading = false;
    }
  }

  getCurrentPage() {
    return this.currentPage - 1;
  }

  getTotalPages() {
    return this.totalPages;
  }
}

// 实时数据流
class RealTimeDataStream extends Readable {
  constructor(dataSource, options = {}) {
    super({ objectMode: true, ...options });
    this.dataSource = dataSource;
    this.interval = options.interval || 1000;
    this.isActive = false;
    this.timer = null;
    this.buffer = [];
    this.maxBufferSize = options.maxBufferSize || 1000;
  }

  _read() {
    if (!this.isActive) {
      this.startPolling();
    }

    // 从缓冲区推送数据
    while (this.buffer.length > 0) {
      const data = this.buffer.shift();
      if (!this.push(data)) {
        // 背压处理 - 停止推送
        break;
      }
    }
  }

  startPolling() {
    this.isActive = true;
    
    const poll = async () => {
      try {
        const data = await this.dataSource.getLatestData();
        
        if (data) {
          if (this.buffer.length < this.maxBufferSize) {
            this.buffer.push(data);
          } else {
            // 缓冲区满，丢弃最老的数据
            this.buffer.shift();
            this.buffer.push(data);
            this.emit('bufferOverflow', { droppedData: true });
          }
        }
        
        // 尝试推送数据
        this._read();
        
      } catch (error) {
        this.emit('error', error);
      }
      
      if (this.isActive) {
        this.timer = setTimeout(poll, this.interval);
      }
    };

    poll();
  }

  stopPolling() {
    this.isActive = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  _destroy(error, callback) {
    this.stopPolling();
    callback(error);
  }

  setInterval(newInterval) {
    this.interval = newInterval;
    if (this.isActive) {
      this.stopPolling();
      this.startPolling();
    }
  }
}

// 多源合并流
class MergedReadableStream extends Readable {
  constructor(sources, options = {}) {
    super({ objectMode: true, ...options });
    this.sources = sources;
    this.activeSources = new Set(sources);
    this.buffer = [];
    this.mergeStrategy = options.mergeStrategy || 'round-robin'; // 'round-robin', 'priority', 'timestamp'
    this.currentSourceIndex = 0;
    
    this.setupSources();
  }

  setupSources() {
    this.sources.forEach((source, index) => {
      source.on('data', (data) => {
        this.handleSourceData(data, index);
      });

      source.on('end', () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0) {
          this.push(null);
        }
      });

      source.on('error', (error) => {
        this.destroy(error);
      });
    });
  }

  handleSourceData(data, sourceIndex) {
    const enrichedData = {
      ...data,
      sourceIndex,
      timestamp: Date.now()
    };

    this.buffer.push(enrichedData);
    this._read();
  }

  _read() {
    if (this.buffer.length === 0) {
      return;
    }

    let dataToSend;

    switch (this.mergeStrategy) {
      case 'round-robin':
        dataToSend = this.buffer.shift();
        break;
        
      case 'priority':
        // 按源索引优先级排序
        this.buffer.sort((a, b) => a.sourceIndex - b.sourceIndex);
        dataToSend = this.buffer.shift();
        break;
        
      case 'timestamp':
        // 按时间戳排序
        this.buffer.sort((a, b) => a.timestamp - b.timestamp);
        dataToSend = this.buffer.shift();
        break;
        
      default:
        dataToSend = this.buffer.shift();
    }

    this.push(dataToSend);
  }

  _destroy(error, callback) {
    this.sources.forEach(source => {
      if (source.destroy) {
        source.destroy();
      }
    });
    callback(error);
  }
}

module.exports = {
  DatabaseQueryStream,
  PaginatedDataStream,
  RealTimeDataStream,
  MergedReadableStream
};
```

## ⚡ 性能优化和背压处理

### 背压处理机制

```javascript
// backpressure-handling.js
const { Readable, pipeline } = require('stream');
const { promisify } = require('util');

class BackpressureAwareStream extends Readable {
  constructor(options = {}) {
    super(options);
    this.dataQueue = [];
    this.isReading = false;
    this.highWaterMark = options.highWaterMark || 16384;
    this.backpressureCount = 0;
    this.totalPushed = 0;
    
    // 性能监控
    this.stats = {
      backpressureEvents: 0,
      totalDataGenerated: 0,
      bufferOverflows: 0,
      avgProcessingTime: 0,
      processingTimes: []
    };
  }

  _read(size) {
    if (this.isReading) {
      return;
    }

    this.isReading = true;
    this.processQueue();
  }

  processQueue() {
    const startTime = Date.now();

    while (this.dataQueue.length > 0) {
      const data = this.dataQueue.shift();
      
      // 尝试推送数据
      const canPushMore = this.push(data);
      this.totalPushed++;

      if (!canPushMore) {
        // 遇到背压，停止推送
        this.backpressureCount++;
        this.stats.backpressureEvents++;
        console.log(`⚠️ 背压检测，暂停数据推送 (队列剩余: ${this.dataQueue.length})`);
        break;
      }
    }

    const processingTime = Date.now() - startTime;
    this.stats.processingTimes.push(processingTime);
    
    if (this.stats.processingTimes.length > 100) {
      this.stats.processingTimes = this.stats.processingTimes.slice(-100);
    }
    
    this.stats.avgProcessingTime = 
      this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length;

    this.isReading = false;
  }

  addData(data) {
    this.dataQueue.push(data);
    this.stats.totalDataGenerated++;

    // 检查缓冲区是否过载
    if (this.dataQueue.length > this.highWaterMark * 2) {
      this.stats.bufferOverflows++;
      console.warn(`🔴 缓冲区过载，丢弃最旧数据 (队列长度: ${this.dataQueue.length})`);
      
      // 丢弃一半的旧数据
      const dropCount = Math.floor(this.dataQueue.length / 2);
      this.dataQueue.splice(0, dropCount);
    }

    // 如果不在读取状态，尝试处理队列
    if (!this.isReading) {
      setImmediate(() => this.processQueue());
    }
  }

  endStream() {
    // 处理剩余数据
    this.processQueue();
    this.push(null);
  }

  getStats() {
    return {
      ...this.stats,
      queueLength: this.dataQueue.length,
      totalPushed: this.totalPushed,
      backpressureRate: (this.stats.backpressureEvents / this.totalPushed * 100).toFixed(2) + '%'
    };
  }
}

// 自适应流速控制
class AdaptiveRateStream extends Readable {
  constructor(options = {}) {
    super(options);
    this.baseRate = options.baseRate || 100; // 每秒数据项
    this.currentRate = this.baseRate;
    this.minRate = options.minRate || 10;
    this.maxRate = options.maxRate || 1000;
    this.adaptationFactor = options.adaptationFactor || 0.1;
    
    this.lastReadTime = Date.now();
    this.dataCounter = 0;
    this.backpressureCounter = 0;
    
    this.startDataGeneration();
  }

  startDataGeneration() {
    const generateData = () => {
      if (this.destroyed) return;

      const data = {
        id: this.dataCounter++,
        timestamp: Date.now(),
        rate: this.currentRate,
        data: `Data item ${this.dataCounter}`
      };

      const canPush = this.push(JSON.stringify(data) + '\n');
      
      if (!canPush) {
        // 遇到背压，降低速率
        this.backpressureCounter++;
        this.adaptRate(false);
      } else {
        // 成功推送，可以尝试提高速率
        this.adaptRate(true);
      }

      // 根据当前速率计算下次生成间隔
      const interval = Math.max(1, 1000 / this.currentRate);
      setTimeout(generateData, interval);
    };

    generateData();
  }

  adaptRate(successful) {
    if (successful) {
      // 成功推送，适度提高速率
      this.currentRate = Math.min(
        this.maxRate,
        this.currentRate * (1 + this.adaptationFactor)
      );
    } else {
      // 遇到背压，降低速率
      this.currentRate = Math.max(
        this.minRate,
        this.currentRate * (1 - this.adaptationFactor * 2)
      );
    }
  }

  _read() {
    this.lastReadTime = Date.now();
  }

  getPerformanceStats() {
    return {
      currentRate: this.currentRate.toFixed(2),
      baseRate: this.baseRate,
      dataGenerated: this.dataCounter,
      backpressureEvents: this.backpressureCounter,
      adaptationRatio: (this.currentRate / this.baseRate).toFixed(2)
    };
  }
}

// 流性能分析器
class StreamPerformanceAnalyzer {
  constructor() {
    this.metrics = {
      throughput: [],
      latency: [],
      backpressure: [],
      memory: []
    };
  }

  analyzeStream(stream, duration = 10000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let dataCount = 0;
      let totalLatency = 0;
      let backpressureEvents = 0;
      
      const measureInterval = setInterval(() => {
        const memUsage = process.memoryUsage();
        this.metrics.memory.push({
          timestamp: Date.now(),
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal
        });
      }, 1000);

      stream.on('data', (chunk) => {
        dataCount++;
        
        // 尝试解析时间戳计算延迟
        try {
          const data = JSON.parse(chunk.toString().trim());
          if (data.timestamp) {
            const latency = Date.now() - data.timestamp;
            totalLatency += latency;
            this.metrics.latency.push(latency);
          }
        } catch (error) {
          // 忽略解析错误
        }
      });

      stream.on('drain', () => {
        backpressureEvents++;
        this.metrics.backpressure.push({
          timestamp: Date.now(),
          event: 'drain'
        });
      });

      setTimeout(() => {
        clearInterval(measureInterval);
        
        const endTime = Date.now();
        const actualDuration = endTime - startTime;
        
        const analysis = {
          duration: actualDuration,
          throughput: {
            itemsPerSecond: (dataCount / actualDuration * 1000).toFixed(2),
            totalItems: dataCount
          },
          latency: {
            average: totalLatency > 0 ? (totalLatency / dataCount).toFixed(2) + 'ms' : 'N/A',
            samples: this.metrics.latency.length
          },
          backpressure: {
            events: backpressureEvents,
            rate: (backpressureEvents / dataCount * 100).toFixed(2) + '%'
          },
          memory: {
            peak: Math.max(...this.metrics.memory.map(m => m.heapUsed)),
            average: this.metrics.memory.reduce((sum, m) => sum + m.heapUsed, 0) / this.metrics.memory.length
          }
        };

        resolve(analysis);
      }, duration);
    });
  }

  generateReport(analysis) {
    console.log('\n📊 流性能分析报告:');
    console.log('='.repeat(40));
    console.log(`测试时长: ${analysis.duration}ms`);
    console.log(`吞吐量: ${analysis.throughput.itemsPerSecond} items/sec`);
    console.log(`总处理项目: ${analysis.throughput.totalItems}`);
    console.log(`平均延迟: ${analysis.latency.average}`);
    console.log(`背压事件: ${analysis.backpressure.events} (${analysis.backpressure.rate})`);
    console.log(`峰值内存: ${(analysis.memory.peak / 1024 / 1024).toFixed(2)}MB`);
    console.log(`平均内存: ${(analysis.memory.average / 1024 / 1024).toFixed(2)}MB`);
  }
}

// 使用示例
async function demonstrateBackpressureHandling() {
  console.log('⚡ 背压处理演示...\n');

  const analyzer = new StreamPerformanceAnalyzer();

  // 1. 背压感知流测试
  console.log('1. 背压感知流测试:');
  const backpressureStream = new BackpressureAwareStream({ highWaterMark: 1024 });

  // 模拟快速数据生成
  let counter = 0;
  const dataGenerator = setInterval(() => {
    if (counter < 1000) {
      backpressureStream.addData(`数据项 ${counter++}\n`);
    } else {
      clearInterval(dataGenerator);
      backpressureStream.endStream();
    }
  }, 1);

  let receivedCount = 0;
  backpressureStream.on('data', () => {
    receivedCount++;
  });

  backpressureStream.on('end', () => {
    const stats = backpressureStream.getStats();
    console.log('  背压统计:', stats);
    console.log(`  接收数据: ${receivedCount}\n`);
  });

  // 等待背压流完成
  await new Promise(resolve => backpressureStream.on('end', resolve));

  // 2. 自适应速率流测试
  console.log('2. 自适应速率流测试:');
  const adaptiveStream = new AdaptiveRateStream({ 
    baseRate: 50,
    maxRate: 200,
    minRate: 5
  });

  // 分析自适应流性能
  const adaptiveAnalysis = await analyzer.analyzeStream(adaptiveStream, 5000);
  
  console.log('  自适应流统计:', adaptiveStream.getPerformanceStats());
  analyzer.generateReport(adaptiveAnalysis);

  adaptiveStream.destroy();
}

module.exports = {
  BackpressureAwareStream,
  AdaptiveRateStream,
  StreamPerformanceAnalyzer,
  demonstrateBackpressureHandling
};
```

可读流是Node.js流系统的基础，掌握其原理和优化技巧对构建高效的数据处理应用至关重要！
