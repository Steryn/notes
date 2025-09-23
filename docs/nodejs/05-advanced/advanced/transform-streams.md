# 转换流

## 🎯 学习目标

- 深入理解转换流的工作原理和应用场景
- 掌握自定义转换流的实现方法
- 学会数据转换、过滤和聚合技术
- 了解流水线处理和性能优化

## 📚 核心概念

### 转换流基础

```javascript
// 转换流核心概念
const transformStreamConcepts = {
  definition: {
    description: '转换流是同时可读和可写的流',
    inheritance: '继承自Duplex流',
    purpose: '对通过流的数据进行转换处理'
  },
  methods: {
    _transform: '处理每个数据块的核心方法',
    _flush: '流结束前的最终处理方法',
    push: '向可读端推送转换后的数据',
    callback: '处理完成后的回调函数'
  },
  patterns: {
    oneToOne: '一对一转换 - 每个输入产生一个输出',
    oneToMany: '一对多转换 - 一个输入产生多个输出',
    manyToOne: '多对一转换 - 多个输入合并为一个输出',
    filter: '过滤模式 - 选择性输出数据',
    aggregate: '聚合模式 - 累积处理数据'
  }
};

console.log('转换流概念:', transformStreamConcepts);
```

## 🛠️ 基础转换流实现

### 数据转换流

```javascript
// basic-transform-streams.js
const { Transform } = require('stream');

// JSON解析转换流
class JSONParseStream extends Transform {
  constructor(options = {}) {
    super({ 
      objectMode: true,
      ...options 
    });
    
    this.strict = options.strict !== false;
    this.skipErrors = options.skipErrors === true;
    this.errorCount = 0;
    this.successCount = 0;
  }

  _transform(chunk, encoding, callback) {
    try {
      const jsonString = chunk.toString().trim();
      
      if (!jsonString) {
        return callback();
      }
      
      const parsed = JSON.parse(jsonString);
      this.successCount++;
      
      this.push(parsed);
      callback();
      
    } catch (error) {
      this.errorCount++;
      
      if (this.skipErrors) {
        console.warn(`⚠️ JSON解析错误 (已跳过): ${error.message}`);
        this.emit('parseError', { chunk, error });
        callback();
      } else if (this.strict) {
        callback(error);
      } else {
        // 非严格模式，推送原始数据
        this.push({ 
          _parseError: error.message, 
          _rawData: chunk.toString() 
        });
        callback();
      }
    }
  }

  _flush(callback) {
    console.log(`📊 JSON解析完成: 成功=${this.successCount}, 错误=${this.errorCount}`);
    callback();
  }
}

// 数据验证转换流
class ValidationStream extends Transform {
  constructor(schema, options = {}) {
    super({ 
      objectMode: true,
      ...options 
    });
    
    this.schema = schema;
    this.validCount = 0;
    this.invalidCount = 0;
    this.onInvalid = options.onInvalid || 'error'; // 'error', 'skip', 'mark'
  }

  _transform(chunk, encoding, callback) {
    try {
      const validation = this.validateData(chunk);
      
      if (validation.valid) {
        this.validCount++;
        this.push(chunk);
        callback();
      } else {
        this.invalidCount++;
        this.handleInvalidData(chunk, validation, callback);
      }
    } catch (error) {
      callback(error);
    }
  }

  validateData(data) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field];
      
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`字段 ${field} 是必需的`);
        continue;
      }
      
      if (value !== undefined && rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`字段 ${field} 类型错误: 期望 ${rules.type}, 实际 ${actualType}`);
        }
      }
      
      if (value !== undefined && rules.validate) {
        try {
          if (!rules.validate(value)) {
            errors.push(`字段 ${field} 验证失败`);
          }
        } catch (error) {
          errors.push(`字段 ${field} 验证函数错误: ${error.message}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  handleInvalidData(data, validation, callback) {
    switch (this.onInvalid) {
      case 'error':
        callback(new Error(`数据验证失败: ${validation.errors.join(', ')}`));
        break;
        
      case 'skip':
        console.warn(`⚠️ 跳过无效数据: ${validation.errors.join(', ')}`);
        this.emit('invalidData', { data, errors: validation.errors });
        callback();
        break;
        
      case 'mark':
        const markedData = {
          ...data,
          _validation: {
            valid: false,
            errors: validation.errors
          }
        };
        this.push(markedData);
        callback();
        break;
        
      default:
        callback(new Error(`未知的无效数据处理方式: ${this.onInvalid}`));
    }
  }

  _flush(callback) {
    const total = this.validCount + this.invalidCount;
    const successRate = total > 0 ? (this.validCount / total * 100).toFixed(2) : '0';
    
    console.log(`📊 数据验证完成: 有效=${this.validCount}, 无效=${this.invalidCount}, 成功率=${successRate}%`);
    callback();
  }
}

