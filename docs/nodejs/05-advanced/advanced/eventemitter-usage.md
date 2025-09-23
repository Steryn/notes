# EventEmitter使用

## 🎯 学习目标

- 深入理解EventEmitter的工作原理
- 掌握事件驱动编程的最佳实践
- 学会自定义EventEmitter和事件管理
- 了解性能优化和内存泄漏防护

## 📚 核心概念

### EventEmitter基础

```javascript
// EventEmitter核心概念
const eventEmitterConcepts = {
  events: {
    description: '事件系统核心',
    characteristics: [
      '异步非阻塞',
      '观察者模式',
      '松耦合架构',
      '事件驱动'
    ]
  },
  listeners: {
    types: {
      once: '一次性监听器',
      on: '持续监听器',
      prependListener: '前置监听器',
      removeListener: '移除监听器'
    },
    lifecycle: ['注册', '触发', '执行', '移除']
  },
  features: {
    maxListeners: '最大监听器数量限制',
    errorHandling: '错误事件处理',
    asyncSupport: '异步事件支持',
    eventCapture: '事件捕获机制'
  }
};

console.log('EventEmitter概念:', eventEmitterConcepts);
```

## 🛠️ 基础EventEmitter使用

### 基本事件操作

```javascript
// basic-event-emitter.js
const EventEmitter = require('events');

class BasicEventDemo extends EventEmitter {
  constructor() {
    super();
    this.setupBasicEvents();
  }

  setupBasicEvents() {
    // 设置最大监听器数量
    this.setMaxListeners(20);

    // 监听错误事件
    this.on('error', (error) => {
      console.error('❌ 事件错误:', error.message);
    });

    // 监听新监听器添加
    this.on('newListener', (event, listener) => {
      console.log(`📝 添加监听器: ${event}`);
    });

    // 监听监听器移除
    this.on('removeListener', (event, listener) => {
      console.log(`🗑️ 移除监听器: ${event}`);
    });
  }

  // 演示基本事件操作
  demonstrateBasicEvents() {
    console.log('🎭 基本事件操作演示...\n');

    // 1. 基本事件监听和触发
    this.on('message', (data) => {
      console.log(`📨 接收消息: ${data}`);
    });

    this.emit('message', 'Hello EventEmitter!');

    // 2. 一次性事件监听
    this.once('startup', (config) => {
      console.log(`🚀 应用启动: ${JSON.stringify(config)}`);
    });

    this.emit('startup', { port: 3000, env: 'development' });
    this.emit('startup', { port: 3000, env: 'development' }); // 不会触发

    // 3. 多个监听器
    this.on('user:login', (user) => {
      console.log(`👤 用户登录: ${user.name}`);
    });

    this.on('user:login', (user) => {
      console.log(`📊 记录登录日志: ${user.id}`);
    });

    this.on('user:login', (user) => {
      console.log(`📧 发送欢迎邮件给: ${user.email}`);
    });

    this.emit('user:login', {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com'
    });

    // 4. 前置监听器
    this.prependListener('order:created', (order) => {
      console.log(`🔍 订单验证: ${order.id}`);
    });

    this.on('order:created', (order) => {
      console.log(`📦 订单处理: ${order.id}`);
    });

    this.emit('order:created', { id: 'ORDER-001', amount: 99.99 });

    // 5. 带参数的复杂事件
    this.on('data:processed', (result, metadata) => {
      console.log(`📊 数据处理完成: ${result.count} 条记录`);
      console.log(`⏱️ 处理时间: ${metadata.duration}ms`);
    });

    this.emit('data:processed', 
      { count: 1000, success: true },
      { duration: 250, memory: '15MB' }
    );
  }

  // 演示监听器管理
  demonstrateListenerManagement() {
    console.log('\n🔧 监听器管理演示...\n');

    // 创建命名函数以便移除
    const messageHandler = (msg) => {
      console.log(`📬 处理消息: ${msg}`);
    };

    const logHandler = (msg) => {
      console.log(`📝 记录日志: ${msg}`);
    };

    // 添加监听器
    this.on('notification', messageHandler);
    this.on('notification', logHandler);

    console.log(`监听器数量: ${this.listenerCount('notification')}`);

    // 触发事件
    this.emit('notification', '测试通知');

    // 移除特定监听器
    this.removeListener('notification', messageHandler);
    console.log(`移除后监听器数量: ${this.listenerCount('notification')}`);

    this.emit('notification', '第二个通知');

    // 移除所有监听器
    this.removeAllListeners('notification');
    console.log(`清空后监听器数量: ${this.listenerCount('notification')}`);

    this.emit('notification', '第三个通知'); // 不会有输出
  }

  // 演示异步事件处理
  async demonstrateAsyncEvents() {
    console.log('\n⚡ 异步事件处理演示...\n');

    // 异步事件处理器
    this.on('async:task', async (task) => {
      console.log(`🔄 开始异步任务: ${task.name}`);
      
      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, task.duration));
      
      console.log(`✅ 异步任务完成: ${task.name}`);
      this.emit('async:task:completed', task);
    });

    this.on('async:task:completed', (task) => {
      console.log(`📋 任务 ${task.name} 已完成，耗时 ${task.duration}ms`);
    });

    // 触发异步事件
    this.emit('async:task', { name: '数据处理', duration: 500 });
    this.emit('async:task', { name: '文件上传', duration: 300 });

    // 等待异步事件完成
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 使用示例
async function demonstrateBasicEventEmitter() {
  const demo = new BasicEventDemo();
  
  demo.demonstrateBasicEvents();
  demo.demonstrateListenerManagement();
  await demo.demonstrateAsyncEvents();
}

module.exports = { BasicEventDemo, demonstrateBasicEventEmitter };
```

