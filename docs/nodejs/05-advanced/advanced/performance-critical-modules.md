# 性能关键模块

## 🎯 学习目标

- 理解性能关键模块的设计原则
- 掌握高性能模块的开发技巧
- 学会性能瓶颈的识别和优化
- 了解原生模块与JavaScript模块的选择策略

## 📚 核心概念

### 性能关键模块定义

```javascript
// 性能关键模块的特征
const performanceCriticalCharacteristics = {
  computational: {
    description: 'CPU密集型计算',
    examples: [
      '加密解密算法',
      '图像/音频处理',
      '数学运算库',
      '数据压缩'
    ],
    optimization: '使用原生代码或WebAssembly'
  },
  memory: {
    description: '内存敏感操作',
    examples: [
      '大数据处理',
      '缓存管理',
      'Buffer操作',
      '内存池管理'
    ],
    optimization: '优化内存分配和回收'
  },
  io: {
    description: 'I/O密集型操作',
    examples: [
      '文件系统操作',
      '网络通信',
      '数据库连接',
      '流处理'
    ],
    optimization: '异步处理和连接池'
  },
  realtime: {
    description: '实时性要求',
    examples: [
      '游戏引擎',
      '实时通信',
      '监控系统',
      '高频交易'
    ],
    optimization: '减少延迟和抖动'
  }
};

console.log('性能关键模块特征:', performanceCriticalCharacteristics);
```

## 🚀 高性能计算模块

### 数学运算优化库

