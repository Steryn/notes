# Cluster模块

## 🎯 学习目标

- 深入理解Node.js Cluster模块的工作原理
- 掌握多进程架构的设计和实现
- 学会进程间通信和负载均衡
- 了解集群管理和故障恢复机制

## 📚 核心概念

### Cluster模块基础

```javascript
// Cluster模块核心概念
const clusterConcepts = {
  architecture: {
    master: {
      description: '主进程 - 管理工作进程',
      responsibilities: [
        '创建和管理工作进程',
        '负载均衡',
        '进程监控',
        '故障恢复'
      ]
    },
    worker: {
      description: '工作进程 - 处理实际业务',
      responsibilities: [
        '处理客户端请求',
        '执行业务逻辑',
        '与主进程通信',
        '报告状态'
      ]
    }
  },
  communication: {
    ipc: '进程间通信 (Inter-Process Communication)',
    events: '事件驱动通信',
    messageQueue: '消息队列机制'
  },
  loadBalancing: {
    roundRobin: '轮询调度 (默认)',
    none: '操作系统调度',
    custom: '自定义调度策略'
  }
};

console.log('Cluster概念:', clusterConcepts);
```

## 🛠️ 基础Cluster实现

### 简单集群服务器

```javascript
// basic-cluster.js
const cluster = require('cluster');
const http = require('http');
const os = require('os');

class BasicClusterServer {
  constructor(options = {}) {
    this.options = {
      workers: options.workers || os.cpus().length,
      port: options.port || 3000,
      host: options.host || 'localhost',
      ...options
    };
    
    this.workers = new Map();
    this.stats = {
      requests: 0,
      workers: {
        created: 0,
        died: 0,
        restarted: 0
      },
      startTime: Date.now()
    };
  }

  start() {
    if (cluster.isMaster) {
      this.setupMaster();
    } else {
      this.setupWorker();
    }
  }

  setupMaster() {
    console.log(`🚀 主进程启动 PID: ${process.pid}`);
    console.log(`📊 CPU核心数: ${os.cpus().length}`);
    console.log(`👥 启动 ${this.options.workers} 个工作进程...\n`);

    // 设置集群配置
    cluster.setupMaster({
      exec: __filename,
      args: ['--worker'],
      silent: false
    });

    // 创建工作进程
    for (let i = 0; i < this.options.workers; i++) {
      this.createWorker();
    }

    // 监听工作进程事件
    this.setupMasterEvents();

    // 显示状态信息
    this.displayStatus();
  }

  createWorker() {
    const worker = cluster.fork();
    
    this.workers.set(worker.id, {
      worker,
      pid: worker.process.pid,
      startTime: Date.now(),
      requests: 0,
      memory: 0,
      cpu: 0
    });

    this.stats.workers.created++;
    
    console.log(`✅ 工作进程创建: ID=${worker.id}, PID=${worker.process.pid}`);
    
    return worker;
  }

  setupMasterEvents() {
    // 工作进程上线
    cluster.on('online', (worker) => {
      console.log(`🟢 工作进程上线: ID=${worker.id}, PID=${worker.process.pid}`);
    });

    // 工作进程退出
    cluster.on('exit', (worker, code, signal) => {
      console.log(`🔴 工作进程退出: ID=${worker.id}, PID=${worker.process.pid}, 代码=${code}, 信号=${signal}`);
      
      this.workers.delete(worker.id);
      this.stats.workers.died++;

      // 自动重启工作进程
      if (!worker.exitedAfterDisconnect) {
        console.log(`🔄 重启工作进程...`);
        this.createWorker();
        this.stats.workers.restarted++;
      }
    });

    // 工作进程断开连接
    cluster.on('disconnect', (worker) => {
      console.log(`⚠️ 工作进程断开连接: ID=${worker.id}`);
    });

    // 监听工作进程消息
    cluster.on('message', (worker, message) => {
      this.handleWorkerMessage(worker, message);
    });

    // 优雅关闭处理
    process.on('SIGINT', () => {
      this.gracefulShutdown();
    });

    process.on('SIGTERM', () => {
      this.gracefulShutdown();
    });
  }

  handleWorkerMessage(worker, message) {
    const workerInfo = this.workers.get(worker.id);
    
    if (!workerInfo) return;

    switch (message.type) {
      case 'request':
        workerInfo.requests++;
        this.stats.requests++;
        break;
        
      case 'stats':
        workerInfo.memory = message.memory;
        workerInfo.cpu = message.cpu;
        break;
        
      case 'error':
        console.error(`❌ 工作进程错误 ID=${worker.id}:`, message.error);
        break;
        
      default:
        console.log(`📨 工作进程消息 ID=${worker.id}:`, message);
    }
  }

  setupWorker() {
    const server = http.createServer((req, res) => {
      // 向主进程报告请求
      process.send({ type: 'request', url: req.url, method: req.method });

      // 处理请求
      const response = {
        message: 'Hello from Cluster!',
        worker: {
          id: cluster.worker.id,
          pid: process.pid
        },
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    });

    server.listen(this.options.port, this.options.host, () => {
      console.log(`🌐 工作进程服务器启动: ID=${cluster.worker.id}, PID=${process.pid}, 端口=${this.options.port}`);
    });

    // 定期发送统计信息
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      process.send({
        type: 'stats',
        memory: memUsage.heapUsed,
        cpu: cpuUsage.user + cpuUsage.system
      });
    }, 5000);

    // 优雅关闭处理
    process.on('SIGTERM', () => {
      console.log(`🔄 工作进程 ${cluster.worker.id} 开始优雅关闭...`);
      
      server.close(() => {
        console.log(`✅ 工作进程 ${cluster.worker.id} 已关闭`);
        process.exit(0);
      });
    });
  }

  displayStatus() {
    setInterval(() => {
      console.log('\n📊 集群状态:');
      console.log(`  运行时间: ${Math.floor((Date.now() - this.stats.startTime) / 1000)}秒`);
      console.log(`  总请求数: ${this.stats.requests}`);
      console.log(`  工作进程: 创建=${this.stats.workers.created}, 死亡=${this.stats.workers.died}, 重启=${this.stats.workers.restarted}`);
      console.log(`  活跃工作进程: ${this.workers.size}`);
      
      console.log('\n👥 工作进程详情:');
      for (const [id, info] of this.workers) {
        const uptime = Math.floor((Date.now() - info.startTime) / 1000);
        const memoryMB = (info.memory / 1024 / 1024).toFixed(2);
        
        console.log(`  ID=${id}, PID=${info.pid}, 运行=${uptime}s, 请求=${info.requests}, 内存=${memoryMB}MB`);
      }
      console.log('');
    }, 10000);
  }

  gracefulShutdown() {
    console.log('\n🔄 开始优雅关闭集群...');
    
    // 断开所有工作进程
    for (const [id, info] of this.workers) {
      info.worker.disconnect();
    }

    // 等待工作进程关闭
    setTimeout(() => {
      console.log('💀 强制终止剩余工作进程...');
      for (const [id, info] of this.workers) {
        info.worker.kill();
      }
      
      console.log('✅ 集群已关闭');
      process.exit(0);
    }, 10000);
  }
}

// 使用示例
if (require.main === module) {
  const server = new BasicClusterServer({
    workers: 4,
    port: 3000
  });
  
  server.start();
}

module.exports = BasicClusterServer;
```