// 数据格式化转换流
class FormatStream extends Transform {
  constructor(formatter, options = {}) {
    super({ 
      objectMode: true,
      ...options 
    });
    
    this.formatter = formatter;
    this.formatCount = 0;
  }

  _transform(chunk, encoding, callback) {
    try {
      const formatted = this.formatter(chunk);
      this.formatCount++;
      
      if (formatted !== undefined && formatted !== null) {
        this.push(formatted);
      }
      
      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback) {
    console.log(`📊 数据格式化完成: ${this.formatCount} 项`);
    callback();
  }
}

// CSV转换流
class CSVTransformStream extends Transform {
  constructor(options = {}) {
    super({
      objectMode: true,
      ...options
    });
    
    this.headers = options.headers || null;
    this.delimiter = options.delimiter || ',';
    this.quote = options.quote || '"';
    this.escape = options.escape || '"';
    this.skipHeader = options.skipHeader === true;
    this.autoDetectHeaders = options.autoDetectHeaders !== false;
    
    this.isFirstRow = true;
    this.rowCount = 0;
  }

  _transform(chunk, encoding, callback) {
    try {
      const line = chunk.toString().trim();
      
      if (!line) {
        return callback();
      }
      
      const fields = this.parseCSVLine(line);
      
      if (this.isFirstRow) {
        this.isFirstRow = false;
        
        if (this.autoDetectHeaders && !this.headers) {
          this.headers = fields;
          
          if (this.skipHeader) {
            return callback();
          }
        }
      }
      
      let result;
      
      if (this.headers) {
        result = {};
        fields.forEach((field, index) => {
          if (this.headers[index]) {
            result[this.headers[index]] = field;
          }
        });
      } else {
        result = fields;
      }
      
      this.rowCount++;
      this.push(result);
      callback();
      
    } catch (error) {
      callback(error);
    }
  }

  parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === this.quote) {
        if (inQuotes && nextChar === this.quote) {
          // 转义引号
          currentField += this.quote;
          i += 2;
        } else {
          // 开始或结束引号
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === this.delimiter && !inQuotes) {
        // 字段分隔符
        fields.push(currentField);
        currentField = '';
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
    
    fields.push(currentField);
    return fields;
  }

  _flush(callback) {
    console.log(`📊 CSV转换完成: ${this.rowCount} 行`);
    callback();
  }
}

// 使用示例
async function demonstrateBasicTransforms() {
  console.log('🔄 基础转换流演示...\n');

  // 1. JSON解析流
  console.log('1. JSON解析转换:');
  const { Readable } = require('stream');
  
  const jsonData = [
    '{"name": "Alice", "age": 30}',
    '{"name": "Bob", "age": 25}',
    'invalid json',
    '{"name": "Charlie", "age": 35}'
  ];

  const jsonSource = Readable.from(jsonData);
  const jsonParser = new JSONParseStream({ skipErrors: true });

  jsonSource.pipe(jsonParser);

  jsonParser.on('data', (data) => {
    console.log('  解析结果:', data);
  });

  await new Promise(resolve => jsonParser.on('end', resolve));

  // 2. 数据验证流
  console.log('\n2. 数据验证转换:');
  const schema = {
    name: { required: true, type: 'string' },
    age: { required: true, type: 'number', validate: (age) => age > 0 && age < 150 },
    email: { type: 'string', validate: (email) => email.includes('@') }
  };

  const validationData = [
    { name: 'Alice', age: 30, email: 'alice@example.com' },
    { name: 'Bob', age: -5 }, // 无效年龄
    { age: 25 }, // 缺少name
    { name: 'Charlie', age: 35, email: 'invalid-email' }
  ];

  const validationSource = Readable.from(validationData);
  const validator = new ValidationStream(schema, { onInvalid: 'mark' });

  validationSource.pipe(validator);

  validator.on('data', (data) => {
    console.log('  验证结果:', data);
  });

  await new Promise(resolve => validator.on('end', resolve));

  // 3. 数据格式化流
  console.log('\n3. 数据格式化转换:');
  const formatter = (data) => {
    if (data.name && data.age) {
      return `${data.name} (${data.age}岁)`;
    }
    return null;
  };

  const formatData = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { invalid: 'data' }
  ];

  const formatSource = Readable.from(formatData);
  const formatStream = new FormatStream(formatter);

