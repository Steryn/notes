# 事件驱动基础

## 🎯 学习目标

- 深入理解事件驱动编程模型的核心概念
- 掌握Node.js事件循环的工作原理
- 学会设计和实现事件驱动架构
- 了解事件驱动系统的最佳实践和性能优化

## 📚 核心概念

### 事件驱动编程模型

```javascript
// 事件驱动编程核心概念
const eventDrivenConcepts = {
  paradigm: {
    description: '基于事件的程序设计范式',
    characteristics: [
      '异步非阻塞',
      '松耦合',
      '高并发',
      '响应式'
    ],
    components: [
      '事件发射器 (Event Emitter)',
      '事件监听器 (Event Listener)', 
      '事件循环 (Event Loop)',
      '回调队列 (Callback Queue)'
    ]
  },
  eventLoop: {
    phases: [
      'Timer Phase - 定时器回调',
      'Pending Callbacks - I/O回调',
      'Idle, Prepare - 内部使用',
      'Poll Phase - 获取新I/O事件',
      'Check Phase - setImmediate回调',
      'Close Callbacks - 关闭回调'
    ],
    queues: [
      'nextTickQueue - process.nextTick',
      'microTaskQueue - Promise',
      'macroTaskQueue - setTimeout/setInterval'
    ]
  },
  patterns: {
    observer: '观察者模式 - 一对多依赖关系',
    publisher: '发布订阅模式 - 解耦发布者和订阅者',
    reactor: '反应器模式 - 事件分发处理',
    proactor: '前摄器模式 - 异步操作完成通知'
  }
};

console.log('事件驱动概念:', eventDrivenConcepts);
```

## 🔄 事件循环深入理解

### 事件循环机制