### 高级EventEmitter实现

```javascript
// advanced-event-emitter.js
const EventEmitter = require('events');
const { promisify } = require('util');

// 增强型EventEmitter
class EnhancedEventEmitter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableMetrics: options.enableMetrics !== false,
      enableHistory: options.enableHistory !== false,
      historyLimit: options.historyLimit || 100,
      enableAsync: options.enableAsync !== false,
      ...options
    };
    
    // 事件统计
    this.eventMetrics = new Map();
    
    // 事件历史
    this.eventHistory = [];
    
    // 异步事件队列
    this.asyncQueue = [];
    this.processingAsync = false;
    
    this.setupEnhancements();
  }

  setupEnhancements() {
    // 拦截emit方法以添加增强功能
    const originalEmit = this.emit;
    
    this.emit = (event, ...args) => {
      // 记录事件统计
      if (this.options.enableMetrics) {
        this.recordEventMetrics(event);
      }
      
      // 记录事件历史
      if (this.options.enableHistory) {
        this.recordEventHistory(event, args);
      }
      
      return originalEmit.call(this, event, ...args);
    };

    // 拦截on方法以添加监听器统计
    const originalOn = this.on;
    this.on = (event, listener) => {
      const result = originalOn.call(this, event, listener);
      this.updateListenerMetrics(event, 'add');
      return result;
    };

    const originalRemoveListener = this.removeListener;
    this.removeListener = (event, listener) => {
      const result = originalRemoveListener.call(this, event, listener);
      this.updateListenerMetrics(event, 'remove');
      return result;
    };
  }

  // 记录事件统计
  recordEventMetrics(event) {
    if (!this.eventMetrics.has(event)) {
      this.eventMetrics.set(event, {
        count: 0,
        firstEmitted: Date.now(),
        lastEmitted: null,
        listeners: 0
      });
    }
    
    const metrics = this.eventMetrics.get(event);
    metrics.count++;
    metrics.lastEmitted = Date.now();
    metrics.listeners = this.listenerCount(event);
  }

  // 记录事件历史
  recordEventHistory(event, args) {
    const historyEntry = {
      event,
      args: args.length > 0 ? args : undefined,
      timestamp: Date.now(),
      listeners: this.listenerCount(event)
    };
    
    this.eventHistory.push(historyEntry);
    
    // 限制历史记录长度
    if (this.eventHistory.length > this.options.historyLimit) {
      this.eventHistory.shift();
    }
  }

  // 更新监听器统计
  updateListenerMetrics(event, action) {
    if (this.eventMetrics.has(event)) {
      const metrics = this.eventMetrics.get(event);
      metrics.listeners = this.listenerCount(event);
    }
  }

  // 异步事件发射
  emitAsync(event, ...args) {
    return new Promise((resolve, reject) => {
      const listeners = this.listeners(event);
      
      if (listeners.length === 0) {
        resolve([]);
        return;
      }
      
      const promises = listeners.map(listener => {
        try {
          const result = listener(...args);
          return Promise.resolve(result);
        } catch (error) {
          return Promise.reject(error);
        }
      });
      
      Promise.allSettled(promises)
        .then(results => {
          const successful = results.filter(r => r.status === 'fulfilled');
          const failed = results.filter(r => r.status === 'rejected');
          
          if (failed.length > 0) {
            console.warn(`⚠️ ${failed.length} 个监听器执行失败`);
          }
          
          resolve(successful.map(r => r.value));
        })
        .catch(reject);
    });
  }

  // 串行异步事件发射
  async emitAsyncSerial(event, ...args) {
    const listeners = this.listeners(event);
    const results = [];
    
    for (const listener of listeners) {
      try {
        const result = await Promise.resolve(listener(...args));
        results.push(result);
      } catch (error) {
        console.error(`❌ 监听器执行失败:`, error);
        results.push({ error: error.message });
      }
    }
    
    return results;
  }

  // 条件事件发射
  emitIf(condition, event, ...args) {
    if (typeof condition === 'function') {
      if (condition(...args)) {
        return this.emit(event, ...args);
      }
    } else if (condition) {
      return this.emit(event, ...args);
    }
    
    return false;
  }

  // 延迟事件发射
  emitDelayed(delay, event, ...args) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = this.emit(event, ...args);
        resolve(result);
      }, delay);
    });
  }

  // 节流事件发射
  emitThrottled(event, delay = 1000) {
    const throttleKey = `throttle_${event}`;
    
    if (this[throttleKey]) {
      return false;
    }
    
    this[throttleKey] = true;
    
    setTimeout(() => {
      delete this[throttleKey];
    }, delay);
    
    return this.emit(event, ...Array.from(arguments).slice(2));
  }

  // 防抖事件发射
  emitDebounced(event, delay = 1000) {
    const debounceKey = `debounce_${event}`;
    
    if (this[debounceKey]) {
      clearTimeout(this[debounceKey]);
    }
    
    const args = Array.from(arguments).slice(2);
    
    this[debounceKey] = setTimeout(() => {
      this.emit(event, ...args);
      delete this[debounceKey];
    }, delay);
  }

  // 获取事件统计
  getEventMetrics(event) {
    if (event) {
      return this.eventMetrics.get(event) || null;
    }
    
    const summary = {};
    for (const [eventName, metrics] of this.eventMetrics) {
      summary[eventName] = { ...metrics };
    }
    
    return summary;
  }

  // 获取事件历史
  getEventHistory(event, limit) {
    let history = this.eventHistory;
    
    if (event) {
      history = history.filter(entry => entry.event === event);
    }
    
    if (limit && limit > 0) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  // 获取监听器信息
  getListenerInfo() {
    const info = {};
    const events = this.eventNames();
    
    for (const event of events) {
      info[event] = {
        listenerCount: this.listenerCount(event),
        maxListeners: this.getMaxListeners(),
        listeners: this.listeners(event).map(fn => ({
          name: fn.name || 'anonymous',
          isAsync: fn.constructor.name === 'AsyncFunction'
        }))
      };
    }
    
    return info;
  }

  // 清理统计数据
  clearMetrics() {
    this.eventMetrics.clear();
    this.eventHistory = [];
    console.log('📊 事件统计数据已清理');
  }

  // 生成事件报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalEvents: this.eventNames().length,
      totalEmissions: Array.from(this.eventMetrics.values())
        .reduce((sum, metrics) => sum + metrics.count, 0),
      eventMetrics: this.getEventMetrics(),
      listenerInfo: this.getListenerInfo(),
      recentHistory: this.getEventHistory(null, 10)
    };
    
    return report;
  }
}

// 事件总线实现
class EventBus extends EnhancedEventEmitter {
  constructor(options = {}) {
    super(options);
    this.namespaces = new Map();
    this.middlewares = [];
    this.eventFilters = [];
  }

  // 命名空间支持
  namespace(name) {
    if (!this.namespaces.has(name)) {
      const ns = new EnhancedEventEmitter(this.options);
      this.namespaces.set(name, ns);
    }
    
    return this.namespaces.get(name);
  }

  // 添加中间件
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('中间件必须是函数');
    }
    
    this.middlewares.push(middleware);
  }

  // 添加事件过滤器
  addFilter(filter) {
    if (typeof filter !== 'function') {
      throw new TypeError('过滤器必须是函数');
    }
    
    this.eventFilters.push(filter);
  }

  // 重写emit方法以支持中间件和过滤器
  emit(event, ...args) {
    // 应用过滤器
    for (const filter of this.eventFilters) {
      if (!filter(event, ...args)) {
        return false;
      }
    }
    
    // 创建事件上下文
    const context = {
      event,
      args,
      timestamp: Date.now(),
      stopped: false
    };
    
    // 应用中间件
    const runMiddleware = (index) => {
      if (index >= this.middlewares.length || context.stopped) {
        // 所有中间件执行完毕或被停止，发射事件
        return super.emit(event, ...args);
      }
      
      const middleware = this.middlewares[index];
      
      try {
        middleware(context, () => runMiddleware(index + 1));
      } catch (error) {
        console.error('❌ 中间件执行错误:', error);
        return false;
      }
    };
    
    return runMiddleware(0);
  }

  // 全局事件广播
  broadcast(event, ...args) {
    let emitted = super.emit(event, ...args);
    
    // 向所有命名空间广播
    for (const [name, ns] of this.namespaces) {
      try {
        ns.emit(event, ...args);
        emitted = true;
      } catch (error) {
        console.error(`❌ 命名空间 ${name} 广播失败:`, error);
      }
    }
    
    return emitted;
  }
}

// 使用示例
async function demonstrateAdvancedEventEmitter() {
  console.log('🚀 高级EventEmitter演示...\n');

  const enhanced = new EnhancedEventEmitter({
    enableMetrics: true,
    enableHistory: true,
    historyLimit: 50
  });

  // 添加一些监听器
  enhanced.on('user:action', (action, user) => {
    console.log(`👤 用户操作: ${user.name} - ${action}`);
  });

  enhanced.on('user:action', async (action, user) => {
    console.log(`📊 记录用户行为: ${action}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  // 测试各种事件发射方式
  console.log('1. 基本事件发射:');
  enhanced.emit('user:action', 'login', { name: 'Alice', id: 1 });

  console.log('\n2. 异步事件发射:');
  const asyncResults = await enhanced.emitAsync('user:action', 'logout', { name: 'Bob', id: 2 });
  console.log('异步结果:', asyncResults);

  console.log('\n3. 条件事件发射:');
  enhanced.emitIf(true, 'user:action', 'view_profile', { name: 'Charlie', id: 3 });
  enhanced.emitIf(false, 'user:action', 'delete_account', { name: 'David', id: 4 }); // 不会触发

  console.log('\n4. 延迟事件发射:');
  await enhanced.emitDelayed(500, 'user:action', 'update_profile', { name: 'Eve', id: 5 });

  console.log('\n5. 节流事件发射:');
  enhanced.emitThrottled('user:action', 1000, 'rapid_click', { name: 'Frank', id: 6 });
  enhanced.emitThrottled('user:action', 1000, 'rapid_click', { name: 'Grace', id: 7 }); // 被节流

  // 生成报告
  console.log('\n📊 事件统计报告:');
  const report = enhanced.generateReport();
  console.log(JSON.stringify(report, null, 2));

  // 演示事件总线
  console.log('\n🚌 事件总线演示:');
  const eventBus = new EventBus();

  // 添加中间件
  eventBus.use((context, next) => {
    console.log(`🔍 中间件: 处理事件 ${context.event}`);
    next();
  });

  // 添加过滤器
  eventBus.addFilter((event, ...args) => {
    if (event.startsWith('private:')) {
      console.log(`🚫 过滤器: 拒绝私有事件 ${event}`);
      return false;
    }
    return true;
  });

  // 测试事件总线
  eventBus.on('public:message', (msg) => {
    console.log(`📢 公共消息: ${msg}`);
  });

  eventBus.emit('public:message', 'Hello World!');
  eventBus.emit('private:secret', 'This should be filtered'); // 被过滤

  // 命名空间测试
  const userNS = eventBus.namespace('user');
  userNS.on('login', (user) => {
    console.log(`👤 用户命名空间 - 登录: ${user.name}`);
  });

  userNS.emit('login', { name: 'Alice' });
}