  formatSource.pipe(formatStream);

  formatStream.on('data', (data) => {
    console.log('  格式化结果:', data);
  });

  await new Promise(resolve => formatStream.on('end', resolve));
}

module.exports = {
  JSONParseStream,
  ValidationStream,
  FormatStream,
  CSVTransformStream,
  demonstrateBasicTransforms
};
```

### 高级转换流实现

```javascript
// advanced-transform-streams.js
const { Transform } = require('stream');

// 聚合转换流
class AggregateStream extends Transform {
  constructor(options = {}) {
    super({ 
      objectMode: true,
      ...options 
    });
    
    this.windowSize = options.windowSize || 100;
    this.groupBy = options.groupBy || null;
    this.aggregators = options.aggregators || {};
    this.emitInterval = options.emitInterval || null;
    
    this.buffer = [];
    this.groups = new Map();
    this.processedCount = 0;
    
    if (this.emitInterval) {
      this.intervalTimer = setInterval(() => {
        this.emitAggregates();
      }, this.emitInterval);
    }
  }

  _transform(chunk, encoding, callback) {
    this.processedCount++;
    
    if (this.groupBy) {
      this.processGroupedData(chunk);
    } else {
      this.buffer.push(chunk);
      
      if (this.buffer.length >= this.windowSize) {
        this.processBuffer();
      }
    }
    
    callback();
  }

  processGroupedData(chunk) {
    const groupKey = typeof this.groupBy === 'function' 
      ? this.groupBy(chunk) 
      : chunk[this.groupBy];
    
    if (!this.groups.has(groupKey)) {
      this.groups.set(groupKey, []);
    }
    
    this.groups.get(groupKey).push(chunk);
    
    // 检查组大小
    if (this.groups.get(groupKey).length >= this.windowSize) {
      this.processGroup(groupKey);
    }
  }

  processGroup(groupKey) {
    const groupData = this.groups.get(groupKey);
    const aggregate = this.calculateAggregates(groupData);
    
    this.push({
      group: groupKey,
      count: groupData.length,
      ...aggregate,
      timestamp: Date.now()
    });
    
    this.groups.set(groupKey, []); // 清空组
  }

  processBuffer() {
    const aggregate = this.calculateAggregates(this.buffer);
    
    this.push({
      count: this.buffer.length,
      ...aggregate,
      timestamp: Date.now()
    });
    
    this.buffer = [];
  }

  calculateAggregates(data) {
    const result = {};
    
    for (const [name, aggregator] of Object.entries(this.aggregators)) {
      try {
        result[name] = aggregator(data);
      } catch (error) {
        console.error(`聚合器 ${name} 执行失败:`, error);
        result[name] = null;
      }
    }
    
    return result;
  }

  emitAggregates() {
    // 发射所有待处理的聚合
    if (this.buffer.length > 0) {
      this.processBuffer();
    }
    
    for (const groupKey of this.groups.keys()) {
      if (this.groups.get(groupKey).length > 0) {
        this.processGroup(groupKey);
      }
    }
  }

  _flush(callback) {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
    
    // 处理剩余数据
    this.emitAggregates();
    
    console.log(`📊 聚合转换完成: 处理 ${this.processedCount} 项`);
    callback();
  }
}

// 批量处理转换流
class BatchTransformStream extends Transform {
  constructor(processor, options = {}) {
    super({ 
      objectMode: true,
      ...options 
    });
    
    this.processor = processor;
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 1000;
    this.parallel = options.parallel || false;
    this.maxConcurrency = options.maxConcurrency || 5;
    
    this.batch = [];
    this.batchTimer = null;
    this.activeBatches = 0;
    this.processedBatches = 0;
  }

  _transform(chunk, encoding, callback) {
    this.batch.push(chunk);
    
    if (this.batch.length >= this.batchSize) {
      this.processBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
    }
    
    callback();
  }