```javascript
// event-loop-demo.js
class EventLoopDemo {
  constructor() {
    this.demonstrations = [];
  }

  // 演示事件循环各阶段
  demonstrateEventLoopPhases() {
    console.log('🔄 事件循环阶段演示');
    console.log('开始时间:', new Date().toISOString());

    // 1. Timer Phase - setTimeout/setInterval
    setTimeout(() => {
      console.log('1. Timer Phase: setTimeout 0ms');
    }, 0);

    setTimeout(() => {
      console.log('2. Timer Phase: setTimeout 10ms');
    }, 10);

    // 2. setImmediate (Check Phase)
    setImmediate(() => {
      console.log('3. Check Phase: setImmediate');
    });

    // 3. process.nextTick (优先级最高)
    process.nextTick(() => {
      console.log('4. NextTick Queue: process.nextTick');
    });

    // 4. Promise微任务
    Promise.resolve().then(() => {
      console.log('5. MicroTask Queue: Promise.resolve');
    });

    // 5. I/O操作
    const fs = require('fs');
    fs.readFile(__filename, () => {
      console.log('6. Poll Phase: fs.readFile callback');
      
      // 在I/O回调中的执行顺序
      setTimeout(() => {
        console.log('7. Timer in I/O: setTimeout');
      }, 0);
      
      setImmediate(() => {
        console.log('8. Check in I/O: setImmediate');
      });
      
      process.nextTick(() => {
        console.log('9. NextTick in I/O: process.nextTick');
      });
    });

    console.log('10. 同步代码: 立即执行');
  }

  // 演示微任务和宏任务
  demonstrateMicroMacroTasks() {
    console.log('\n📋 微任务和宏任务演示');

    console.log('开始');

    // 宏任务
    setTimeout(() => {
      console.log('宏任务1: setTimeout');
      
      // 宏任务中的微任务
      Promise.resolve().then(() => {
        console.log('宏任务1中的微任务: Promise');
      });
    }, 0);

    // 微任务
    Promise.resolve().then(() => {
      console.log('微任务1: Promise.resolve');
      
      // 微任务中的微任务
      return Promise.resolve();
    }).then(() => {
      console.log('微任务2: 链式Promise');
    });

    // nextTick (微任务，但优先级更高)
    process.nextTick(() => {
      console.log('微任务0: process.nextTick (最高优先级)');
      
      process.nextTick(() => {
        console.log('嵌套的nextTick');
      });
    });

    console.log('同步代码结束');
  }

  // 演示事件循环阻塞
  demonstrateEventLoopBlocking() {
    console.log('\n🚫 事件循环阻塞演示');

    const startTime = Date.now();

    // 非阻塞异步操作
    setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.log(`异步操作完成 (${elapsed}ms 后)`);
    }, 100);

    setImmediate(() => {
      console.log('setImmediate 在阻塞前');
    });

    // 模拟CPU密集型任务阻塞事件循环
    console.log('开始CPU密集型任务...');
    const blockStart = Date.now();
    
    while (Date.now() - blockStart < 200) {
      // 阻塞200ms
    }
    
    console.log('CPU密集型任务完成');

    setImmediate(() => {
      const elapsed = Date.now() - startTime;
      console.log(`setImmediate 在阻塞后 (${elapsed}ms 后)`);
    });
  }

  // 监控事件循环延迟
  monitorEventLoopLag() {
    console.log('\n⏱️ 事件循环延迟监控');

    let measurements = [];
    let measurementCount = 0;
    const maxMeasurements = 10;

    const measureLag = () => {
      const start = process.hrtime.bigint();
      
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // 转换为毫秒
        measurements.push(lag);
        measurementCount++;
        
        console.log(`事件循环延迟: ${lag.toFixed(2)}ms`);
        
        if (measurementCount < maxMeasurements) {
          // 添加一些负载来观察延迟变化
          if (measurementCount === 5) {
            console.log('添加负载...');
            const busyWork = () => {
              const start = Date.now();
              while (Date.now() - start < 50) {
                // 忙等50ms
              }
              
              if (measurementCount < 8) {
                setTimeout(busyWork, 10);
              }
            };
            busyWork();
          }
          
          setTimeout(measureLag, 100);
        } else {
          // 计算统计信息
          const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
          const max = Math.max(...measurements);
          const min = Math.min(...measurements);
          
          console.log('\n📊 延迟统计:');
          console.log(`  平均延迟: ${avg.toFixed(2)}ms`);
          console.log(`  最大延迟: ${max.toFixed(2)}ms`);
          console.log(`  最小延迟: ${min.toFixed(2)}ms`);
        }
      });
    };

    measureLag();
  }

  // 运行所有演示
  async runAllDemonstrations() {
    this.demonstrateEventLoopPhases();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    this.demonstrateMicroMacroTasks();
    
    await new Promise(resolve => setTimeout(resolve, 300));
    this.demonstrateEventLoopBlocking();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    this.monitorEventLoopLag();
  }
}

// 事件循环性能分析器
class EventLoopProfiler {
  constructor(options = {}) {
    this.options = {
      sampleInterval: options.sampleInterval || 100,
      maxSamples: options.maxSamples || 100,
      ...options
    };
    
    this.samples = [];
    this.isRunning = false;
    this.timer = null;
  }

  start() {
    if (this.isRunning) {
      console.warn('性能分析器已在运行');
      return;
    }

    console.log('🔍 启动事件循环性能分析...');
    this.isRunning = true;
    this.samples = [];
    
    this.profileLoop();
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('⏹️ 停止事件循环性能分析');
    this.isRunning = false;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    return this.generateReport();
  }

  profileLoop() {
    if (!this.isRunning) {
      return;
    }

    const startTime = process.hrtime.bigint();
    const startCPU = process.cpuUsage();
    const startMemory = process.memoryUsage();

    setImmediate(() => {
      const endTime = process.hrtime.bigint();
      const endCPU = process.cpuUsage(startCPU);
      const endMemory = process.memoryUsage();
      
      const sample = {
        timestamp: Date.now(),
        eventLoopLag: Number(endTime - startTime) / 1000000, // 毫秒
        cpuUsage: {
          user: endCPU.user / 1000, // 毫秒
          system: endCPU.system / 1000
        },
        memoryUsage: {
          heapUsed: endMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          external: endMemory.external,
          rss: endMemory.rss
        },
        activeHandles: process._getActiveHandles().length,
        activeRequests: process._getActiveRequests().length
      };
      
      this.samples.push(sample);
      
      // 限制样本数量
      if (this.samples.length > this.options.maxSamples) {
        this.samples.shift();
      }
      
      this.emitSample(sample);
      
      // 继续采样
      this.timer = setTimeout(() => this.profileLoop(), this.options.sampleInterval);
    });
  }

  emitSample(sample) {
    // 检查异常情况
    if (sample.eventLoopLag > 50) {
      console.warn(`⚠️ 事件循环延迟过高: ${sample.eventLoopLag.toFixed(2)}ms`);
    }
    
    if (sample.memoryUsage.heapUsed / sample.memoryUsage.heapTotal > 0.9) {
      console.warn(`⚠️ 内存使用率过高: ${(sample.memoryUsage.heapUsed / sample.memoryUsage.heapTotal * 100).toFixed(1)}%`);
    }
  }

  generateReport() {
    if (this.samples.length === 0) {
      return { error: '没有采样数据' };
    }

    const lags = this.samples.map(s => s.eventLoopLag);
    const cpuUser = this.samples.map(s => s.cpuUsage.user);
    const cpuSystem = this.samples.map(s => s.cpuUsage.system);
    const heapUsed = this.samples.map(s => s.memoryUsage.heapUsed);

    const report = {
      duration: this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp,
      sampleCount: this.samples.length,
      eventLoopLag: {
        avg: this.average(lags),
        min: Math.min(...lags),
        max: Math.max(...lags),
        p95: this.percentile(lags, 95),
        p99: this.percentile(lags, 99)
      },
      cpuUsage: {
        avgUser: this.average(cpuUser),
        avgSystem: this.average(cpuSystem),
        maxUser: Math.max(...cpuUser),
        maxSystem: Math.max(...cpuSystem)
      },
      memoryUsage: {
        avgHeapUsed: this.average(heapUsed),
        minHeapUsed: Math.min(...heapUsed),
        maxHeapUsed: Math.max(...heapUsed)
      },
      activeHandles: {
        avg: this.average(this.samples.map(s => s.activeHandles)),
        max: Math.max(...this.samples.map(s => s.activeHandles))
      },
      activeRequests: {
        avg: this.average(this.samples.map(s => s.activeRequests)),
        max: Math.max(...this.samples.map(s => s.activeRequests))
      }
    };

    console.log('\n📊 事件循环性能报告:');
    console.log(`采样时长: ${report.duration}ms`);
    console.log(`采样次数: ${report.sampleCount}`);
    console.log(`平均延迟: ${report.eventLoopLag.avg.toFixed(2)}ms`);
    console.log(`P95延迟: ${report.eventLoopLag.p95.toFixed(2)}ms`);
    console.log(`P99延迟: ${report.eventLoopLag.p99.toFixed(2)}ms`);
    console.log(`最大延迟: ${report.eventLoopLag.max.toFixed(2)}ms`);

    return report;
  }

  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p / 100) - 1;
    return sorted[index];
  }

  getCurrentStats() {
    if (this.samples.length === 0) {
      return null;
    }

    const latest = this.samples[this.samples.length - 1];
    return {
      timestamp: latest.timestamp,
      eventLoopLag: latest.eventLoopLag,
      memoryUsage: latest.memoryUsage,
      activeHandles: latest.activeHandles,
      activeRequests: latest.activeRequests
    };
  }
}

module.exports = {
  EventLoopDemo,
  EventLoopProfiler
};
```

