# 可写流

## 🎯 学习目标

- 深入理解可写流的工作原理和生命周期
- 掌握自定义可写流的实现方法
- 学会可写流的性能优化和背压处理
- 了解流式数据写入和批量处理技术

## 📚 核心概念

### 可写流基础

```javascript
// 可写流核心概念
const writableStreamConcepts = {
  states: {
    writable: '可写状态 - 可以接受数据写入',
    ending: '结束状态 - 调用end()后，等待所有数据写完',
    ended: '已结束状态 - 所有数据已写入完成',
    destroyed: '销毁状态 - 流已被销毁',
    error: '错误状态 - 发生写入错误'
  },
  methods: {
    write: '写入数据块',
    end: '结束写入并关闭流',
    destroy: '销毁流',
    cork: '暂停写入操作',
    uncork: '恢复写入操作'
  },
  events: {
    drain: '背压解除，可以继续写入',
    finish: '所有数据写入完成',
    error: '写入过程中发生错误',
    close: '流已关闭',
    pipe: '有可读流管道连接到此流',
    unpipe: '可读流断开管道连接'
  },
  backpressure: {
    description: '背压机制 - 当写入缓冲区满时暂停写入',
    handling: ['监听drain事件', '检查write返回值', '实现流控制']
  }
};

console.log('可写流概念:', writableStreamConcepts);
```

## 🛠️ 自定义可写流实现

### 基础可写流