### 高级集群管理器

```javascript
// advanced-cluster-manager.js
const cluster = require('cluster');
const EventEmitter = require('events');
const os = require('os');

class AdvancedClusterManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      workers: options.workers || os.cpus().length,
      maxRestarts: options.maxRestarts || 10,
      restartDelay: options.restartDelay || 1000,
      gracefulTimeout: options.gracefulTimeout || 10000,
      healthCheckInterval: options.healthCheckInterval || 30000,
      memoryThreshold: options.memoryThreshold || 500 * 1024 * 1024, // 500MB
      cpuThreshold: options.cpuThreshold || 80, // 80%
      ...options
    };
    
    this.workers = new Map();
    this.restartCounts = new Map();
    this.isShuttingDown = false;
    
    this.stats = {
      startTime: Date.now(),
      totalRequests: 0,
      totalErrors: 0,
      restarts: 0,
      healthChecks: 0
    };
    
    this.loadBalancer = new LoadBalancer(this.options.loadBalancing);
  }

  start() {
    if (cluster.isMaster) {
      this.startMaster();
    } else {
      this.startWorker();
    }
  }

  startMaster() {
    console.log(`🚀 高级集群管理器启动 PID: ${process.pid}`);
    
    // 设置集群环境
    this.setupCluster();
    
    // 创建工作进程
    this.createWorkers();
    
    // 设置事件监听
    this.setupEvents();
    
    // 启动健康检查
    this.startHealthCheck();
    
    // 启动监控
    this.startMonitoring();
    
    console.log(`✅ 集群管理器启动完成，${this.workers.size} 个工作进程运行中`);
  }

  setupCluster() {
    cluster.setupMaster({
      exec: this.options.workerScript || __filename,
      args: this.options.args || [],
      silent: this.options.silent || false
    });

    // 设置调度策略
    cluster.schedulingPolicy = this.options.schedulingPolicy || cluster.SCHED_RR;
  }

  createWorkers() {
    for (let i = 0; i < this.options.workers; i++) {
      this.createWorker();
    }
  }

  createWorker() {
    if (this.isShuttingDown) {
      return null;
    }

    const worker = cluster.fork();
    const workerInfo = {
      id: worker.id,
      pid: worker.process.pid,
      startTime: Date.now(),
      requests: 0,
      errors: 0,
      memory: 0,
      cpu: 0,
      status: 'starting',
      lastHealthCheck: Date.now(),
      restartCount: this.restartCounts.get(worker.id) || 0
    };

    this.workers.set(worker.id, workerInfo);
    this.loadBalancer.addWorker(worker.id, workerInfo);

    console.log(`✨ 创建工作进程: ID=${worker.id}, PID=${worker.process.pid}`);
    
    return worker;
  }

  setupEvents() {
    // 工作进程上线
    cluster.on('online', (worker) => {
      const workerInfo = this.workers.get(worker.id);
      if (workerInfo) {
        workerInfo.status = 'online';
        console.log(`🟢 工作进程上线: ID=${worker.id}`);
        this.emit('workerOnline', worker, workerInfo);
      }
    });

    // 工作进程监听端口
    cluster.on('listening', (worker, address) => {
      const workerInfo = this.workers.get(worker.id);
      if (workerInfo) {
        workerInfo.status = 'listening';
        workerInfo.address = address;
        console.log(`👂 工作进程监听: ID=${worker.id}, ${address.address}:${address.port}`);
        this.emit('workerListening', worker, address);
      }
    });

    // 工作进程退出
    cluster.on('exit', (worker, code, signal) => {
      this.handleWorkerExit(worker, code, signal);
    });

    // 工作进程断开
    cluster.on('disconnect', (worker) => {
      console.log(`⚠️ 工作进程断开: ID=${worker.id}`);
      this.emit('workerDisconnect', worker);
    });

    // 进程间消息
    Object.values(cluster.workers).forEach(worker => {
      worker.on('message', (message) => {
        this.handleWorkerMessage(worker, message);
      });
    });

    // 优雅关闭
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
  }

  handleWorkerExit(worker, code, signal) {
    const workerInfo = this.workers.get(worker.id);
    
    console.log(`🔴 工作进程退出: ID=${worker.id}, PID=${worker.process.pid}, 代码=${code}, 信号=${signal}`);
    
    if (workerInfo) {
      this.workers.delete(worker.id);
      this.loadBalancer.removeWorker(worker.id);
      this.emit('workerExit', worker, code, signal, workerInfo);
    }

    // 检查是否需要重启
    if (!worker.exitedAfterDisconnect && !this.isShuttingDown) {
      this.scheduleWorkerRestart(worker.id, code, signal);
    }
  }

  scheduleWorkerRestart(workerId, code, signal) {
    const restartCount = this.restartCounts.get(workerId) || 0;
    
    if (restartCount >= this.options.maxRestarts) {
      console.error(`💀 工作进程 ${workerId} 重启次数超限 (${restartCount}), 停止重启`);
      this.emit('workerMaxRestarts', workerId, restartCount);
      return;
    }

    this.restartCounts.set(workerId, restartCount + 1);
    this.stats.restarts++;

    console.log(`🔄 计划重启工作进程 ${workerId} (第${restartCount + 1}次), ${this.options.restartDelay}ms后执行`);

    setTimeout(() => {
      if (!this.isShuttingDown) {
        this.createWorker();
        console.log(`♻️ 工作进程已重启: 新ID=${cluster.worker?.id || 'unknown'}`);
      }
    }, this.options.restartDelay);
  }

  handleWorkerMessage(worker, message) {
    const workerInfo = this.workers.get(worker.id);
    if (!workerInfo) return;

    switch (message.type) {
      case 'request':
        workerInfo.requests++;
        this.stats.totalRequests++;
        break;

      case 'error':
        workerInfo.errors++;
        this.stats.totalErrors++;
        console.error(`❌ 工作进程错误 ID=${worker.id}:`, message.error);
        break;

      case 'health':
        this.updateWorkerHealth(worker.id, message.data);
        break;

      case 'metrics':
        this.updateWorkerMetrics(worker.id, message.data);
        break;

      default:
        this.emit('workerMessage', worker, message);
    }
  }

  updateWorkerHealth(workerId, healthData) {
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) return;

    workerInfo.memory = healthData.memory;
    workerInfo.cpu = healthData.cpu;
    workerInfo.lastHealthCheck = Date.now();

    // 检查健康阈值
    if (healthData.memory > this.options.memoryThreshold) {
      console.warn(`⚠️ 工作进程 ${workerId} 内存使用过高: ${(healthData.memory / 1024 / 1024).toFixed(2)}MB`);
      this.emit('workerHighMemory', workerId, healthData.memory);
    }

    if (healthData.cpu > this.options.cpuThreshold) {
      console.warn(`⚠️ 工作进程 ${workerId} CPU使用过高: ${healthData.cpu.toFixed(2)}%`);
      this.emit('workerHighCPU', workerId, healthData.cpu);
    }
  }

  updateWorkerMetrics(workerId, metrics) {
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) return;

    workerInfo.metrics = metrics;
    this.emit('workerMetrics', workerId, metrics);
  }

  startHealthCheck() {
    setInterval(() => {
      this.performHealthCheck();
    }, this.options.healthCheckInterval);

    console.log(`🏥 健康检查已启动，间隔: ${this.options.healthCheckInterval}ms`);
  }

  performHealthCheck() {
    this.stats.healthChecks++;
    const now = Date.now();
    const unhealthyWorkers = [];

    for (const [workerId, workerInfo] of this.workers) {
      // 检查工作进程是否响应
      if (now - workerInfo.lastHealthCheck > this.options.healthCheckInterval * 2) {
        unhealthyWorkers.push(workerId);
      }
    }

    if (unhealthyWorkers.length > 0) {
      console.warn(`🏥 发现不健康的工作进程: ${unhealthyWorkers.join(', ')}`);
      
      unhealthyWorkers.forEach(workerId => {
        const worker = Object.values(cluster.workers).find(w => w.id === workerId);
        if (worker) {
          console.log(`💊 重启不健康的工作进程: ${workerId}`);
          worker.kill();
        }
      });
    }

    this.emit('healthCheck', {
      timestamp: now,
      totalWorkers: this.workers.size,
      unhealthyWorkers: unhealthyWorkers.length
    });
  }

  startMonitoring() {
    setInterval(() => {
      this.displayClusterStats();
    }, 30000); // 每30秒显示一次统计
  }

  displayClusterStats() {
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const avgRequestsPerWorker = this.stats.totalRequests / this.workers.size;
    
    console.log('\n📊 集群统计信息:');
    console.log(`  运行时间: ${uptime}秒`);
    console.log(`  工作进程: ${this.workers.size}/${this.options.workers}`);
    console.log(`  总请求: ${this.stats.totalRequests}`);
    console.log(`  总错误: ${this.stats.totalErrors}`);
    console.log(`  重启次数: ${this.stats.restarts}`);
    console.log(`  健康检查: ${this.stats.healthChecks}`);
    console.log(`  平均请求/进程: ${avgRequestsPerWorker.toFixed(2)}`);

    console.log('\n👥 工作进程状态:');
    for (const [workerId, info] of this.workers) {
      const workerUptime = Math.floor((Date.now() - info.startTime) / 1000);
      const memoryMB = (info.memory / 1024 / 1024).toFixed(2);
      
      console.log(`  ID=${workerId}: 状态=${info.status}, 运行=${workerUptime}s, 请求=${info.requests}, 错误=${info.errors}, 内存=${memoryMB}MB`);
    }
    console.log('');
  }

  // 手动重启工作进程
  restartWorker(workerId) {
    const worker = Object.values(cluster.workers).find(w => w.id === workerId);
    
    if (!worker) {
      console.error(`❌ 工作进程 ${workerId} 不存在`);
      return false;
    }

    console.log(`🔄 手动重启工作进程: ${workerId}`);
    worker.kill();
    return true;
  }

  // 重启所有工作进程
  restartAllWorkers() {
    console.log('🔄 重启所有工作进程...');
    
    const workers = Array.from(this.workers.keys());
    
    workers.forEach(workerId => {
      setTimeout(() => {
        this.restartWorker(workerId);
      }, Math.random() * 5000); // 随机延迟避免同时重启
    });
  }

  gracefulShutdown(signal) {
    console.log(`\n🔄 收到信号 ${signal}，开始优雅关闭...`);
    this.isShuttingDown = true;

    const workers = Object.values(cluster.workers);
    
    if (workers.length === 0) {
      console.log('✅ 没有工作进程需要关闭');
      process.exit(0);
      return;
    }

    console.log(`📤 向 ${workers.length} 个工作进程发送关闭信号...`);
    
    // 断开所有工作进程
    workers.forEach(worker => {
      worker.disconnect();
    });

    // 设置强制关闭超时
    const forceShutdownTimer = setTimeout(() => {
      console.log('💀 强制终止剩余工作进程...');
      
      workers.forEach(worker => {
        if (!worker.isDead()) {
          worker.kill('SIGKILL');
        }
      });
      
      process.exit(1);
    }, this.options.gracefulTimeout);

    // 等待所有工作进程退出
    let exitedWorkers = 0;
    
    const checkAllExited = () => {
      exitedWorkers++;
      
      if (exitedWorkers >= workers.length) {
        clearTimeout(forceShutdownTimer);
        console.log('✅ 所有工作进程已优雅关闭');
        process.exit(0);
      }
    };

    workers.forEach(worker => {
      worker.on('exit', checkAllExited);
    });
  }

  startWorker() {
    // 工作进程逻辑由子类或外部实现
    console.log(`🔧 工作进程启动: ID=${cluster.worker.id}, PID=${process.pid}`);
    
    // 定期发送健康状态
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      process.send({
        type: 'health',
        data: {
          memory: memUsage.heapUsed,
          cpu: (cpuUsage.user + cpuUsage.system) / 1000000, // 转换为毫秒
          uptime: process.uptime()
        }
      });
    }, 5000);
  }

  // 获取集群状态
  getClusterStatus() {
    return {
      isShuttingDown: this.isShuttingDown,
      workers: Array.from(this.workers.values()),
      stats: this.stats,
      uptime: Date.now() - this.stats.startTime,
      loadBalancer: this.loadBalancer.getStatus()
    };
  }
}

// 负载均衡器
class LoadBalancer {
  constructor(strategy = 'round-robin') {
    this.strategy = strategy;
    this.workers = new Map();
    this.currentIndex = 0;
  }

  addWorker(workerId, workerInfo) {
    this.workers.set(workerId, workerInfo);
  }

  removeWorker(workerId) {
    this.workers.delete(workerId);
  }

  selectWorker() {
    const workerIds = Array.from(this.workers.keys());
    
    if (workerIds.length === 0) {
      return null;
    }

    switch (this.strategy) {
      case 'round-robin':
        const workerId = workerIds[this.currentIndex % workerIds.length];
        this.currentIndex++;
        return workerId;

      case 'least-connections':
        return this.selectLeastConnections();

      case 'least-memory':
        return this.selectLeastMemory();

      default:
        return workerIds[0];
    }
  }

  selectLeastConnections() {
    let minConnections = Infinity;
    let selectedWorkerId = null;

    for (const [workerId, workerInfo] of this.workers) {
      if (workerInfo.requests < minConnections) {
        minConnections = workerInfo.requests;
        selectedWorkerId = workerId;
      }
    }

    return selectedWorkerId;
  }

  selectLeastMemory() {
    let minMemory = Infinity;
    let selectedWorkerId = null;

    for (const [workerId, workerInfo] of this.workers) {
      if (workerInfo.memory < minMemory) {
        minMemory = workerInfo.memory;
        selectedWorkerId = workerId;
      }
    }

    return selectedWorkerId;
  }

  getStatus() {
    return {
      strategy: this.strategy,
      workers: this.workers.size,
      currentIndex: this.currentIndex
    };
  }
}

module.exports = { AdvancedClusterManager, LoadBalancer };
```