### 事件驱动架构设计

```javascript
// event-driven-architecture.js
const EventEmitter = require('events');

// 事件驱动应用基础框架
class EventDrivenApplication extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxListeners: options.maxListeners || 100,
      errorHandling: options.errorHandling || 'log',
      enableMetrics: options.enableMetrics !== false,
      ...options
    };
    
    this.components = new Map();
    this.eventBus = new EventBus();
    this.metrics = new EventMetrics();
    this.isRunning = false;
    
    this.setupApplication();
  }

  setupApplication() {
    this.setMaxListeners(this.options.maxListeners);
    
    // 全局错误处理
    this.on('error', (error) => {
      this.handleApplicationError(error);
    });
    
    // 组件生命周期事件
    this.on('componentRegistered', (component) => {
      console.log(`📦 组件已注册: ${component.name}`);
    });
    
    this.on('componentStarted', (component) => {
      console.log(`🚀 组件已启动: ${component.name}`);
    });
    
    this.on('componentStopped', (component) => {
      console.log(`⏹️ 组件已停止: ${component.name}`);
    });
  }

  // 注册组件
  registerComponent(name, component) {
    if (this.components.has(name)) {
      throw new Error(`组件 ${name} 已存在`);
    }
    
    // 包装组件以添加生命周期管理
    const wrappedComponent = new ComponentWrapper(name, component, this.eventBus);
    
    this.components.set(name, wrappedComponent);
    this.emit('componentRegistered', { name, component: wrappedComponent });
    
    return wrappedComponent;
  }

  // 启动应用
  async start() {
    if (this.isRunning) {
      console.warn('应用已在运行');
      return;
    }

    console.log('🚀 启动事件驱动应用...');
    this.isRunning = true;

    try {
      // 启动所有组件
      for (const [name, component] of this.components) {
        await component.start();
        this.emit('componentStarted', { name, component });
      }
      
      // 启动事件总线
      this.eventBus.start();
      
      // 启动指标收集
      if (this.options.enableMetrics) {
        this.metrics.start();
      }
      
      this.emit('applicationStarted');
      console.log('✅ 应用启动完成');
      
    } catch (error) {
      console.error('❌ 应用启动失败:', error);
      await this.stop();
      throw error;
    }
  }

  // 停止应用
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('⏹️ 停止事件驱动应用...');
    this.isRunning = false;

    try {
      // 停止指标收集
      this.metrics.stop();
      
      // 停止事件总线
      this.eventBus.stop();
      
      // 停止所有组件
      for (const [name, component] of this.components) {
        await component.stop();
        this.emit('componentStopped', { name, component });
      }
      
      this.emit('applicationStopped');
      console.log('✅ 应用已停止');
      
    } catch (error) {
      console.error('❌ 应用停止时发生错误:', error);
      throw error;
    }
  }

  // 获取组件
  getComponent(name) {
    return this.components.get(name);
  }

  // 发送应用级事件
  publishEvent(eventName, data) {
    this.eventBus.publish(eventName, data);
    
    if (this.options.enableMetrics) {
      this.metrics.recordEvent(eventName);
    }
  }

  // 订阅应用级事件
  subscribeEvent(eventName, handler) {
    return this.eventBus.subscribe(eventName, handler);
  }

  // 处理应用错误
  handleApplicationError(error) {
    console.error('🚨 应用错误:', error);
    
    switch (this.options.errorHandling) {
      case 'throw':
        throw error;
      case 'exit':
        process.exit(1);
      case 'log':
      default:
        // 只记录日志，继续运行
        break;
    }
  }

  // 获取应用状态
  getStatus() {
    const componentStatus = {};
    
    for (const [name, component] of this.components) {
      componentStatus[name] = component.getStatus();
    }
    
    return {
      isRunning: this.isRunning,
      components: componentStatus,
      eventBusStatus: this.eventBus.getStatus(),
      metrics: this.options.enableMetrics ? this.metrics.getStats() : null
    };
  }
}

// 组件包装器
class ComponentWrapper extends EventEmitter {
  constructor(name, component, eventBus) {
    super();
    
    this.name = name;
    this.component = component;
    this.eventBus = eventBus;
    this.status = 'stopped';
    this.startTime = null;
    this.errorCount = 0;
  }

  async start() {
    if (this.status === 'running') {
      return;
    }

    try {
      this.status = 'starting';
      
      // 如果组件有start方法，调用它
      if (typeof this.component.start === 'function') {
        await this.component.start();
      }
      
      // 设置事件转发
      if (this.component instanceof EventEmitter) {
        this.component.on('error', (error) => {
          this.errorCount++;
          this.emit('error', error);
        });
      }
      
      this.status = 'running';
      this.startTime = Date.now();
      
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  async stop() {
    if (this.status === 'stopped') {
      return;
    }

    try {
      this.status = 'stopping';
      
      // 如果组件有stop方法，调用它
      if (typeof this.component.stop === 'function') {
        await this.component.stop();
      }
      
      this.status = 'stopped';
      
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  getStatus() {
    return {
      name: this.name,
      status: this.status,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      errorCount: this.errorCount
    };
  }

  // 代理组件方法
  invoke(methodName, ...args) {
    if (typeof this.component[methodName] === 'function') {
      return this.component[methodName](...args);
    }
    
    throw new Error(`组件 ${this.name} 没有方法 ${methodName}`);
  }
}

// 事件总线
class EventBus extends EventEmitter {
  constructor() {
    super();
    
    this.subscribers = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    console.log('🚌 事件总线已启动');
  }

  stop() {
    this.isRunning = false;
    this.removeAllListeners();
    console.log('🚌 事件总线已停止');
  }

  publish(eventName, data) {
    if (!this.isRunning) {
      console.warn('事件总线未运行，忽略事件:', eventName);
      return;
    }

    const event = {
      name: eventName,
      data: data,
      timestamp: Date.now(),
      id: this.generateEventId()
    };
    
    // 记录事件历史
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    // 发射事件
    this.emit(eventName, event);
    this.emit('*', event); // 通配符事件
    
    console.log(`📡 发布事件: ${eventName}`, data);
  }

  subscribe(eventName, handler) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
    }
    
    this.subscribers.get(eventName).add(handler);
    this.on(eventName, handler);
    
    console.log(`👂 订阅事件: ${eventName}`);
    
    // 返回取消订阅函数
    return () => {
      this.unsubscribe(eventName, handler);
    };
  }

  unsubscribe(eventName, handler) {
    if (this.subscribers.has(eventName)) {
      this.subscribers.get(eventName).delete(handler);
      this.removeListener(eventName, handler);
    }
  }

  generateEventId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      subscriberCount: this.subscribers.size,
      eventHistorySize: this.eventHistory.length,
      recentEvents: this.eventHistory.slice(-5)
    };
  }
}

// 事件指标收集器
class EventMetrics extends EventEmitter {
  constructor() {
    super();
    
    this.eventCounts = new Map();
    this.eventTimings = new Map();
    this.startTime = null;
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.startTime = Date.now();
    console.log('📊 事件指标收集已启动');
  }

  stop() {
    this.isRunning = false;
    console.log('📊 事件指标收集已停止');
  }

  recordEvent(eventName) {
    if (!this.isRunning) return;

    // 记录事件计数
    const count = this.eventCounts.get(eventName) || 0;
    this.eventCounts.set(eventName, count + 1);
    
    // 记录事件时间
    if (!this.eventTimings.has(eventName)) {
      this.eventTimings.set(eventName, []);
    }
    
    this.eventTimings.get(eventName).push(Date.now());
  }

  getStats() {
    const uptime = this.startTime ? Date.now() - this.startTime : 0;
    const totalEvents = Array.from(this.eventCounts.values()).reduce((sum, count) => sum + count, 0);
    
    const eventStats = {};
    for (const [eventName, count] of this.eventCounts) {
      eventStats[eventName] = {
        count: count,
        rate: count / (uptime / 1000) // 每秒事件数
      };
    }
    
    return {
      uptime: uptime,
      totalEvents: totalEvents,
      eventsPerSecond: totalEvents / (uptime / 1000),
      eventTypes: this.eventCounts.size,
      eventStats: eventStats
    };
  }
}

module.exports = {
  EventDrivenApplication,
  ComponentWrapper,
  EventBus,
  EventMetrics
};
```