```javascript
// high-performance-math.js
const { Worker } = require('worker_threads');
const path = require('path');

class HighPerformanceMath {
  constructor(options = {}) {
    this.useWorkers = options.useWorkers !== false;
    this.workerCount = options.workerCount || require('os').cpus().length;
    this.workers = [];
    this.taskQueue = [];
    this.nextTaskId = 1;
    
    if (this.useWorkers) {
      this.initializeWorkers();
    }
  }

  // 初始化Worker线程池
  initializeWorkers() {
    console.log(`🚀 初始化 ${this.workerCount} 个计算Worker...`);
    
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(`
        const { parentPort } = require('worker_threads');
        
        // 高性能矩阵乘法
        function matrixMultiply(a, b) {
          const rows = a.length;
          const cols = b[0].length;
          const inner = b.length;
          const result = new Array(rows);
          
          for (let i = 0; i < rows; i++) {
            result[i] = new Array(cols);
            for (let j = 0; j < cols; j++) {
              let sum = 0;
              for (let k = 0; k < inner; k++) {
                sum += a[i][k] * b[k][j];
              }
              result[i][j] = sum;
            }
          }
          
          return result;
        }
        
        // 快速傅里叶变换 (简化版)
        function fft(signal) {
          const N = signal.length;
          if (N <= 1) return signal;
          
          const even = [];
          const odd = [];
          
          for (let i = 0; i < N; i++) {
            if (i % 2 === 0) {
              even.push(signal[i]);
            } else {
              odd.push(signal[i]);
            }
          }
          
          const evenFFT = fft(even);
          const oddFFT = fft(odd);
          const result = new Array(N);
          
          for (let k = 0; k < N / 2; k++) {
            const t = { 
              real: Math.cos(-2 * Math.PI * k / N) * oddFFT[k].real - Math.sin(-2 * Math.PI * k / N) * oddFFT[k].imag,
              imag: Math.sin(-2 * Math.PI * k / N) * oddFFT[k].real + Math.cos(-2 * Math.PI * k / N) * oddFFT[k].imag
            };
            
            result[k] = {
              real: evenFFT[k].real + t.real,
              imag: evenFFT[k].imag + t.imag
            };
            
            result[k + N / 2] = {
              real: evenFFT[k].real - t.real,
              imag: evenFFT[k].imag - t.imag
            };
          }
          
          return result;
        }
        
        // 素数检测 (Miller-Rabin算法)
        function isPrime(n, k = 5) {
          if (n < 2) return false;
          if (n === 2 || n === 3) return true;
          if (n % 2 === 0) return false;
          
          // 写成 n-1 = d * 2^r 的形式
          let r = 0;
          let d = n - 1;
          while (d % 2 === 0) {
            d /= 2;
            r++;
          }
          
          // Miller-Rabin测试
          for (let i = 0; i < k; i++) {
            const a = 2 + Math.floor(Math.random() * (n - 4));
            let x = modPow(a, d, n);
            
            if (x === 1 || x === n - 1) continue;
            
            let composite = true;
            for (let j = 0; j < r - 1; j++) {
              x = (x * x) % n;
              if (x === n - 1) {
                composite = false;
                break;
              }
            }
            
            if (composite) return false;
          }
          
          return true;
        }
        
        function modPow(base, exp, mod) {
          let result = 1;
          base = base % mod;
          while (exp > 0) {
            if (exp % 2 === 1) {
              result = (result * base) % mod;
            }
            exp = Math.floor(exp / 2);
            base = (base * base) % mod;
          }
          return result;
        }
        
        // 处理任务
        parentPort.on('message', ({ taskId, operation, data }) => {
          try {
            let result;
            const startTime = Date.now();
            
            switch (operation) {
              case 'matrixMultiply':
                result = matrixMultiply(data.a, data.b);
                break;
              case 'fft':
                result = fft(data.signal);
                break;
              case 'isPrime':
                result = isPrime(data.number, data.iterations);
                break;
              default:
                throw new Error(\`Unknown operation: \${operation}\`);
            }
            
            const duration = Date.now() - startTime;
            
            parentPort.postMessage({
              taskId,
              success: true,
              result,
              duration
            });
            
          } catch (error) {
            parentPort.postMessage({
              taskId,
              success: false,
              error: error.message
            });
          }
        });
      `, { eval: true });

      worker.on('message', (message) => {
        this.handleWorkerMessage(message);
      });

      worker.on('error', (error) => {
        console.error('Worker错误:', error);
      });

      this.workers.push({
        worker,
        busy: false,
        tasksCompleted: 0
      });
    }

    console.log('✅ Worker线程池初始化完成');
  }

  // 处理Worker消息
  handleWorkerMessage(message) {
    const { taskId, success, result, error, duration } = message;
    
    // 找到对应的任务
    const taskIndex = this.taskQueue.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    const task = this.taskQueue.splice(taskIndex, 1)[0];
    
    // 释放Worker
    const worker = this.workers.find(w => w.busy && w.currentTaskId === taskId);
    if (worker) {
      worker.busy = false;
      worker.tasksCompleted++;
      worker.currentTaskId = null;
    }

    if (success) {
      console.log(`✅ 任务 ${taskId} 完成，耗时: ${duration}ms`);
      task.resolve({ result, duration });
    } else {
      console.error(`❌ 任务 ${taskId} 失败: ${error}`);
      task.reject(new Error(error));
    }

    // 处理下一个任务
    this.processQueue();
  }

  // 提交计算任务
  async submitTask(operation, data) {
    return new Promise((resolve, reject) => {
      const taskId = this.nextTaskId++;
      
      const task = {
        id: taskId,
        operation,
        data,
        resolve,
        reject,
        submittedAt: Date.now()
      };

      this.taskQueue.push(task);
      
      if (this.useWorkers) {
        this.processQueue();
      } else {
        // 在主线程中执行
        this.executeInMainThread(task);
      }
    });
  }

  // 处理任务队列
  processQueue() {
    const availableWorker = this.workers.find(w => !w.busy);
    const pendingTask = this.taskQueue.find(t => !t.assigned);
    
    if (availableWorker && pendingTask) {
      availableWorker.busy = true;
      availableWorker.currentTaskId = pendingTask.id;
      pendingTask.assigned = true;
      
      availableWorker.worker.postMessage({
        taskId: pendingTask.id,
        operation: pendingTask.operation,
        data: pendingTask.data
      });
    }
  }

  // 在主线程中执行任务
  async executeInMainThread(task) {
    try {
      const startTime = Date.now();
      let result;

      switch (task.operation) {
        case 'matrixMultiply':
          result = this.matrixMultiplySync(task.data.a, task.data.b);
          break;
        case 'isPrime':
          result = this.isPrimeSync(task.data.number, task.data.iterations);
          break;
        default:
          throw new Error(`主线程不支持操作: ${task.operation}`);
      }

      const duration = Date.now() - startTime;
      
      // 移除任务
      const taskIndex = this.taskQueue.findIndex(t => t.id === task.id);
      if (taskIndex > -1) {
        this.taskQueue.splice(taskIndex, 1);
      }

      task.resolve({ result, duration });

    } catch (error) {
      task.reject(error);
    }
  }

  // 同步矩阵乘法
  matrixMultiplySync(a, b) {
    const rows = a.length;
    const cols = b[0].length;
    const inner = b.length;
    const result = new Array(rows);
    
    for (let i = 0; i < rows; i++) {
      result[i] = new Array(cols);
      for (let j = 0; j < cols; j++) {
        let sum = 0;
        for (let k = 0; k < inner; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    
    return result;
  }

  // 同步素数检测
  isPrimeSync(n, k = 5) {
    if (n < 2) return false;
    if (n === 2 || n === 3) return true;
    if (n % 2 === 0) return false;
    
    for (let i = 3; i * i <= n; i += 2) {
      if (n % i === 0) return false;
    }
    
    return true;
  }

  // 批量矩阵运算
  async batchMatrixOperations(matrices) {
    console.log(`📊 批量处理 ${matrices.length} 个矩阵运算...`);
    
    const tasks = [];
    
    for (let i = 0; i < matrices.length - 1; i++) {
      tasks.push(
        this.submitTask('matrixMultiply', {
          a: matrices[i],
          b: matrices[i + 1]
        })
      );
    }
    
    const results = await Promise.all(tasks);
    
    console.log('✅ 批量矩阵运算完成');
    return results;
  }

  // 素数筛选
  async findPrimesInRange(start, end, batchSize = 1000) {
    console.log(`🔍 在范围 ${start}-${end} 中查找素数...`);
    
    const primes = [];
    const tasks = [];
    
    for (let i = start; i <= end; i += batchSize) {
      const batchEnd = Math.min(i + batchSize - 1, end);
      const numbers = [];
      
      for (let j = i; j <= batchEnd; j++) {
        numbers.push(j);
      }
      
      // 为每个数字创建素数检测任务
      const batchTasks = numbers.map(num => 
        this.submitTask('isPrime', { number: num, iterations: 10 })
      );
      
      tasks.push(...batchTasks);
    }
    
    const results = await Promise.all(tasks);
    
    // 收集素数
    let index = 0;
    for (let i = start; i <= end; i++) {
      if (results[index] && results[index].result) {
        primes.push(i);
      }
      index++;
    }
    
    console.log(`✅ 找到 ${primes.length} 个素数`);
    return primes;
  }

  // 获取性能统计
  getPerformanceStats() {
    const totalTasks = this.workers.reduce((sum, w) => sum + w.tasksCompleted, 0);
    
    return {
      workers: {
        total: this.workers.length,
        busy: this.workers.filter(w => w.busy).length,
        idle: this.workers.filter(w => !w.busy).length
      },
      tasks: {
        queued: this.taskQueue.length,
        completed: totalTasks
      },
      performance: {
        averageTasksPerWorker: totalTasks / this.workers.length
      }
    };
  }

  // 关闭所有Worker
  async shutdown() {
    console.log('🔄 关闭计算模块...');
    
    for (const workerInfo of this.workers) {
      await workerInfo.worker.terminate();
    }
    
    this.workers = [];
    console.log('✅ 所有Worker已关闭');
  }
}

module.exports = HighPerformanceMath;
```

## 💾 内存优化模块

### 高效缓存管理器

```javascript
// high-performance-cache.js
class HighPerformanceCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 300000; // 5分钟
    this.checkInterval = options.checkInterval || 60000; // 1分钟
    this.compressionThreshold = options.compressionThreshold || 1024; // 1KB
    
    // 使用Map提供更好的性能
    this.cache = new Map();
    this.accessTimes = new Map();
    this.expirationTimes = new Map();
    
    // 统计信息
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      compressions: 0,
      memoryUsed: 0
    };
    
    // 启动清理定时器
    this.startCleanupTimer();
  }

  // 获取缓存项
  get(key) {
    const now = Date.now();
    
    // 检查是否存在
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return undefined;
    }
    
    // 检查是否过期
    const expirationTime = this.expirationTimes.get(key);
    if (expirationTime && now > expirationTime) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }
    
    // 更新访问时间
    this.accessTimes.set(key, now);
    this.stats.hits++;
    
    const item = this.cache.get(key);
    
    // 如果数据被压缩，解压缩
    if (item.compressed) {
      return this.decompress(item.data);
    }
    
    return item.data;
  }

  // 设置缓存项
  set(key, value, customTtl) {
    const now = Date.now();
    const ttl = customTtl || this.ttl;
    
    // 检查是否需要驱逐
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }
    
    // 序列化和可能的压缩
    let data = value;
    let compressed = false;
    let size = this.calculateSize(value);
    
    if (size > this.compressionThreshold) {
      const compressedData = this.compress(value);
      if (compressedData.length < size * 0.8) { // 压缩率超过20%才使用
        data = compressedData;
        compressed = true;
        size = compressedData.length;
        this.stats.compressions++;
      }
    }
    
    // 存储数据
    this.cache.set(key, { data, compressed, size });
    this.accessTimes.set(key, now);
    
    if (ttl > 0) {
      this.expirationTimes.set(key, now + ttl);
    }
    
    this.stats.sets++;
    this.updateMemoryUsage();
  }

  // 删除缓存项
  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.expirationTimes.delete(key);
      this.stats.deletes++;
      this.updateMemoryUsage();
      return true;
    }
    return false;
  }

  // 检查键是否存在
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    // 检查是否过期
    const expirationTime = this.expirationTimes.get(key);
    if (expirationTime && Date.now() > expirationTime) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  // LRU驱逐算法
  evictLeastRecentlyUsed() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
      console.log(`🗑️ 驱逐LRU项: ${oldestKey}`);
    }
  }

  // 清理过期项
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, expirationTime] of this.expirationTimes) {
      if (now > expirationTime) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.delete(key);
    }
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 清理了 ${expiredKeys.length} 个过期项`);
    }
  }

  // 启动清理定时器
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.checkInterval);
  }

  // 停止清理定时器
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // 简单的压缩实现 (实际应用中应使用专业压缩库)
  compress(data) {
    try {
      const zlib = require('zlib');
      const jsonString = JSON.stringify(data);
      return zlib.gzipSync(jsonString);
    } catch (error) {
      console.warn('压缩失败:', error.message);
      return JSON.stringify(data);
    }
  }

  // 解压缩
  decompress(compressedData) {
    try {
      const zlib = require('zlib');
      const decompressed = zlib.gunzipSync(compressedData);
      return JSON.parse(decompressed.toString());
    } catch (error) {
      console.warn('解压缩失败:', error.message);
      return compressedData;
    }
  }

  // 计算数据大小
  calculateSize(data) {
    if (Buffer.isBuffer(data)) {
      return data.length;
    }
    
    try {
      return Buffer.byteLength(JSON.stringify(data), 'utf8');
    } catch (error) {
      return 0;
    }
  }

  // 更新内存使用统计
  updateMemoryUsage() {
    let totalSize = 0;
    
    for (const item of this.cache.values()) {
      totalSize += item.size || 0;
    }
    
    this.stats.memoryUsed = totalSize;
  }

  // 批量设置
  mset(entries) {
    const results = [];
    
    for (const [key, value, ttl] of entries) {
      try {
        this.set(key, value, ttl);
        results.push({ key, success: true });
      } catch (error) {
        results.push({ key, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // 批量获取
  mget(keys) {
    const results = {};
    
    for (const key of keys) {
      results[key] = this.get(key);
    }
    
    return results;
  }

  // 获取统计信息
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    
    return {
      ...this.stats,
      hitRate: (hitRate * 100).toFixed(2) + '%',
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsageMB: (this.stats.memoryUsed / 1024 / 1024).toFixed(2)
    };
  }

  // 清空缓存
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    this.expirationTimes.clear();
    this.stats.memoryUsed = 0;
    console.log('🧹 缓存已清空');
  }

  // 关闭缓存
  close() {
    this.stopCleanupTimer();
    this.clear();
    console.log('✅ 缓存已关闭');
  }
}

// 分布式缓存节点
class DistributedCacheNode extends HighPerformanceCache {
  constructor(nodeId, options = {}) {
    super(options);
    this.nodeId = nodeId;
    this.peers = new Map();
    this.consistentHashing = new ConsistentHashing();
    this.replicationFactor = options.replicationFactor || 2;
  }

  // 添加对等节点
  addPeer(nodeId, node) {
    this.peers.set(nodeId, node);
    this.consistentHashing.addNode(nodeId);
    console.log(`🔗 添加对等节点: ${nodeId}`);
  }

  // 移除对等节点
  removePeer(nodeId) {
    this.peers.delete(nodeId);
    this.consistentHashing.removeNode(nodeId);
    console.log(`🔌 移除对等节点: ${nodeId}`);
  }

  // 分布式获取
  async distributedGet(key) {
    const targetNodes = this.consistentHashing.getNodes(key, this.replicationFactor);
    
    // 首先尝试本地获取
    if (targetNodes.includes(this.nodeId)) {
      const localValue = this.get(key);
      if (localValue !== undefined) {
        return localValue;
      }
    }
    
    // 从其他节点获取
    for (const nodeId of targetNodes) {
      if (nodeId !== this.nodeId && this.peers.has(nodeId)) {
        const peer = this.peers.get(nodeId);
        const value = peer.get(key);
        if (value !== undefined) {
          // 复制到本地
          this.set(key, value);
          return value;
        }
      }
    }
    
    return undefined;
  }

  // 分布式设置
  async distributedSet(key, value, ttl) {
    const targetNodes = this.consistentHashing.getNodes(key, this.replicationFactor);
    const promises = [];
    
    for (const nodeId of targetNodes) {
      if (nodeId === this.nodeId) {
        this.set(key, value, ttl);
      } else if (this.peers.has(nodeId)) {
        const peer = this.peers.get(nodeId);
        promises.push(
          Promise.resolve().then(() => peer.set(key, value, ttl))
        );
      }
    }
    
    await Promise.all(promises);
  }
}

// 一致性哈希实现
class ConsistentHashing {
  constructor() {
    this.ring = new Map();
    this.virtualNodes = 150; // 每个节点的虚拟节点数
  }

  // 哈希函数
  hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  // 添加节点
  addNode(nodeId) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const virtualKey = this.hash(`${nodeId}:${i}`);
      this.ring.set(virtualKey, nodeId);
    }
  }

  // 移除节点
  removeNode(nodeId) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const virtualKey = this.hash(`${nodeId}:${i}`);
      this.ring.delete(virtualKey);
    }
  }

  // 获取负责某个键的节点
  getNodes(key, count = 1) {
    if (this.ring.size === 0) return [];
    
    const keyHash = this.hash(key);
    const sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
    
    let startIndex = 0;
    for (let i = 0; i < sortedKeys.length; i++) {
      if (sortedKeys[i] >= keyHash) {
        startIndex = i;
        break;
      }
    }
    
    const nodes = new Set();
    let index = startIndex;
    
    while (nodes.size < count && nodes.size < this.getUniqueNodeCount()) {
      const nodeId = this.ring.get(sortedKeys[index]);
      nodes.add(nodeId);
      index = (index + 1) % sortedKeys.length;
    }
    
    return Array.from(nodes);
  }

  getUniqueNodeCount() {
    return new Set(this.ring.values()).size;
  }
}

module.exports = {
  HighPerformanceCache,
  DistributedCacheNode,
  ConsistentHashing
};
```