module.exports = {
  EnhancedEventEmitter,
  EventBus,
  demonstrateAdvancedEventEmitter
};
```

## 🛡️ 内存泄漏防护和性能优化

### 监听器泄漏检测

```javascript
// memory-leak-protection.js
const EventEmitter = require('events');

class LeakProtectedEventEmitter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxListeners: options.maxListeners || 10,
      warningThreshold: options.warningThreshold || 8,
      leakDetectionInterval: options.leakDetectionInterval || 30000,
      enableLeakDetection: options.enableLeakDetection !== false,
      ...options
    };
    
    // 监听器跟踪
    this.listenerTracking = new Map();
    this.leakWarnings = new Map();
    
    this.setMaxListeners(this.options.maxListeners);
    this.setupLeakDetection();
  }

  setupLeakDetection() {
    if (!this.options.enableLeakDetection) {
      return;
    }

    // 重写监听器添加方法
    const originalOn = this.on;
    const originalOnce = this.once;
    const originalPrependListener = this.prependListener;

    this.on = (event, listener) => {
      this.trackListener(event, listener, 'on');
      return originalOn.call(this, event, listener);
    };

    this.once = (event, listener) => {
      this.trackListener(event, listener, 'once');
      return originalOnce.call(this, event, listener);
    };

    this.prependListener = (event, listener) => {
      this.trackListener(event, listener, 'prepend');
      return originalPrependListener.call(this, event, listener);
    };

    // 重写监听器移除方法
    const originalRemoveListener = this.removeListener;
    const originalRemoveAllListeners = this.removeAllListeners;

    this.removeListener = (event, listener) => {
      this.untrackListener(event, listener);
      return originalRemoveListener.call(this, event, listener);
    };

    this.removeAllListeners = (event) => {
      if (event) {
        this.untrackAllListeners(event);
      } else {
        this.listenerTracking.clear();
      }
      return originalRemoveAllListeners.call(this, event);
    };

    // 定期检测泄漏
    this.leakDetectionTimer = setInterval(() => {
      this.detectLeaks();
    }, this.options.leakDetectionInterval);

    // 监听新监听器添加警告
    this.on('maxListenersExceeded', (event) => {
      console.warn(`⚠️ 事件 "${event}" 监听器数量超过限制 (${this.getMaxListeners()})`);
      this.analyzeListenerLeak(event);
    });
  }

  trackListener(event, listener, type) {
    if (!this.listenerTracking.has(event)) {
      this.listenerTracking.set(event, []);
    }

    const tracking = this.listenerTracking.get(event);
    tracking.push({
      listener,
      type,
      addedAt: Date.now(),
      stackTrace: this.captureStackTrace()
    });

    // 检查是否接近警告阈值
    if (tracking.length >= this.options.warningThreshold) {
      this.warnPotentialLeak(event, tracking.length);
    }
  }

  untrackListener(event, listener) {
    if (!this.listenerTracking.has(event)) {
      return;
    }

    const tracking = this.listenerTracking.get(event);
    const index = tracking.findIndex(item => item.listener === listener);
    
    if (index > -1) {
      tracking.splice(index, 1);
    }

    if (tracking.length === 0) {
      this.listenerTracking.delete(event);
    }
  }

  untrackAllListeners(event) {
    this.listenerTracking.delete(event);
  }

  captureStackTrace() {
    const stack = new Error().stack;
    return stack.split('\n').slice(2, 6).join('\n'); // 保留相关的调用栈
  }

  warnPotentialLeak(event, count) {
    const lastWarning = this.leakWarnings.get(event);
    const now = Date.now();
    
    // 避免频繁警告
    if (lastWarning && now - lastWarning < 60000) {
      return;
    }

    console.warn(`⚠️ 潜在内存泄漏: 事件 "${event}" 有 ${count} 个监听器`);
    this.leakWarnings.set(event, now);
  }

  detectLeaks() {
    const suspiciousEvents = [];

    for (const [event, tracking] of this.listenerTracking) {
      const currentCount = this.listenerCount(event);
      
      // 检查监听器数量是否异常增长
      if (currentCount > this.options.warningThreshold) {
        suspiciousEvents.push({
          event,
          count: currentCount,
          tracking: tracking.length
        });
      }
    }

    if (suspiciousEvents.length > 0) {
      console.warn('🔍 泄漏检测发现可疑事件:');
      suspiciousEvents.forEach(item => {
        console.warn(`  - ${item.event}: ${item.count} 个监听器`);
      });
    }
  }

  analyzeListenerLeak(event) {
    const tracking = this.listenerTracking.get(event) || [];
    
    console.log(`🔬 分析事件 "${event}" 的监听器:`);
    console.log(`  总数: ${tracking.length}`);
    
    // 按类型分组
    const byType = {};
    tracking.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
    });
    
    console.log('  按类型分布:', byType);
    
    // 显示最近添加的监听器
    const recent = tracking
      .slice(-5)
      .map(item => ({
        type: item.type,
        addedAt: new Date(item.addedAt).toISOString(),
        stackTrace: item.stackTrace.split('\n')[0]
      }));
    
    console.log('  最近添加的监听器:');
    recent.forEach((item, index) => {
      console.log(`    ${index + 1}. ${item.type} - ${item.addedAt}`);
      console.log(`       ${item.stackTrace}`);
    });
  }

  // 获取泄漏报告
  getLeakReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalEvents: this.eventNames().length,
      suspiciousEvents: [],
      memoryUsage: process.memoryUsage()
    };

    for (const event of this.eventNames()) {
      const count = this.listenerCount(event);
      if (count > this.options.warningThreshold) {
        const tracking = this.listenerTracking.get(event) || [];
        report.suspiciousEvents.push({
          event,
          listenerCount: count,
          trackingCount: tracking.length,
          types: tracking.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
          }, {})
        });
      }
    }

    return report;
  }

  // 清理资源
  cleanup() {
    if (this.leakDetectionTimer) {
      clearInterval(this.leakDetectionTimer);
      this.leakDetectionTimer = null;
    }

    this.removeAllListeners();
    this.listenerTracking.clear();
    this.leakWarnings.clear();
    
    console.log('🧹 EventEmitter 资源已清理');
  }
}