  async processBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.batch.length === 0) {
      return;
    }
    
    const currentBatch = this.batch.splice(0);
    
    if (this.parallel) {
      this.processParallelBatch(currentBatch);
    } else {
      await this.processSequentialBatch(currentBatch);
    }
  }

  async processParallelBatch(batch) {
    if (this.activeBatches >= this.maxConcurrency) {
      // 等待有空闲槽位
      await new Promise(resolve => {
        const checkSlot = () => {
          if (this.activeBatches < this.maxConcurrency) {
            resolve();
          } else {
            setTimeout(checkSlot, 10);
          }
        };
        checkSlot();
      });
    }
    
    this.activeBatches++;
    
    try {
      const results = await this.processor(batch);
      this.emitResults(results);
    } catch (error) {
      console.error('并行批处理失败:', error);
      this.emit('error', error);
    } finally {
      this.activeBatches--;
      this.processedBatches++;
    }
  }

  async processSequentialBatch(batch) {
    try {
      const results = await this.processor(batch);
      this.emitResults(results);
      this.processedBatches++;
    } catch (error) {
      console.error('顺序批处理失败:', error);
      this.emit('error', error);
    }
  }

  emitResults(results) {
    if (Array.isArray(results)) {
      results.forEach(result => this.push(result));
    } else if (results !== undefined) {
      this.push(results);
    }
  }

  async _flush(callback) {
    // 处理剩余批次
    await this.processBatch();
    
    // 等待所有并行批次完成
    while (this.activeBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    console.log(`📊 批量处理完成: ${this.processedBatches} 个批次`);
    callback();
  }
}

// 流水线转换流
class PipelineTransformStream extends Transform {
  constructor(transformers, options = {}) {
    super({ 
      objectMode: true,
      ...options 
    });
    
    this.transformers = transformers;
    this.processedCount = 0;
    this.errorCount = 0;
    this.continueOnError = options.continueOnError === true;
  }

  _transform(chunk, encoding, callback) {
    this.processChunk(chunk, 0, callback);
  }

  async processChunk(data, transformerIndex, callback) {
    if (transformerIndex >= this.transformers.length) {
      // 所有转换器处理完成
      this.processedCount++;
      this.push(data);
      return callback();
    }
    
    try {
      const transformer = this.transformers[transformerIndex];
      const result = await this.applyTransformer(transformer, data);
      
      if (result !== undefined && result !== null) {
        this.processChunk(result, transformerIndex + 1, callback);
      } else {
        // 数据被过滤掉
        callback();
      }
    } catch (error) {
      this.errorCount++;
      
      if (this.continueOnError) {
        console.warn(`⚠️ 转换器 ${transformerIndex} 处理失败:`, error.message);
        this.emit('transformError', { data, transformerIndex, error });
        callback();
      } else {
        callback(error);
      }
    }
  }

  async applyTransformer(transformer, data) {
    if (typeof transformer === 'function') {
      return transformer(data);
    } else if (transformer && typeof transformer.transform === 'function') {
      return transformer.transform(data);
    } else {
      throw new Error('无效的转换器');
    }
  }

  _flush(callback) {
    const successRate = this.processedCount + this.errorCount > 0 
      ? (this.processedCount / (this.processedCount + this.errorCount) * 100).toFixed(2)
      : '0';
    
    console.log(`📊 流水线处理完成: 成功=${this.processedCount}, 错误=${this.errorCount}, 成功率=${successRate}%`);
    callback();
  }
}

// 缓存转换流
class CachedTransformStream extends Transform {
  constructor(transformer, options = {}) {
    super({ 
      objectMode: true,
      ...options 
    });
    
    this.transformer = transformer;
    this.cache = new Map();
    this.maxCacheSize = options.maxCacheSize || 1000;
    this.ttl = options.ttl || 300000; // 5分钟
    this.keyGenerator = options.keyGenerator || JSON.stringify;
    
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    // 定期清理过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // 每分钟清理一次
  }

  _transform(chunk, encoding, callback) {
    const cacheKey = this.keyGenerator(chunk);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      // 缓存命中
      this.cacheHits++;
      this.push(cached.result);
      callback();
    } else {
      // 缓存未命中，执行转换
      this.cacheMisses++;
      this.executeTransform(chunk, cacheKey, callback);
    }
  }

  async executeTransform(chunk, cacheKey, callback) {
    try {
      const result = await this.transformer(chunk);
      
      // 存储到缓存
      this.storeInCache(cacheKey, result);
      
      if (result !== undefined && result !== null) {
        this.push(result);
      }
      
      callback();
    } catch (error) {
      callback(error);
    }
  }

  storeInCache(key, result) {
    // LRU清理
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      result: result,
      timestamp: Date.now()
    });
  }

  cleanupExpiredCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 清理过期缓存: ${expiredKeys.length} 项`);
    }
  }

  _destroy(error, callback) {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    callback(error);
  }

  _flush(callback) {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests * 100).toFixed(2) : '0';
    
    console.log(`📊 缓存转换完成: 命中=${this.cacheHits}, 未命中=${this.cacheMisses}, 命中率=${hitRate}%`);
    callback();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: this.cacheHits + this.cacheMisses > 0 
        ? (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

module.exports = {
  AggregateStream,
  BatchTransformStream,
  PipelineTransformStream,
  CachedTransformStream
};
```