## 🔄 进程间通信和状态管理

### 进程通信管理器

```javascript
// ipc-manager.js
const EventEmitter = require('events');

class IPCManager extends EventEmitter {
  constructor() {
    super();
    this.messageQueue = [];
    this.responseCallbacks = new Map();
    this.messageId = 0;
    this.setupIPC();
  }

  setupIPC() {
    if (process.send) {
      // 工作进程中
      process.on('message', (message) => {
        this.handleMessage(message);
      });
    }
  }

  // 发送消息到主进程或工作进程
  send(type, data, targetWorker = null) {
    const message = {
      id: ++this.messageId,
      type,
      data,
      timestamp: Date.now(),
      from: process.pid
    };

    if (targetWorker) {
      message.target = targetWorker;
    }

    if (process.send) {
      process.send(message);
    } else if (targetWorker && global.cluster) {
      // 主进程向特定工作进程发送消息
      const worker = Object.values(global.cluster.workers)
        .find(w => w.id === targetWorker);
      
      if (worker) {
        worker.send(message);
      }
    }

    return message.id;
  }

  // 发送请求并等待响应
  request(type, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const messageId = this.send(type, data);
      
      const timeoutId = setTimeout(() => {
        this.responseCallbacks.delete(messageId);
        reject(new Error(`请求超时: ${type}`));
      }, timeout);

      this.responseCallbacks.set(messageId, {
        resolve: (response) => {
          clearTimeout(timeoutId);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
    });
  }

  // 响应请求
  respond(originalMessage, data, error = null) {
    const response = {
      id: ++this.messageId,
      type: 'response',
      originalId: originalMessage.id,
      data,
      error,
      timestamp: Date.now(),
      from: process.pid
    };

    if (process.send) {
      process.send(response);
    }
  }

  handleMessage(message) {
    if (message.type === 'response') {
      // 处理响应消息
      const callback = this.responseCallbacks.get(message.originalId);
      if (callback) {
        this.responseCallbacks.delete(message.originalId);
        
        if (message.error) {
          callback.reject(new Error(message.error));
        } else {
          callback.resolve(message.data);
        }
      }
    } else {
      // 发出普通消息事件
      this.emit('message', message);
      this.emit(message.type, message.data, message);
    }
  }

  // 广播消息到所有工作进程
  broadcast(type, data) {
    if (global.cluster && global.cluster.isMaster) {
      const workers = Object.values(global.cluster.workers);
      
      workers.forEach(worker => {
        const message = {
          id: ++this.messageId,
          type,
          data,
          timestamp: Date.now(),
          from: process.pid,
          broadcast: true
        };
        
        worker.send(message);
      });
    }
  }
}

// 状态同步管理器
class StateManager extends EventEmitter {
  constructor() {
    super();
    this.state = new Map();
    this.subscribers = new Set();
    this.ipc = new IPCManager();
    
    this.setupStateSync();
  }

  setupStateSync() {
    this.ipc.on('state:get', (data, message) => {
      const value = this.state.get(data.key);
      this.ipc.respond(message, { key: data.key, value });
    });

    this.ipc.on('state:set', (data, message) => {
      this.setState(data.key, data.value, false); // 不广播，避免循环
      this.ipc.respond(message, { success: true });
    });

    this.ipc.on('state:sync', (data) => {
      // 同步状态更新
      this.setState(data.key, data.value, false);
    });

    this.ipc.on('state:subscribe', (data, message) => {
      this.subscribers.add(data.workerId);
      this.ipc.respond(message, { success: true });
    });
  }

  // 设置状态
  setState(key, value, broadcast = true) {
    const oldValue = this.state.get(key);
    this.state.set(key, value);
    
    this.emit('stateChange', { key, value, oldValue });
    
    if (broadcast) {
      // 广播状态变更
      this.ipc.broadcast('state:sync', { key, value });
    }
  }

  // 获取状态
  getState(key) {
    return this.state.get(key);
  }

  // 获取所有状态
  getAllState() {
    return Object.fromEntries(this.state);
  }

  // 删除状态
  deleteState(key) {
    const value = this.state.get(key);
    this.state.delete(key);
    
    this.emit('stateChange', { key, value: undefined, oldValue: value });
    this.ipc.broadcast('state:sync', { key, value: undefined });
  }

  // 订阅状态变更
  subscribe(callback) {
    this.on('stateChange', callback);
  }

  // 从其他进程获取状态
  async getRemoteState(key, targetWorker) {
    try {
      const response = await this.ipc.request('state:get', { key }, 5000);
      return response.value;
    } catch (error) {
      console.error(`获取远程状态失败: ${key}`, error);
      return undefined;
    }
  }

  // 向其他进程设置状态
  async setRemoteState(key, value, targetWorker) {
    try {
      await this.ipc.request('state:set', { key, value }, 5000);
      return true;
    } catch (error) {
      console.error(`设置远程状态失败: ${key}`, error);
      return false;
    }
  }
}

module.exports = { IPCManager, StateManager };
```

Cluster模块为Node.js提供了强大的多进程能力，通过合理的架构设计可以充分利用多核CPU资源，提升应用性能和可靠性！