```javascript
// basic-writable-stream.js
const { Writable } = require('stream');
const fs = require('fs');
const path = require('path');

// 文件写入流
class FileWriterStream extends Writable {
  constructor(filePath, options = {}) {
    super(options);
    
    this.filePath = filePath;
    this.fd = null;
    this.bytesWritten = 0;
    this.encoding = options.encoding || 'utf8';
    
    // 确保目录存在
    this.ensureDirectory();
    
    // 打开文件
    this.openFile();
  }

  async ensureDirectory() {
    const dir = path.dirname(this.filePath);
    try {
      await fs.promises.mkdir(dir, { recursive: true });
    } catch (error) {
      this.destroy(error);
    }
  }

  async openFile() {
    try {
      this.fd = await fs.promises.open(this.filePath, 'w');
      console.log(`📝 文件已打开: ${this.filePath}`);
    } catch (error) {
      this.destroy(error);
    }
  }

  _write(chunk, encoding, callback) {
    if (!this.fd) {
      // 文件还未打开，延迟写入
      setTimeout(() => this._write(chunk, encoding, callback), 10);
      return;
    }

    this.writeToFile(chunk, encoding, callback);
  }

  async writeToFile(chunk, encoding, callback) {
    try {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
      const { bytesWritten } = await this.fd.write(buffer);
      
      this.bytesWritten += bytesWritten;
      
      // 发出写入进度事件
      this.emit('progress', {
        bytesWritten: this.bytesWritten,
        chunkSize: bytesWritten
      });
      
      callback();
    } catch (error) {
      callback(error);
    }
  }

  _final(callback) {
    // 流结束时的清理工作
    console.log(`✅ 文件写入完成: ${this.bytesWritten} 字节`);
    callback();
  }

  _destroy(error, callback) {
    // 关闭文件描述符
    if (this.fd) {
      this.fd.close().finally(() => {
        console.log(`🔒 文件已关闭: ${this.filePath}`);
        callback(error);
      });
    } else {
      callback(error);
    }
  }

  getBytesWritten() {
    return this.bytesWritten;
  }
}

// 日志写入流
class LogWriterStream extends Writable {
  constructor(options = {}) {
    super({ objectMode: true, ...options });
    
    this.logLevel = options.logLevel || 'info';
    this.format = options.format || 'json';
    this.includeTimestamp = options.includeTimestamp !== false;
    this.includeLevel = options.includeLevel !== false;
    this.colorize = options.colorize && process.stdout.isTTY;
    
    this.colors = {
      error: '\x1b[31m',   // 红色
      warn: '\x1b[33m',    // 黄色
      info: '\x1b[36m',    // 青色
      debug: '\x1b[37m',   // 白色
      reset: '\x1b[0m'     // 重置
    };
  }

  _write(chunk, encoding, callback) {
    try {
      const logEntry = this.processLogEntry(chunk);
      const formatted = this.formatLogEntry(logEntry);
      
      // 写入到标准输出或标准错误
      const output = logEntry.level === 'error' ? process.stderr : process.stdout;
      output.write(formatted + '\n');
      
      callback();
    } catch (error) {
      callback(error);
    }
  }

  processLogEntry(chunk) {
    let logEntry;
    
    if (typeof chunk === 'string') {
      logEntry = {
        level: this.logLevel,
        message: chunk
      };
    } else if (typeof chunk === 'object') {
      logEntry = {
        level: chunk.level || this.logLevel,
        message: chunk.message || JSON.stringify(chunk),
        ...chunk
      };
    } else {
      logEntry = {
        level: this.logLevel,
        message: String(chunk)
      };
    }
    
    if (this.includeTimestamp) {
      logEntry.timestamp = new Date().toISOString();
    }
    
    return logEntry;
  }

  formatLogEntry(logEntry) {
    switch (this.format) {
      case 'json':
        return JSON.stringify(logEntry);
        
      case 'text':
        return this.formatTextEntry(logEntry);
        
      case 'pretty':
        return this.formatPrettyEntry(logEntry);
        
      default:
        return JSON.stringify(logEntry);
    }
  }

  formatTextEntry(logEntry) {
    const parts = [];
    
    if (logEntry.timestamp) {
      parts.push(`[${logEntry.timestamp}]`);
    }
    
    if (this.includeLevel) {
      parts.push(`${logEntry.level.toUpperCase()}`);
    }
    
    parts.push(logEntry.message);
    
    return parts.join(' ');
  }

  formatPrettyEntry(logEntry) {
    let formatted = this.formatTextEntry(logEntry);
    
    if (this.colorize && this.colors[logEntry.level]) {
      formatted = this.colors[logEntry.level] + formatted + this.colors.reset;
    }
    
    return formatted;
  }
}

// 数据验证写入流
class ValidatingWriterStream extends Writable {
  constructor(validator, options = {}) {
    super({ objectMode: true, ...options });
    
    this.validator = validator;
    this.validCount = 0;
    this.invalidCount = 0;
    this.errors = [];
    
    this.onInvalidData = options.onInvalidData || 'error'; // 'error', 'skip', 'log'
  }

  _write(chunk, encoding, callback) {
    try {
      const validationResult = this.validateChunk(chunk);
      
      if (validationResult.valid) {
        this.validCount++;
        this.emit('validData', chunk, validationResult);
        callback();
      } else {
        this.invalidCount++;
        this.handleInvalidData(chunk, validationResult, callback);
      }
    } catch (error) {
      callback(error);
    }
  }

  validateChunk(chunk) {
    try {
      const result = this.validator(chunk);
      
      if (typeof result === 'boolean') {
        return { valid: result, errors: result ? [] : ['Validation failed'] };
      } else if (typeof result === 'object') {
        return result;
      } else {
        return { valid: false, errors: ['Invalid validator result'] };
      }
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  }

  handleInvalidData(chunk, validationResult, callback) {
    const error = new Error(`数据验证失败: ${validationResult.errors.join(', ')}`);
    error.chunk = chunk;
    error.validationResult = validationResult;
    
    this.errors.push({
      timestamp: Date.now(),
      chunk,
      errors: validationResult.errors
    });

    switch (this.onInvalidData) {
      case 'error':
        callback(error);
        break;
        
      case 'skip':
        console.warn(`⚠️ 跳过无效数据: ${validationResult.errors.join(', ')}`);
        this.emit('invalidData', chunk, validationResult);
        callback();
        break;
        
      case 'log':
        console.error(`❌ 无效数据: ${validationResult.errors.join(', ')}`);
        this.emit('invalidData', chunk, validationResult);
        callback();
        break;
        
      default:
        callback(error);
    }
  }

  getStats() {
    return {
      valid: this.validCount,
      invalid: this.invalidCount,
      total: this.validCount + this.invalidCount,
      successRate: (this.validCount / (this.validCount + this.invalidCount) * 100).toFixed(2) + '%',
      errors: this.errors.slice(-10) // 最近10个错误
    };
  }
}

// 使用示例
async function demonstrateBasicWritableStreams() {
  console.log('📝 基础可写流演示...\n');

  // 1. 文件写入流演示
  console.log('1. 文件写入流:');
  const fileWriter = new FileWriterStream('./output/test.txt');
  
  fileWriter.on('progress', (progress) => {
    console.log(`  写入进度: ${progress.bytesWritten} 字节 (+${progress.chunkSize})`);
  });

  fileWriter.on('finish', () => {
    console.log(`  ✅ 文件写入完成: ${fileWriter.getBytesWritten()} 字节\n`);
  });

  fileWriter.write('第一行数据\n');
  fileWriter.write('第二行数据\n');
  fileWriter.write('第三行数据\n');
  fileWriter.end();

  // 等待文件写入完成
  await new Promise(resolve => fileWriter.on('finish', resolve));

  // 2. 日志写入流演示
  console.log('2. 日志写入流:');
  const logger = new LogWriterStream({
    format: 'pretty',
    colorize: true
  });

  logger.write({ level: 'info', message: '应用启动' });
  logger.write({ level: 'warn', message: '配置文件缺少某些选项' });
  logger.write({ level: 'error', message: '数据库连接失败', error: 'ECONNREFUSED' });
  logger.write('这是一个普通的日志消息');

  // 3. 数据验证流演示
  console.log('\n3. 数据验证流:');
  const validator = (data) => {
    if (typeof data !== 'object') {
      return { valid: false, errors: ['数据必须是对象'] };
    }
    
    if (!data.id || typeof data.id !== 'number') {
      return { valid: false, errors: ['缺少有效的id字段'] };
    }
    
    if (!data.name || typeof data.name !== 'string') {
      return { valid: false, errors: ['缺少有效的name字段'] };
    }
    
    return { valid: true, errors: [] };
  };

  const validatingWriter = new ValidatingWriterStream(validator, {
    onInvalidData: 'log'
  });

  validatingWriter.on('validData', (data) => {
    console.log(`  ✅ 有效数据: ${JSON.stringify(data)}`);
  });

  validatingWriter.on('invalidData', (data, result) => {
    console.log(`  ❌ 无效数据: ${JSON.stringify(data)} - ${result.errors.join(', ')}`);
  });

  validatingWriter.on('finish', () => {
    const stats = validatingWriter.getStats();
    console.log(`  📊 验证统计: 有效=${stats.valid}, 无效=${stats.invalid}, 成功率=${stats.successRate}\n`);
  });

  // 写入测试数据
  validatingWriter.write({ id: 1, name: 'Alice' }); // 有效
  validatingWriter.write({ id: 2 }); // 无效 - 缺少name
  validatingWriter.write({ name: 'Bob' }); // 无效 - 缺少id
  validatingWriter.write('invalid'); // 无效 - 不是对象
  validatingWriter.write({ id: 3, name: 'Charlie' }); // 有效
  validatingWriter.end();

  // 等待验证完成
  await new Promise(resolve => validatingWriter.on('finish', resolve));
}

module.exports = {
  FileWriterStream,
  LogWriterStream,
  ValidatingWriterStream,
  demonstrateBasicWritableStreams
};
```