## 🔧 实用转换流工具

### 通用转换工具集

```javascript
// transform-utilities.js
const { Transform, pipeline } = require('stream');

// 转换流工厂
class TransformFactory {
  // 创建映射转换流
  static map(mapper) {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          const result = mapper(chunk);
          if (result !== undefined) {
            this.push(result);
          }
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  // 创建过滤转换流
  static filter(predicate) {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          if (predicate(chunk)) {
            this.push(chunk);
          }
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  // 创建归约转换流
  static reduce(reducer, initialValue) {
    let accumulator = initialValue;
    
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          accumulator = reducer(accumulator, chunk);
          callback();
        } catch (error) {
          callback(error);
        }
      },
      flush(callback) {
        this.push(accumulator);
        callback();
      }
    });
  }

  // 创建去重转换流
  static unique(keySelector) {
    const seen = new Set();
    
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          const key = keySelector ? keySelector(chunk) : chunk;
          
          if (!seen.has(key)) {
            seen.add(key);
            this.push(chunk);
          }
          
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  // 创建排序转换流
  static sort(compareFn) {
    const items = [];
    
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        items.push(chunk);
        callback();
      },
      flush(callback) {
        try {
          const sorted = items.sort(compareFn);
          sorted.forEach(item => this.push(item));
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  // 创建限制转换流
  static take(count) {
    let taken = 0;
    
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        if (taken < count) {
          this.push(chunk);
          taken++;
        }
        
        if (taken >= count) {
          this.push(null); // 结束流
        }
        
        callback();
      }
    });
  }

  // 创建跳过转换流
  static skip(count) {
    let skipped = 0;
    
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        if (skipped < count) {
          skipped++;
        } else {
          this.push(chunk);
        }
        callback();
      }
    });
  }
}

// 流水线构建器
class StreamPipelineBuilder {
  constructor() {
    this.transforms = [];
  }

  map(mapper) {
    this.transforms.push(TransformFactory.map(mapper));
    return this;
  }

  filter(predicate) {
    this.transforms.push(TransformFactory.filter(predicate));
    return this;
  }

  unique(keySelector) {
    this.transforms.push(TransformFactory.unique(keySelector));
    return this;
  }

  sort(compareFn) {
    this.transforms.push(TransformFactory.sort(compareFn));
    return this;
  }

  take(count) {
    this.transforms.push(TransformFactory.take(count));
    return this;
  }

  skip(count) {
    this.transforms.push(TransformFactory.skip(count));
    return this;
  }

  custom(transform) {
    this.transforms.push(transform);
    return this;
  }

  build() {
    return this.transforms;
  }

  // 执行流水线
  async execute(source, destination) {
    return new Promise((resolve, reject) => {
      const streams = [source, ...this.transforms];
      
      if (destination) {
        streams.push(destination);
      }

      pipeline(...streams, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

// 使用示例
async function demonstrateTransformUtilities() {
  console.log('🔧 转换流工具演示...\n');

  const { Readable } = require('stream');

  // 示例数据
  const data = [
    { id: 1, name: 'Alice', age: 30, city: 'New York' },
    { id: 2, name: 'Bob', age: 25, city: 'London' },
    { id: 3, name: 'Alice', age: 35, city: 'Paris' },
    { id: 4, name: 'Charlie', age: 40, city: 'Tokyo' },
    { id: 5, name: 'David', age: 28, city: 'New York' },
    { id: 6, name: 'Eve', age: 32, city: 'London' }
  ];

  const source = Readable.from(data);

  // 构建流水线
  const pipeline = new StreamPipelineBuilder()
    .filter(person => person.age > 25)  // 过滤年龄大于25的
    .map(person => ({                   // 转换数据格式
      ...person,
      ageGroup: person.age < 30 ? 'young' : 'adult',
      displayName: `${person.name} (${person.age})`
    }))
    .unique(person => person.name)      // 按姓名去重
    .sort((a, b) => b.age - a.age)      // 按年龄降序排序
    .take(3);                           // 只取前3个

  // 收集结果
  const results = [];
  const collector = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      results.push(chunk);
      callback();
    }
  });

  pipeline.custom(collector);

  // 执行流水线
  await pipeline.execute(source);

  console.log('流水线处理结果:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${JSON.stringify(result)}`);
  });
}

module.exports = {
  TransformFactory,
  StreamPipelineBuilder,
  demonstrateTransformUtilities
};
```

转换流是Node.js流处理中最灵活和强大的组件，通过合理的设计和组合可以构建出高效的数据处理流水线！