// 性能优化的EventEmitter
class PerformantEventEmitter extends LeakProtectedEventEmitter {
  constructor(options = {}) {
    super(options);
    
    // 事件缓存
    this.eventCache = new Map();
    this.cacheEnabled = options.enableCache !== false;
    this.cacheSize = options.cacheSize || 100;
    
    // 批处理配置
    this.batchEnabled = options.enableBatch !== false;
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 10;
    this.batchQueue = new Map();
    
    // 性能统计
    this.performanceStats = {
      emitCount: 0,
      totalEmitTime: 0,
      avgEmitTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      batchedEmits: 0
    };
  }

  // 缓存优化的emit
  emit(event, ...args) {
    const startTime = process.hrtime.bigint();
    
    try {
      let result;
      
      if (this.batchEnabled && this.shouldBatch(event)) {
        result = this.addToBatch(event, args);
      } else {
        result = super.emit(event, ...args);
      }
      
      this.updatePerformanceStats(startTime);
      return result;
      
    } catch (error) {
      console.error('❌ 事件发射错误:', error);
      return false;
    }
  }

  shouldBatch(event) {
    // 某些事件适合批处理
    return event.includes('log') || event.includes('metric') || event.includes('track');
  }

  addToBatch(event, args) {
    if (!this.batchQueue.has(event)) {
      this.batchQueue.set(event, []);
    }

    const batch = this.batchQueue.get(event);
    batch.push({ args, timestamp: Date.now() });

    if (batch.length >= this.batchSize) {
      this.flushBatch(event);
    } else {
      // 设置超时刷新
      setTimeout(() => {
        if (this.batchQueue.has(event) && this.batchQueue.get(event).length > 0) {
          this.flushBatch(event);
        }
      }, this.batchTimeout);
    }

    return true;
  }