### 高级可写流实现

```javascript
// advanced-writable-stream.js
const { Writable } = require('stream');
const EventEmitter = require('events');

// 批量处理写入流
class BatchWriterStream extends Writable {
  constructor(processor, options = {}) {
    super({ objectMode: true, ...options });
    
    this.processor = processor; // 批处理函数
    this.batchSize = options.batchSize || 100;
    this.flushInterval = options.flushInterval || 1000;
    this.maxRetries = options.maxRetries || 3;
    
    this.batch = [];
    this.flushTimer = null;
    this.processedCount = 0;
    this.failedCount = 0;
    this.retryQueue = [];
    
    this.stats = {
      batchesProcessed: 0,
      itemsProcessed: 0,
      itemsFailed: 0,
      retriesAttempted: 0,
      avgBatchSize: 0,
      avgProcessingTime: 0,
      processingTimes: []
    };
  }

  _write(chunk, encoding, callback) {
    this.batch.push({
      data: chunk,
      timestamp: Date.now(),
      retries: 0
    });

    // 检查是否需要立即处理批次
    if (this.batch.length >= this.batchSize) {
      this.flushBatch();
    } else if (!this.flushTimer) {
      // 设置定时刷新
      this.flushTimer = setTimeout(() => {
        this.flushBatch();
      }, this.flushInterval);
    }

    callback();
  }

  async flushBatch() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.batch.length === 0) {
      return;
    }

    const currentBatch = this.batch.splice(0);
    console.log(`📦 处理批次: ${currentBatch.length} 项`);

    try {
      await this.processBatch(currentBatch);
    } catch (error) {
      console.error('❌ 批次处理失败:', error);
      this.handleBatchFailure(currentBatch, error);
    }
  }

  async processBatch(batch) {
    const startTime = Date.now();
    
    try {
      const data = batch.map(item => item.data);
      await this.processor(data);
      
      const processingTime = Date.now() - startTime;
      this.updateStats(batch.length, processingTime, true);
      
      this.processedCount += batch.length;
      console.log(`✅ 批次处理成功: ${batch.length} 项, 耗时 ${processingTime}ms`);
      
      this.emit('batchProcessed', {
        size: batch.length,
        processingTime,
        totalProcessed: this.processedCount
      });
      
    } catch (error) {
      this.updateStats(batch.length, Date.now() - startTime, false);
      throw error;
    }
  }

  handleBatchFailure(batch, error) {
    // 将失败的批次加入重试队列
    batch.forEach(item => {
      if (item.retries < this.maxRetries) {
        item.retries++;
        this.retryQueue.push(item);
        this.stats.retriesAttempted++;
      } else {
        this.failedCount++;
        this.stats.itemsFailed++;
        console.error(`💀 项目最终失败: ${JSON.stringify(item.data)}`);
        
        this.emit('itemFailed', {
          data: item.data,
          error: error.message,
          retries: item.retries
        });
      }
    });

    // 处理重试队列
    this.processRetryQueue();
  }

  async processRetryQueue() {
    if (this.retryQueue.length === 0) {
      return;
    }

    console.log(`🔄 处理重试队列: ${this.retryQueue.length} 项`);
    
    const retryBatch = this.retryQueue.splice(0, this.batchSize);
    
    // 延迟重试
    setTimeout(async () => {
      try {
        await this.processBatch(retryBatch);
      } catch (error) {
        console.error('🔄 重试批次失败:', error);
        this.handleBatchFailure(retryBatch, error);
      }
    }, 1000 * Math.min(retryBatch[0]?.retries || 1, 5)); // 指数退避
  }

  updateStats(batchSize, processingTime, success) {
    this.stats.batchesProcessed++;
    
    if (success) {
      this.stats.itemsProcessed += batchSize;
    }
    
    this.stats.processingTimes.push(processingTime);
    if (this.stats.processingTimes.length > 100) {
      this.stats.processingTimes = this.stats.processingTimes.slice(-100);
    }
    
    this.stats.avgBatchSize = this.stats.itemsProcessed / this.stats.batchesProcessed;
    this.stats.avgProcessingTime = 
      this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length;
  }

  _final(callback) {
    console.log('🏁 流结束，处理剩余批次...');
    
    // 处理剩余的批次
    this.flushBatch().then(() => {
      // 等待重试队列处理完成
      const waitForRetries = () => {
        if (this.retryQueue.length > 0) {
          setTimeout(waitForRetries, 100);
        } else {
          console.log(`✅ 批量写入完成: 处理=${this.processedCount}, 失败=${this.failedCount}`);
          callback();
        }
      };
      
      waitForRetries();
    }).catch(callback);
  }

  getStats() {
    return {
      ...this.stats,
      successRate: (this.stats.itemsProcessed / (this.stats.itemsProcessed + this.stats.itemsFailed) * 100).toFixed(2) + '%',
      retryRate: (this.stats.retriesAttempted / this.stats.itemsProcessed * 100).toFixed(2) + '%'
    };
  }
}

// 多目标写入流
class MultiTargetWriterStream extends Writable {
  constructor(targets, options = {}) {
    super({ objectMode: true, ...options });
    
    this.targets = targets; // 目标写入流数组
    this.strategy = options.strategy || 'all'; // 'all', 'any', 'majority'
    this.continueOnError = options.continueOnError !== false;
    
    this.targetStats = new Map();
    this.initializeTargets();
  }

  initializeTargets() {
    this.targets.forEach((target, index) => {
      this.targetStats.set(index, {
        writes: 0,
        errors: 0,
        lastError: null,
        isHealthy: true
      });

      target.on('error', (error) => {
        const stats = this.targetStats.get(index);
        stats.errors++;
        stats.lastError = error;
        stats.isHealthy = false;
        
        console.error(`❌ 目标 ${index} 写入错误:`, error.message);
        
        if (!this.continueOnError) {
          this.destroy(error);
        }
      });

      target.on('drain', () => {
        this.emit('drain');
      });
    });
  }

  _write(chunk, encoding, callback) {
    const promises = [];
    const healthyTargets = this.targets.filter((_, index) => 
      this.targetStats.get(index).isHealthy
    );

    if (healthyTargets.length === 0) {
      return callback(new Error('没有健康的目标流'));
    }

    healthyTargets.forEach((target, originalIndex) => {
      const promise = new Promise((resolve, reject) => {
        const canWrite = target.write(chunk, encoding, (error) => {
          if (error) {
            reject(error);
          } else {
            const stats = this.targetStats.get(originalIndex);
            stats.writes++;
            resolve(originalIndex);
          }
        });

        if (!canWrite) {
          // 处理背压
          target.once('drain', () => {
            this.emit('drain');
          });
        }
      });
      
      promises.push(promise);
    });

    this.handleWriteStrategy(promises, callback);
  }

  async handleWriteStrategy(promises, callback) {
    try {
      switch (this.strategy) {
        case 'all':
          await Promise.all(promises);
          callback();
          break;
          
        case 'any':
          await Promise.race(promises);
          callback();
          break;
          
        case 'majority':
          const results = await Promise.allSettled(promises);
          const successful = results.filter(r => r.status === 'fulfilled').length;
          
          if (successful > promises.length / 2) {
            callback();
          } else {
            callback(new Error('多数目标写入失败'));
          }
          break;
          
        default:
          callback(new Error(`未知策略: ${this.strategy}`));
      }
    } catch (error) {
      if (this.continueOnError) {
        console.warn(`⚠️ 写入策略失败，继续处理:`, error.message);
        callback();
      } else {
        callback(error);
      }
    }
  }

  _final(callback) {
    const endPromises = this.targets.map(target => {
      return new Promise((resolve) => {
        if (target.writable) {
          target.end(() => resolve());
        } else {
          resolve();
        }
      });
    });

    Promise.all(endPromises).then(() => {
      console.log('✅ 所有目标流已结束');
      callback();
    }).catch(callback);
  }

  getTargetStats() {
    const stats = {};
    
    this.targetStats.forEach((stat, index) => {
      stats[`target_${index}`] = {
        ...stat,
        successRate: stat.writes / (stat.writes + stat.errors) * 100
      };
    });
    
    return stats;
  }

  // 手动标记目标为不健康
  markTargetUnhealthy(targetIndex) {
    const stats = this.targetStats.get(targetIndex);
    if (stats) {
      stats.isHealthy = false;
      console.log(`🔴 目标 ${targetIndex} 已标记为不健康`);
    }
  }

  // 手动恢复目标健康状态
  markTargetHealthy(targetIndex) {
    const stats = this.targetStats.get(targetIndex);
    if (stats) {
      stats.isHealthy = true;
      stats.errors = 0;
      stats.lastError = null;
      console.log(`🟢 目标 ${targetIndex} 已恢复健康`);
    }
  }
}

// 缓冲写入流
class BufferedWriterStream extends Writable {
  constructor(writer, options = {}) {
    super(options);
    
    this.writer = writer; // 实际写入函数
    this.bufferSize = options.bufferSize || 64 * 1024; // 64KB
    this.flushInterval = options.flushInterval || 5000; // 5秒
    this.autoFlush = options.autoFlush !== false;
    
    this.buffer = Buffer.alloc(0);
    this.flushTimer = null;
    this.bytesBuffered = 0;
    this.totalBytesWritten = 0;
    this.flushCount = 0;
  }

  _write(chunk, encoding, callback) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
    
    // 添加到缓冲区
    this.buffer = Buffer.concat([this.buffer, buffer]);
    this.bytesBuffered += buffer.length;

    // 检查是否需要刷新
    if (this.buffer.length >= this.bufferSize) {
      this.flush().then(() => callback()).catch(callback);
    } else {
      if (this.autoFlush && !this.flushTimer) {
        this.flushTimer = setTimeout(() => {
          this.flush().catch(error => {
            console.error('自动刷新失败:', error);
            this.emit('error', error);
          });
        }, this.flushInterval);
      }
      callback();
    }
  }

  async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.buffer.length === 0) {
      return;
    }

    const dataToWrite = this.buffer;
    this.buffer = Buffer.alloc(0);
    this.bytesBuffered = 0;

    try {
      await this.writer(dataToWrite);
      this.totalBytesWritten += dataToWrite.length;
      this.flushCount++;
      
      console.log(`💾 缓冲区刷新: ${dataToWrite.length} 字节`);
      
      this.emit('flush', {
        bytesWritten: dataToWrite.length,
        totalBytes: this.totalBytesWritten,
        flushCount: this.flushCount
      });
    } catch (error) {
      // 写入失败，恢复缓冲区
      this.buffer = Buffer.concat([dataToWrite, this.buffer]);
      this.bytesBuffered += dataToWrite.length;
      throw error;
    }
  }

  _final(callback) {
    this.flush().then(() => {
      console.log(`✅ 缓冲写入完成: ${this.totalBytesWritten} 字节, ${this.flushCount} 次刷新`);
      callback();
    }).catch(callback);
  }

  // 强制刷新缓冲区
  forceFlush() {
    return this.flush();
  }

  // 获取缓冲区状态
  getBufferStatus() {
    return {
      bufferedBytes: this.buffer.length,
      bufferUtilization: (this.buffer.length / this.bufferSize * 100).toFixed(2) + '%',
      totalBytesWritten: this.totalBytesWritten,
      flushCount: this.flushCount
    };
  }
}

module.exports = {
  BatchWriterStream,
  MultiTargetWriterStream,
  BufferedWriterStream
};
```