## 🎯 实际应用示例

### Web服务器事件驱动架构

```javascript
// web-server-example.js
const http = require('http');
const { EventDrivenApplication } = require('./event-driven-architecture');

// HTTP服务器组件
class HTTPServerComponent {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.server = null;
    this.requestCount = 0;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`🌐 HTTP服务器启动在端口 ${this.port}`);
          resolve();
        }
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('🌐 HTTP服务器已关闭');
          resolve();
        });
      });
    }
  }

  handleRequest(req, res) {
    this.requestCount++;
    
    // 发射请求事件
    global.app.publishEvent('http:request', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      timestamp: Date.now()
    });

    // 简单的路由处理
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', requests: this.requestCount }));
    } else if (req.url === '/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(global.app.getStatus()));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }

    // 发射响应事件
    global.app.publishEvent('http:response', {
      statusCode: res.statusCode,
      method: req.method,
      url: req.url,
      duration: Date.now() - Date.now()
    });
  }
}

// 日志组件
class LoggerComponent {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
  }

  async start() {
    // 订阅所有HTTP事件
    global.app.subscribeEvent('http:request', (event) => {
      this.log('INFO', `HTTP请求: ${event.data.method} ${event.data.url}`);
    });

    global.app.subscribeEvent('http:response', (event) => {
      this.log('INFO', `HTTP响应: ${event.data.statusCode} ${event.data.method} ${event.data.url}`);
    });

    console.log('📝 日志组件已启动');
  }

  async stop() {
    console.log('📝 日志组件已停止');
  }

  log(level, message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message
    };

    this.logs.push(logEntry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.log(`[${logEntry.timestamp}] ${level}: ${message}`);
  }

  getLogs() {
    return this.logs;
  }
}

// 监控组件
class MonitoringComponent {
  constructor() {
    this.metrics = {
      requests: 0,
      responses: 0,
      errors: 0
    };
  }

  async start() {
    global.app.subscribeEvent('http:request', () => {
      this.metrics.requests++;
    });

    global.app.subscribeEvent('http:response', (event) => {
      this.metrics.responses++;
      
      if (event.data.statusCode >= 400) {
        this.metrics.errors++;
      }
    });

    // 定期报告指标
    this.reportInterval = setInterval(() => {
      this.reportMetrics();
    }, 30000);

    console.log('📊 监控组件已启动');
  }

  async stop() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    console.log('📊 监控组件已停止');
  }

  reportMetrics() {
    console.log('\n📈 系统指标报告:');
    console.log(`  请求总数: ${this.metrics.requests}`);
    console.log(`  响应总数: ${this.metrics.responses}`);
    console.log(`  错误总数: ${this.metrics.errors}`);
    console.log(`  错误率: ${(this.metrics.errors / this.metrics.responses * 100).toFixed(2)}%\n`);
  }

  getMetrics() {
    return this.metrics;
  }
}

// 启动应用示例
async function startWebServerExample() {
  console.log('🚀 启动Web服务器事件驱动示例...\n');

  // 创建应用
  const app = new EventDrivenApplication({
    enableMetrics: true,
    errorHandling: 'log'
  });
  
  global.app = app; // 为了组件间通信

  // 注册组件
  app.registerComponent('http-server', new HTTPServerComponent({ port: 3000 }));
  app.registerComponent('logger', new LoggerComponent());
  app.registerComponent('monitoring', new MonitoringComponent());

  try {
    // 启动应用
    await app.start();
    
    console.log('\n✅ Web服务器已启动');
    console.log('🌐 访问 http://localhost:3000/health 检查健康状态');
    console.log('📊 访问 http://localhost:3000/stats 查看统计信息');
    console.log('按 Ctrl+C 停止服务器\n');

    // 优雅关闭处理
    process.on('SIGINT', async () => {
      console.log('\n🔄 收到关闭信号，正在优雅关闭...');
      await app.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  startWebServerExample();
}

module.exports = {
  HTTPServerComponent,
  LoggerComponent,
  MonitoringComponent,
  startWebServerExample
};
```

事件驱动编程是Node.js的核心特性，掌握其原理和实践对构建高性能、可扩展的应用系统至关重要！