## 🌐 网络I/O优化模块

### 高性能HTTP客户端

```javascript
// high-performance-http-client.js
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { EventEmitter } = require('events');

class HighPerformanceHTTPClient extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxSockets: options.maxSockets || 256,
      maxFreeSockets: options.maxFreeSockets || 256,
      timeout: options.timeout || 30000,
      keepAlive: options.keepAlive !== false,
      keepAliveMsecs: options.keepAliveMsecs || 1000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options
    };
    
    // 创建HTTP和HTTPS代理
    this.httpAgent = new http.Agent({
      maxSockets: this.options.maxSockets,
      maxFreeSockets: this.options.maxFreeSockets,
      keepAlive: this.options.keepAlive,
      keepAliveMsecs: this.options.keepAliveMsecs
    });
    
    this.httpsAgent = new https.Agent({
      maxSockets: this.options.maxSockets,
      maxFreeSockets: this.options.maxFreeSockets,
      keepAlive: this.options.keepAlive,
      keepAliveMsecs: this.options.keepAliveMsecs
    });
    
    // 统计信息
    this.stats = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        retried: 0
      },
      timing: {
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0
      },
      connections: {
        created: 0,
        reused: 0,
        destroyed: 0
      }
    };
    
    // 请求队列和并发控制
    this.requestQueue = [];
    this.activeRequests = 0;
    this.maxConcurrency = options.maxConcurrency || 100;
    
    // 监听代理事件
    this.setupAgentListeners();
  }

  // 设置代理监听器
  setupAgentListeners() {
    [this.httpAgent, this.httpsAgent].forEach(agent => {
      agent.on('connect', () => {
        this.stats.connections.created++;
      });
      
      agent.on('free', () => {
        this.stats.connections.reused++;
      });
    });
  }

  // 发送HTTP请求
  async request(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestInfo = {
        url,
        options,
        resolve,
        reject,
        retries: 0,
        startTime: Date.now()
      };
      
      if (this.activeRequests >= this.maxConcurrency) {
        this.requestQueue.push(requestInfo);
        return;
      }
      
      this.executeRequest(requestInfo);
    });
  }

  // 执行HTTP请求
  executeRequest(requestInfo) {
    this.activeRequests++;
    this.stats.requests.total++;
    
    const { url, options } = requestInfo;
    const parsedUrl = new URL(url);
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || this.options.timeout,
      agent: parsedUrl.protocol === 'https:' ? this.httpsAgent : this.httpAgent
    };
    
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = client.request(requestOptions, (res) => {
      this.handleResponse(res, requestInfo);
    });
    
    req.on('error', (error) => {
      this.handleError(error, requestInfo);
    });
    
    req.on('timeout', () => {
      req.destroy();
      this.handleError(new Error('Request timeout'), requestInfo);
    });
    
    // 发送请求体
    if (options.body) {
      if (typeof options.body === 'string') {
        req.write(options.body);
      } else if (Buffer.isBuffer(options.body)) {
        req.write(options.body);
      } else {
        req.write(JSON.stringify(options.body));
      }
    }
    
    req.end();
  }

  // 处理响应
  handleResponse(res, requestInfo) {
    const chunks = [];
    
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    res.on('end', () => {
      const responseTime = Date.now() - requestInfo.startTime;
      this.updateTimingStats(responseTime);
      
      const body = Buffer.concat(chunks);
      
      const response = {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        headers: res.headers,
        body: body,
        responseTime
      };
      
      // 根据需要解析响应体
      if (res.headers['content-type']?.includes('application/json')) {
        try {
          response.data = JSON.parse(body.toString());
        } catch (error) {
          response.data = body.toString();
        }
      } else {
        response.data = body.toString();
      }
      
      this.completeRequest(requestInfo, null, response);
    });
    
    res.on('error', (error) => {
      this.handleError(error, requestInfo);
    });
  }

  // 处理错误
  handleError(error, requestInfo) {
    if (requestInfo.retries < this.options.maxRetries) {
      requestInfo.retries++;
      this.stats.requests.retried++;
      
      console.log(`🔄 重试请求 (${requestInfo.retries}/${this.options.maxRetries}): ${requestInfo.url}`);
      
      setTimeout(() => {
        this.executeRequest(requestInfo);
      }, this.options.retryDelay * requestInfo.retries);
      
      return;
    }
    
    this.completeRequest(requestInfo, error);
  }

  // 完成请求
  completeRequest(requestInfo, error, response) {
    this.activeRequests--;
    
    if (error) {
      this.stats.requests.failed++;
      requestInfo.reject(error);
    } else {
      this.stats.requests.successful++;
      requestInfo.resolve(response);
    }
    
    // 处理队列中的下一个请求
    if (this.requestQueue.length > 0) {
      const nextRequest = this.requestQueue.shift();
      this.executeRequest(nextRequest);
    }
  }

  // 更新时间统计
  updateTimingStats(responseTime) {
    this.stats.timing.totalTime += responseTime;
    this.stats.timing.avgTime = this.stats.timing.totalTime / this.stats.requests.total;
    this.stats.timing.minTime = Math.min(this.stats.timing.minTime, responseTime);
    this.stats.timing.maxTime = Math.max(this.stats.timing.maxTime, responseTime);
  }

  // 批量请求
  async batchRequest(requests) {
    console.log(`📦 批量发送 ${requests.length} 个请求...`);
    
    const promises = requests.map(req => 
      this.request(req.url, req.options).catch(error => ({ error }))
    );
    
    const results = await Promise.all(promises);
    
    const successful = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;
    
    console.log(`✅ 批量请求完成: 成功=${successful}, 失败=${failed}`);
    
    return results;
  }

  // 流式下载
  async streamDownload(url, writeStream, options = {}) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: options.headers || {},
        agent: parsedUrl.protocol === 'https:' ? this.httpsAgent : this.httpAgent
      };
      
      const req = client.request(requestOptions, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }
        
        let downloadedBytes = 0;
        const totalBytes = parseInt(res.headers['content-length']) || 0;
        
        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          
          if (options.onProgress) {
            options.onProgress(downloadedBytes, totalBytes);
          }
        });
        
        res.pipe(writeStream);
        
        res.on('end', () => {
          resolve({
            downloadedBytes,
            totalBytes,
            statusCode: res.statusCode,
            headers: res.headers
          });
        });
        
        res.on('error', reject);
      });
      
      req.on('error', reject);
      req.end();
    });
  }

  // 连接池状态
  getConnectionPoolStatus() {
    return {
      http: {
        sockets: Object.keys(this.httpAgent.sockets).length,
        freeSockets: Object.keys(this.httpAgent.freeSockets).length,
        requests: Object.keys(this.httpAgent.requests).length
      },
      https: {
        sockets: Object.keys(this.httpsAgent.sockets).length,
        freeSockets: Object.keys(this.httpsAgent.freeSockets).length,
        requests: Object.keys(this.httpsAgent.requests).length
      }
    };
  }

  // 获取统计信息
  getStats() {
    return {
      ...this.stats,
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      connectionPool: this.getConnectionPoolStatus(),
      successRate: (this.stats.requests.successful / this.stats.requests.total * 100).toFixed(2) + '%'
    };
  }

  // 重置统计信息
  resetStats() {
    this.stats = {
      requests: { total: 0, successful: 0, failed: 0, retried: 0 },
      timing: { totalTime: 0, avgTime: 0, minTime: Infinity, maxTime: 0 },
      connections: { created: 0, reused: 0, destroyed: 0 }
    };
  }

  // 关闭客户端
  close() {
    this.httpAgent.destroy();
    this.httpsAgent.destroy();
    console.log('✅ HTTP客户端已关闭');
  }
}

module.exports = HighPerformanceHTTPClient;
```