## ⚡ 背压处理和性能优化

### 背压管理器

```javascript
// backpressure-manager.js
const { Writable } = require('stream');
const EventEmitter = require('events');

class BackpressureManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      highWaterMark: options.highWaterMark || 16384,
      maxBackpressureTime: options.maxBackpressureTime || 10000,
      backpressureThreshold: options.backpressureThreshold || 0.8,
      ...options
    };
    
    this.streams = new Map();
    this.backpressureStates = new Map();
    this.stats = {
      totalBackpressureEvents: 0,
      totalBackpressureTime: 0,
      activeBackpressureStreams: 0
    };
  }

  registerStream(streamId, stream) {
    this.streams.set(streamId, stream);
    this.backpressureStates.set(streamId, {
      isBackpressured: false,
      backpressureStartTime: null,
      backpressureCount: 0,
      totalBackpressureTime: 0
    });

    // 监听drain事件
    stream.on('drain', () => {
      this.handleDrainEvent(streamId);
    });

    // 监听写入事件
    const originalWrite = stream.write.bind(stream);
    stream.write = (chunk, encoding, callback) => {
      const result = originalWrite(chunk, encoding, callback);
      
      if (!result) {
        this.handleBackpressure(streamId);
      }
      
      return result;
    };

    console.log(`📊 流已注册到背压管理器: ${streamId}`);
  }

  handleBackpressure(streamId) {
    const state = this.backpressureStates.get(streamId);
    
    if (!state.isBackpressured) {
      state.isBackpressured = true;
      state.backpressureStartTime = Date.now();
      state.backpressureCount++;
      
      this.stats.totalBackpressureEvents++;
      this.stats.activeBackpressureStreams++;
      
      console.log(`⚠️ 流 ${streamId} 进入背压状态`);
      this.emit('backpressureStart', { streamId, count: state.backpressureCount });
      
      // 设置背压超时警告
      setTimeout(() => {
        if (state.isBackpressured) {
          console.warn(`🚨 流 ${streamId} 背压时间过长: ${Date.now() - state.backpressureStartTime}ms`);
          this.emit('backpressureTimeout', { streamId, duration: Date.now() - state.backpressureStartTime });
        }
      }, this.options.maxBackpressureTime);
    }
  }

  handleDrainEvent(streamId) {
    const state = this.backpressureStates.get(streamId);
    
    if (state.isBackpressured) {
      const backpressureDuration = Date.now() - state.backpressureStartTime;
      
      state.isBackpressured = false;
      state.backpressureStartTime = null;
      state.totalBackpressureTime += backpressureDuration;
      
      this.stats.totalBackpressureTime += backpressureDuration;
      this.stats.activeBackpressureStreams--;
      
      console.log(`✅ 流 ${streamId} 背压解除，持续时间: ${backpressureDuration}ms`);
      this.emit('backpressureEnd', { streamId, duration: backpressureDuration });
    }
  }

  getStreamStats(streamId) {
    const state = this.backpressureStates.get(streamId);
    
    if (!state) {
      return null;
    }
    
    return {
      streamId,
      isBackpressured: state.isBackpressured,
      backpressureCount: state.backpressureCount,
      totalBackpressureTime: state.totalBackpressureTime,
      avgBackpressureTime: state.backpressureCount > 0 
        ? state.totalBackpressureTime / state.backpressureCount 
        : 0
    };
  }

  getAllStats() {
    const streamStats = {};
    
    for (const streamId of this.streams.keys()) {
      streamStats[streamId] = this.getStreamStats(streamId);
    }
    
    return {
      global: this.stats,
      streams: streamStats
    };
  }

  // 自适应写入速率控制
  createAdaptiveWriter(streamId, baseRate = 1000) {
    const stream = this.streams.get(streamId);
    const state = this.backpressureStates.get(streamId);
    
    if (!stream || !state) {
      throw new Error(`流 ${streamId} 未注册`);
    }

    let currentRate = baseRate;
    let lastWriteTime = 0;

    return {
      write: (chunk, encoding) => {
        return new Promise((resolve, reject) => {
          const now = Date.now();
          const timeSinceLastWrite = now - lastWriteTime;
          const targetInterval = 1000 / currentRate;
          
          const delay = Math.max(0, targetInterval - timeSinceLastWrite);
          
          setTimeout(() => {
            const result = stream.write(chunk, encoding, (error) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            });
            
            lastWriteTime = Date.now();
            
            // 根据背压状态调整写入速率
            if (state.isBackpressured) {
              currentRate = Math.max(baseRate * 0.1, currentRate * 0.8);
            } else {
              currentRate = Math.min(baseRate, currentRate * 1.1);
            }
            
            if (!result) {
              // 等待drain事件
              stream.once('drain', () => resolve(true));
            }
          }, delay);
        });
      },
      
      getCurrentRate: () => currentRate,
      getBaseRate: () => baseRate
    };
  }
}

// 性能优化的可写流
class PerformantWritableStream extends Writable {
  constructor(options = {}) {
    super(options);
    
    this.options = {
      enableCompression: options.enableCompression,
      compressionThreshold: options.compressionThreshold || 1024,
      enableBatching: options.enableBatching,
      batchSize: options.batchSize || 10,
      batchTimeout: options.batchTimeout || 100,
      enableCaching: options.enableCaching,
      cacheSize: options.cacheSize || 100,
      ...options
    };
    
    this.batch = [];
    this.batchTimer = null;
    this.cache = new Map();
    this.stats = {
      writes: 0,
      batches: 0,
      compressions: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalBytes: 0,
      compressedBytes: 0
    };
  }

  _write(chunk, encoding, callback) {
    this.stats.writes++;
    
    if (this.options.enableBatching) {
      this.addToBatch(chunk, encoding, callback);
    } else {
      this.processChunk(chunk, encoding, callback);
    }
  }

  addToBatch(chunk, encoding, callback) {
    this.batch.push({ chunk, encoding, callback });
    
    if (this.batch.length >= this.options.batchSize) {
      this.processBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.options.batchTimeout);
    }
  }

  processBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.batch.length === 0) {
      return;
    }
    
    const currentBatch = this.batch.splice(0);
    this.stats.batches++;
    
    console.log(`📦 处理批次: ${currentBatch.length} 项`);
    
    // 合并数据块
    const chunks = currentBatch.map(item => 
      Buffer.isBuffer(item.chunk) ? item.chunk : Buffer.from(item.chunk, item.encoding)
    );
    
    const combinedChunk = Buffer.concat(chunks);
    
    this.processChunk(combinedChunk, 'buffer', (error) => {
      // 调用所有回调
      currentBatch.forEach(item => item.callback(error));
    });
  }

  async processChunk(chunk, encoding, callback) {
    try {
      let processedChunk = chunk;
      
      // 缓存检查
      if (this.options.enableCaching) {
        const cacheKey = this.generateCacheKey(chunk);
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
          this.stats.cacheHits++;
          processedChunk = cached;
        } else {
          this.stats.cacheMisses++;
        }
      }
      
      // 压缩处理
      if (this.options.enableCompression && chunk.length > this.options.compressionThreshold) {
        processedChunk = await this.compressChunk(chunk);
        
        if (this.options.enableCaching) {
          this.updateCache(this.generateCacheKey(chunk), processedChunk);
        }
      }
      
      // 执行实际写入
      await this.performWrite(processedChunk, encoding);
      
      this.stats.totalBytes += chunk.length;
      if (processedChunk !== chunk) {
        this.stats.compressedBytes += processedChunk.length;
      }
      
      callback();
    } catch (error) {
      callback(error);
    }
  }

  async compressChunk(chunk) {
    const zlib = require('zlib');
    
    try {
      const compressed = await new Promise((resolve, reject) => {
        zlib.gzip(chunk, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
      
      this.stats.compressions++;
      console.log(`🗜️ 数据压缩: ${chunk.length} -> ${compressed.length} 字节 (${((1 - compressed.length / chunk.length) * 100).toFixed(1)}% 压缩率)`);
      
      return compressed;
    } catch (error) {
      console.warn('压缩失败，使用原始数据:', error.message);
      return chunk;
    }
  }

  generateCacheKey(chunk) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(chunk).digest('hex');
  }

  updateCache(key, value) {
    if (this.cache.size >= this.options.cacheSize) {
      // LRU清理
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }

  async performWrite(chunk, encoding) {
    // 子类实现具体的写入逻辑
    console.log(`✍️ 写入数据: ${chunk.length} 字节`);
    
    // 模拟异步写入
    await new Promise(resolve => setTimeout(resolve, 1));
  }

  _final(callback) {
    // 处理剩余批次
    if (this.batch.length > 0) {
      this.processBatch();
    }
    
    // 等待所有写入完成
    setTimeout(() => {
      console.log('📊 写入统计:', this.getStats());
      callback();
    }, 100);
  }

  getStats() {
    return {
      ...this.stats,
      compressionRatio: this.stats.compressedBytes > 0 
        ? ((this.stats.totalBytes - this.stats.compressedBytes) / this.stats.totalBytes * 100).toFixed(1) + '%'
        : '0%',
      cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(1) + '%'
        : '0%',
      avgBatchSize: this.stats.batches > 0 ? (this.stats.writes / this.stats.batches).toFixed(1) : '0'
    };
  }
}

// 使用示例
async function demonstrateBackpressureHandling() {
  console.log('⚡ 背压处理演示...\n');

  const backpressureManager = new BackpressureManager();
  
  // 创建一个慢速写入流来模拟背压
  const slowWriter = new Writable({
    highWaterMark: 1024,
    write(chunk, encoding, callback) {
      // 模拟慢速写入
      setTimeout(() => {
        console.log(`慢速写入: ${chunk.length} 字节`);
        callback();
      }, 100);
    }
  });

  backpressureManager.registerStream('slow-writer', slowWriter);

  backpressureManager.on('backpressureStart', ({ streamId, count }) => {
    console.log(`🚨 背压开始: 流=${streamId}, 第${count}次`);
  });

  backpressureManager.on('backpressureEnd', ({ streamId, duration }) => {
    console.log(`✅ 背压结束: 流=${streamId}, 持续=${duration}ms`);
  });

  // 创建自适应写入器
  const adaptiveWriter = backpressureManager.createAdaptiveWriter('slow-writer', 50);

  // 快速写入大量数据
  for (let i = 0; i < 20; i++) {
    const data = `数据块 ${i}: ${'x'.repeat(200)}\n`;
    await adaptiveWriter.write(data);
    console.log(`当前写入速率: ${adaptiveWriter.getCurrentRate().toFixed(1)} writes/sec`);
  }

  slowWriter.end();
  
  // 等待完成
  await new Promise(resolve => slowWriter.on('finish', resolve));

  console.log('\n📊 最终统计:');
  console.log(JSON.stringify(backpressureManager.getAllStats(), null, 2));
}

module.exports = {
  BackpressureManager,
  PerformantWritableStream,
  demonstrateBackpressureHandling
};
```

可写流是Node.js数据处理的重要组件，掌握其高级用法和优化技巧对构建高效的数据写入系统至关重要！