  flushBatch(event) {
    const batch = this.batchQueue.get(event);
    if (!batch || batch.length === 0) {
      return;
    }

    this.batchQueue.delete(event);
    this.performanceStats.batchedEmits++;

    // 发射批处理事件
    super.emit(`${event}:batch`, batch);
    
    console.log(`📦 批处理事件 ${event}: ${batch.length} 项`);
  }

  updatePerformanceStats(startTime) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // 毫秒

    this.performanceStats.emitCount++;
    this.performanceStats.totalEmitTime += duration;
    this.performanceStats.avgEmitTime = 
      this.performanceStats.totalEmitTime / this.performanceStats.emitCount;
  }

  // 获取性能统计
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      cacheHitRate: this.performanceStats.cacheHits / 
        (this.performanceStats.cacheHits + this.performanceStats.cacheMisses) * 100,
      batchEfficiency: this.performanceStats.batchedEmits / this.performanceStats.emitCount * 100
    };
  }

  // 性能基准测试
  async performanceBenchmark(iterations = 10000) {
    console.log(`🏃 EventEmitter性能基准测试 (${iterations} 次)...`);
    
    // 重置统计
    this.performanceStats = {
      emitCount: 0,
      totalEmitTime: 0,
      avgEmitTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      batchedEmits: 0
    };

    // 添加测试监听器
    this.on('benchmark:test', (data) => {
      // 简单处理
    });

    this.on('benchmark:batch', (batch) => {
      // 批处理
    });

    const startTime = Date.now();

    // 执行基准测试
    for (let i = 0; i < iterations; i++) {
      if (i % 3 === 0) {
        this.emit('benchmark:batch', { id: i, data: `test_${i}` });
      } else {
        this.emit('benchmark:test', { id: i, data: `test_${i}` });
      }
    }

    // 等待批处理完成
    await new Promise(resolve => setTimeout(resolve, 100));

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    const stats = this.getPerformanceStats();
    
    console.log('📊 基准测试结果:');
    console.log(`  总时间: ${totalTime}ms`);
    console.log(`  平均每次发射: ${stats.avgEmitTime.toFixed(4)}ms`);
    console.log(`  吞吐量: ${Math.round(iterations / totalTime * 1000)} events/sec`);
    console.log(`  批处理效率: ${stats.batchEfficiency.toFixed(2)}%`);
    
    return {
      totalTime,
      avgEmitTime: stats.avgEmitTime,
      throughput: Math.round(iterations / totalTime * 1000),
      batchEfficiency: stats.batchEfficiency
    };
  }
}