## 🎮 实时系统优化

### 低延迟事件处理器

```javascript
// low-latency-event-processor.js
const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');

class LowLatencyEventProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxLatency: options.maxLatency || 10, // 10ms最大延迟
      batchSize: options.batchSize || 100,
      flushInterval: options.flushInterval || 1, // 1ms
      priorityLevels: options.priorityLevels || 5,
      ...options
    };
    
    // 优先级队列
    this.priorityQueues = Array.from(
      { length: this.options.priorityLevels },
      () => []
    );
    
    // 批处理缓冲区
    this.batchBuffer = [];
    this.batchTimer = null;
    
    // 性能统计
    this.stats = {
      events: {
        processed: 0,
        batched: 0,
        prioritized: 0
      },
      latency: {
        samples: [],
        avg: 0,
        p95: 0,
        p99: 0,
        max: 0
      },
      throughput: {
        eventsPerSecond: 0,
        lastSecondCount: 0,
        lastSecondTime: Date.now()
      }
    };
    
    // 启动处理循环
    this.startProcessingLoop();
    this.startThroughputMonitoring();
  }

  // 处理事件
  processEvent(event, priority = 0) {
    const startTime = performance.now();
    
    event.timestamp = startTime;
    event.priority = priority;
    event.id = this.generateEventId();
    
    if (priority > 0) {
      // 高优先级事件立即处理
      this.handleHighPriorityEvent(event);
    } else {
      // 普通事件加入批处理
      this.addToBatch(event);
    }
  }

  // 生成事件ID
  generateEventId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 处理高优先级事件
  handleHighPriorityEvent(event) {
    const queueIndex = Math.min(event.priority - 1, this.options.priorityLevels - 1);
    this.priorityQueues[queueIndex].push(event);
    this.stats.events.prioritized++;
    
    // 立即处理高优先级事件
    setImmediate(() => {
      this.processPriorityQueue(queueIndex);
    });
  }

  // 处理优先级队列
  processPriorityQueue(queueIndex) {
    const queue = this.priorityQueues[queueIndex];
    
    while (queue.length > 0) {
      const event = queue.shift();
      this.executeEvent(event);
    }
  }

  // 添加到批处理
  addToBatch(event) {
    this.batchBuffer.push(event);
    
    if (this.batchBuffer.length >= this.options.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, this.options.flushInterval);
    }
  }

  // 刷新批处理
  flushBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.batchBuffer.length === 0) return;
    
    const batch = this.batchBuffer.splice(0);
    this.stats.events.batched += batch.length;
    
    // 批量处理事件
    this.processBatch(batch);
  }

  // 处理批次
  processBatch(batch) {
    // 按类型分组处理
    const eventGroups = this.groupEventsByType(batch);
    
    for (const [type, events] of eventGroups) {
      this.processBatchByType(type, events);
    }
  }

  // 按类型分组事件
  groupEventsByType(events) {
    const groups = new Map();
    
    for (const event of events) {
      const type = event.type || 'default';
      
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      
      groups.get(type).push(event);
    }
    
    return groups;
  }

  // 按类型批量处理
  processBatchByType(type, events) {
    switch (type) {
      case 'analytics':
        this.processAnalyticsEvents(events);
        break;
      case 'logging':
        this.processLoggingEvents(events);
        break;
      case 'metrics':
        this.processMetricsEvents(events);
        break;
      default:
        events.forEach(event => this.executeEvent(event));
    }
  }

  // 处理分析事件
  processAnalyticsEvents(events) {
    // 聚合相似事件
    const aggregated = this.aggregateEvents(events);
    
    for (const event of aggregated) {
      this.executeEvent(event);
    }
  }

  // 处理日志事件
  processLoggingEvents(events) {
    // 批量写入日志
    const logEntries = events.map(event => ({
      timestamp: event.timestamp,
      level: event.level || 'info',
      message: event.message,
      data: event.data
    }));
    
    this.emit('batchLog', logEntries);
  }

  // 处理指标事件
  processMetricsEvents(events) {
    const metrics = {};
    
    for (const event of events) {
      const key = event.metricName;
      if (!metrics[key]) {
        metrics[key] = [];
      }
      metrics[key].push(event.value);
    }
    
    // 计算聚合指标
    const aggregatedMetrics = {};
    for (const [key, values] of Object.entries(metrics)) {
      aggregatedMetrics[key] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
    
    this.emit('batchMetrics', aggregatedMetrics);
  }

  // 聚合相似事件
  aggregateEvents(events) {
    const aggregated = new Map();
    
    for (const event of events) {
      const key = `${event.action || 'unknown'}_${event.resource || 'unknown'}`;
      
      if (!aggregated.has(key)) {
        aggregated.set(key, {
          ...event,
          count: 1,
          timestamps: [event.timestamp]
        });
      } else {
        const existing = aggregated.get(key);
        existing.count++;
        existing.timestamps.push(event.timestamp);
      }
    }
    
    return Array.from(aggregated.values());
  }

  // 执行单个事件
  executeEvent(event) {
    const startTime = performance.now();
    
    try {
      // 触发事件处理器
      this.emit('event', event);
      
      const endTime = performance.now();
      const latency = endTime - event.timestamp;
      
      this.recordLatency(latency);
      this.stats.events.processed++;
      
      // 检查延迟警告
      if (latency > this.options.maxLatency) {
        console.warn(`⚠️ 高延迟事件: ${latency.toFixed(2)}ms (ID: ${event.id})`);
      }
      
    } catch (error) {
      console.error('❌ 事件处理失败:', error);
      this.emit('error', { event, error });
    }
  }

  // 记录延迟
  recordLatency(latency) {
    this.stats.latency.samples.push(latency);
    
    // 保持最近1000个样本
    if (this.stats.latency.samples.length > 1000) {
      this.stats.latency.samples = this.stats.latency.samples.slice(-1000);
    }
    
    // 计算统计信息
    const samples = this.stats.latency.samples.slice().sort((a, b) => a - b);
    
    this.stats.latency.avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    this.stats.latency.p95 = samples[Math.floor(samples.length * 0.95)];
    this.stats.latency.p99 = samples[Math.floor(samples.length * 0.99)];
    this.stats.latency.max = Math.max(...samples);
  }

  // 启动处理循环
  startProcessingLoop() {
    const processLoop = () => {
      // 优先处理高优先级队列
      for (let i = this.options.priorityLevels - 1; i >= 0; i--) {
        if (this.priorityQueues[i].length > 0) {
          this.processPriorityQueue(i);
        }
      }
      
      // 使用setImmediate确保不阻塞事件循环
      setImmediate(processLoop);
    };
    
    processLoop();
  }

  // 启动吞吐量监控
  startThroughputMonitoring() {
    setInterval(() => {
      const now = Date.now();
      const timeDiff = now - this.stats.throughput.lastSecondTime;
      
      if (timeDiff >= 1000) {
        this.stats.throughput.eventsPerSecond = 
          Math.round(this.stats.throughput.lastSecondCount * 1000 / timeDiff);
        
        this.stats.throughput.lastSecondCount = 0;
        this.stats.throughput.lastSecondTime = now;
      }
    }, 1000);
  }

  // 获取性能统计
  getPerformanceStats() {
    return {
      events: this.stats.events,
      latency: {
        avg: this.stats.latency.avg?.toFixed(2) + 'ms',
        p95: this.stats.latency.p95?.toFixed(2) + 'ms',
        p99: this.stats.latency.p99?.toFixed(2) + 'ms',
        max: this.stats.latency.max?.toFixed(2) + 'ms'
      },
      throughput: {
        eventsPerSecond: this.stats.throughput.eventsPerSecond,
        totalProcessed: this.stats.events.processed
      },
      queues: {
        batchBuffer: this.batchBuffer.length,
        priorityQueues: this.priorityQueues.map(q => q.length)
      }
    };
  }

  // 性能基准测试
  async performanceBenchmark(duration = 10000) {
    console.log(`🏃 开始性能基准测试 (${duration}ms)...`);
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    let eventCount = 0;
    
    // 重置统计
    this.stats.events.processed = 0;
    this.stats.latency.samples = [];
    
    // 生成测试事件
    const generateEvents = () => {
      while (Date.now() < endTime) {
        const eventType = Math.random() > 0.8 ? 'analytics' : 'logging';
        const priority = Math.random() > 0.95 ? Math.floor(Math.random() * 3) + 1 : 0;
        
        this.processEvent({
          type: eventType,
          action: 'test_action',
          resource: 'test_resource',
          data: { value: Math.random() * 100 }
        }, priority);
        
        eventCount++;
        
        // 短暂让出控制权
        if (eventCount % 1000 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
    };
    
    await generateEvents();
    
    // 等待所有事件处理完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const actualDuration = Date.now() - startTime;
    const stats = this.getPerformanceStats();
    
    console.log('📊 基准测试结果:');
    console.log(`  总事件数: ${eventCount}`);
    console.log(`  处理事件数: ${stats.events.processed}`);
    console.log(`  平均延迟: ${stats.latency.avg}`);
    console.log(`  P95延迟: ${stats.latency.p95}`);
    console.log(`  P99延迟: ${stats.latency.p99}`);
    console.log(`  最大延迟: ${stats.latency.max}`);
    console.log(`  吞吐量: ${Math.round(eventCount / actualDuration * 1000)} events/sec`);
    
    return {
      eventsGenerated: eventCount,
      eventsProcessed: stats.events.processed,
      duration: actualDuration,
      throughput: Math.round(eventCount / actualDuration * 1000),
      latency: stats.latency
    };
  }

  // 关闭处理器
  close() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // 处理剩余事件
    this.flushBatch();
    
    console.log('✅ 事件处理器已关闭');
  }
}

module.exports = LowLatencyEventProcessor;
```

## 📊 性能测试和对比

### 综合性能测试套件

```javascript
// performance-test-suite.js
const HighPerformanceMath = require('./high-performance-math');
const { HighPerformanceCache } = require('./high-performance-cache');
const HighPerformanceHTTPClient = require('./high-performance-http-client');
const LowLatencyEventProcessor = require('./low-latency-event-processor');

class PerformanceTestSuite {
  constructor() {
    this.testResults = [];
  }

  // 运行所有性能测试
  async runAllTests() {
    console.log('🚀 开始综合性能测试套件...\n');

    const tests = [
      { name: '数学计算模块', test: () => this.testMathModule() },
      { name: '缓存模块', test: () => this.testCacheModule() },
      { name: 'HTTP客户端', test: () => this.testHTTPClient() },
      { name: '事件处理器', test: () => this.testEventProcessor() }
    ];

    for (const test of tests) {
      try {
        console.log(`🧪 测试 ${test.name}...`);
        const result = await test.test();
        this.testResults.push({ name: test.name, ...result });
        console.log(`✅ ${test.name} 测试完成\n`);
      } catch (error) {
        console.error(`❌ ${test.name} 测试失败:`, error.message);
        this.testResults.push({ name: test.name, error: error.message });
      }
    }

    this.generateReport();
  }

  // 测试数学计算模块
  async testMathModule() {
    const math = new HighPerformanceMath({ useWorkers: true, workerCount: 4 });
    
    try {
      const startTime = Date.now();
      
      // 矩阵乘法测试
      const matrixA = Array.from({ length: 100 }, () => 
        Array.from({ length: 100 }, () => Math.random())
      );
      const matrixB = Array.from({ length: 100 }, () => 
        Array.from({ length: 100 }, () => Math.random())
      );
      
      const matrixResult = await math.submitTask('matrixMultiply', { a: matrixA, b: matrixB });
      
      // 素数检测测试
      const primeTests = Array.from({ length: 20 }, (_, i) => 
        math.submitTask('isPrime', { number: 1000 + i * 100, iterations: 10 })
      );
      
      await Promise.all(primeTests);
      
      const endTime = Date.now();
      const stats = math.getPerformanceStats();
      
      return {
        duration: endTime - startTime,
        matrixMultiplyTime: matrixResult.duration,
        tasksCompleted: stats.tasks.completed,
        workersUsed: stats.workers.total
      };
      
    } finally {
      await math.shutdown();
    }
  }

  // 测试缓存模块
  async testCacheModule() {
    const cache = new HighPerformanceCache({
      maxSize: 10000,
      ttl: 60000,
      compressionThreshold: 512
    });
    
    const startTime = Date.now();
    
    // 写入测试
    const writePromises = [];
    for (let i = 0; i < 5000; i++) {
      const key = `key_${i}`;
      const value = {
        id: i,
        data: 'x'.repeat(Math.floor(Math.random() * 1000)),
        timestamp: Date.now()
      };
      cache.set(key, value);
    }
    
    // 读取测试
    let hits = 0;
    for (let i = 0; i < 10000; i++) {
      const key = `key_${Math.floor(Math.random() * 5000)}`;
      if (cache.get(key)) {
        hits++;
      }
    }
    
    const endTime = Date.now();
    const stats = cache.getStats();
    
    cache.close();
    
    return {
      duration: endTime - startTime,
      hitRate: parseFloat(stats.hitRate),
      compressions: stats.compressions,
      memoryUsageMB: parseFloat(stats.memoryUsageMB)
    };
  }

  // 测试HTTP客户端
  async testHTTPClient() {
    const client = new HighPerformanceHTTPClient({
      maxSockets: 50,
      maxConcurrency: 20
    });
    
    const startTime = Date.now();
    
    try {
      // 创建测试请求
      const requests = Array.from({ length: 100 }, (_, i) => ({
        url: 'https://httpbin.org/delay/0',
        options: {
          method: 'GET',
          headers: { 'User-Agent': 'PerformanceTest' }
        }
      }));
      
      const results = await client.batchRequest(requests);
      const successful = results.filter(r => !r.error).length;
      
      const endTime = Date.now();
      const stats = client.getStats();
      
      return {
        duration: endTime - startTime,
        requestsTotal: 100,
        requestsSuccessful: successful,
        avgResponseTime: parseFloat(stats.timing.avgTime),
        successRate: parseFloat(stats.successRate)
      };
      
    } finally {
      client.close();
    }
  }

  // 测试事件处理器
  async testEventProcessor() {
    const processor = new LowLatencyEventProcessor({
      maxLatency: 5,
      batchSize: 50,
      flushInterval: 1
    });
    
    const benchmarkResult = await processor.performanceBenchmark(5000);
    
    processor.close();
    
    return {
      duration: benchmarkResult.duration,
      eventsProcessed: benchmarkResult.eventsProcessed,
      throughput: benchmarkResult.throughput,
      avgLatency: parseFloat(benchmarkResult.latency.avg),
      p99Latency: parseFloat(benchmarkResult.latency.p99)
    };
  }

  // 生成性能报告
  generateReport() {
    console.log('📋 综合性能测试报告');
    console.log('='.repeat(50));
    
    this.testResults.forEach(result => {
      console.log(`\n🔧 ${result.name}:`);
      
      if (result.error) {
        console.log(`  ❌ 错误: ${result.error}`);
        return;
      }
      
      Object.entries(result).forEach(([key, value]) => {
        if (key !== 'name') {
          console.log(`  ${key}: ${value}`);
        }
      });
    });
    
    console.log('\n🎯 性能优化建议:');
    this.generateOptimizationRecommendations();
  }

  // 生成优化建议
  generateOptimizationRecommendations() {
    const recommendations = [];
    
    this.testResults.forEach(result => {
      switch (result.name) {
        case '数学计算模块':
          if (result.matrixMultiplyTime > 100) {
            recommendations.push('考虑使用更多Worker线程或优化矩阵算法');
          }
          break;
          
        case '缓存模块':
          if (result.hitRate < 80) {
            recommendations.push('优化缓存策略，提高命中率');
          }
          if (result.memoryUsageMB > 100) {
            recommendations.push('考虑启用压缩或调整缓存大小');
          }
          break;
          
        case 'HTTP客户端':
          if (result.avgResponseTime > 1000) {
            recommendations.push('检查网络连接或增加连接池大小');
          }
          if (parseFloat(result.successRate) < 95) {
            recommendations.push('优化错误处理和重试机制');
          }
          break;
          
        case '事件处理器':
          if (result.avgLatency > 10) {
            recommendations.push('减少批处理大小或优化事件处理逻辑');
          }
          if (result.throughput < 10000) {
            recommendations.push('考虑增加处理并发度或优化事件分发');
          }
          break;
      }
    });
    
    if (recommendations.length === 0) {
      console.log('  ✅ 所有模块性能表现良好！');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }
}

// 使用示例
async function runPerformanceTests() {
  const testSuite = new PerformanceTestSuite();
  await testSuite.runAllTests();
}

// 如果直接运行此文件
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = { PerformanceTestSuite, runPerformanceTests };
```

性能关键模块的设计需要在功能、性能和可维护性之间找到平衡，通过合理的架构设计和持续的性能监控，可以构建出高效可靠的系统组件！