// 使用示例
async function demonstrateMemoryLeakProtection() {
  console.log('🛡️ 内存泄漏防护演示...\n');

  const protectedEmitter = new LeakProtectedEventEmitter({
    maxListeners: 5,
    warningThreshold: 3,
    leakDetectionInterval: 5000
  });

  // 模拟正常使用
  protectedEmitter.on('normal:event', () => {
    console.log('正常事件处理');
  });

  // 模拟潜在泄漏
  for (let i = 0; i < 7; i++) {
    protectedEmitter.on('potential:leak', () => {
      console.log(`监听器 ${i + 1}`);
    });
  }

  // 触发事件
  protectedEmitter.emit('normal:event');
  protectedEmitter.emit('potential:leak');

  // 等待泄漏检测
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 获取泄漏报告
  const leakReport = protectedEmitter.getLeakReport();
  console.log('\n📋 泄漏检测报告:');
  console.log(JSON.stringify(leakReport, null, 2));

  // 性能测试
  console.log('\n🚀 性能优化测试:');
  const performantEmitter = new PerformantEventEmitter({
    enableBatch: true,
    batchSize: 5,
    batchTimeout: 50
  });

  const benchmarkResult = await performantEmitter.performanceBenchmark(1000);
  
  // 清理资源
  protectedEmitter.cleanup();
  performantEmitter.cleanup();
}

module.exports = {
  LeakProtectedEventEmitter,
  PerformantEventEmitter,
  demonstrateMemoryLeakProtection
};
```

EventEmitter是Node.js事件驱动架构的核心，掌握其高级用法和优化技巧对构建高性能应用至关重要！
