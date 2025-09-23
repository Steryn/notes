# 内存管理

## 🎯 学习目标

- 深入理解Node.js内存管理机制
- 掌握内存泄漏的识别和防护
- 学会内存优化技巧和策略
- 了解V8内存分配和回收原理

## 📚 核心概念

### Node.js内存结构

```javascript
// Node.js内存布局
const memoryLayout = {
  heap: {
    newSpace: '新生代内存空间 (1-8MB)',
    oldSpace: '老生代内存空间 (可扩展)',
    largeObjectSpace: '大对象空间 (>512KB)',
    codeSpace: '代码空间',
    mapSpace: 'Map空间'
  },
  stack: '调用栈',
  buffer: 'Buffer内存 (堆外内存)',
  external: '外部内存 (C++ Addons)'
};

// 查看当前内存使用情况
function displayMemoryUsage() {
  const usage = process.memoryUsage();
  
  console.log('📊 内存使用情况:');
  console.log(`  RSS: ${formatBytes(usage.rss)} (常驻集大小)`);
  console.log(`  堆已用: ${formatBytes(usage.heapUsed)} / ${formatBytes(usage.heapTotal)}`);
  console.log(`  外部内存: ${formatBytes(usage.external)}`);
  console.log(`  数组缓冲区: ${formatBytes(usage.arrayBuffers || 0)}`);
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// 定期监控内存使用
setInterval(displayMemoryUsage, 5000);
```

### 内存分配机制

```javascript
// 内存分配示例和监控
class MemoryAllocationMonitor {
  constructor() {
    this.allocations = [];
    this.startTime = Date.now();
    this.baseline = process.memoryUsage();
  }

  trackAllocation(name, allocateFunction) {
    const beforeAllocation = process.memoryUsage();
    
    console.log(`🔄 执行内存分配: ${name}`);
    
    const startTime = process.hrtime.bigint();
    const result = allocateFunction();
    const endTime = process.hrtime.bigint();
    
    const afterAllocation = process.memoryUsage();
    const allocationTime = Number(endTime - startTime) / 1000000; // 毫秒
    
    const allocation = {
      name,
      timestamp: Date.now(),
      duration: allocationTime,
      memoryDelta: {
        heapUsed: afterAllocation.heapUsed - beforeAllocation.heapUsed,
        heapTotal: afterAllocation.heapTotal - beforeAllocation.heapTotal,
        external: afterAllocation.external - beforeAllocation.external
      },
      memoryAfter: afterAllocation
    };
    
    this.allocations.push(allocation);
    
    console.log(`  📈 堆内存增加: ${formatBytes(allocation.memoryDelta.heapUsed)}`);
    console.log(`  ⏱️ 分配时间: ${allocationTime.toFixed(2)}ms`);
    
    return result;
  }

  // 测试不同类型的内存分配
  demonstrateAllocations() {
    console.log('🧪 演示不同类型的内存分配...\n');

    // 1. 小对象分配（新生代）
    this.trackAllocation('小对象数组', () => {
      const objects = [];
      for (let i = 0; i < 100000; i++) {
        objects.push({ id: i, name: `object_${i}`, value: Math.random() });
      }
      return objects;
    });

    // 2. 大对象分配（直接进入老生代）
    this.trackAllocation('大数组', () => {
      return new Array(1000000).fill(0).map((_, i) => ({ index: i }));
    });

    // 3. Buffer分配（堆外内存）
    this.trackAllocation('Buffer分配', () => {
      const buffers = [];
      for (let i = 0; i < 100; i++) {
        buffers.push(Buffer.alloc(1024 * 1024)); // 1MB Buffer
      }
      return buffers;
    });

    // 4. 字符串分配
    this.trackAllocation('大字符串', () => {
      const strings = [];
      for (let i = 0; i < 10000; i++) {
        strings.push('x'.repeat(1000)); // 1KB字符串
      }
      return strings;
    });

    // 5. 函数和闭包
    this.trackAllocation('闭包创建', () => {
      const closures = [];
      for (let i = 0; i < 10000; i++) {
        const data = { value: i };
        closures.push(() => data.value * 2);
      }
      return closures;
    });
  }

  generateReport() {
    const totalAllocations = this.allocations.length;
    const totalHeapIncrease = this.allocations.reduce(
      (sum, alloc) => sum + alloc.memoryDelta.heapUsed, 0
    );
    const totalTime = this.allocations.reduce(
      (sum, alloc) => sum + alloc.duration, 0
    );

    return {
      summary: {
        totalAllocations,
        totalHeapIncrease: formatBytes(totalHeapIncrease),
        totalTime: totalTime.toFixed(2),
        averageAllocationTime: (totalTime / totalAllocations).toFixed(2)
      },
      allocations: this.allocations,
      currentMemory: process.memoryUsage()
    };
  }
}

// 使用示例
const monitor = new MemoryAllocationMonitor();
monitor.demonstrateAllocations();

setTimeout(() => {
  const report = monitor.generateReport();
  console.log('\n📊 内存分配报告:', JSON.stringify(report.summary, null, 2));
}, 1000);
```

## 🔍 内存泄漏检测

### 常见内存泄漏模式

```javascript
// 内存泄漏检测和预防
class MemoryLeakDetector {
  constructor() {
    this.references = new WeakMap();
    this.listeners = new Map();
    this.timers = new Set();
    this.intervals = new Set();
    this.streams = new Set();
  }

  // 1. 事件监听器泄漏检测
  detectEventListenerLeaks() {
    console.log('🔍 检测事件监听器泄漏...');
    
    const EventEmitter = require('events');
    const originalAddListener = EventEmitter.prototype.addListener;
    const originalRemoveListener = EventEmitter.prototype.removeListener;
    
    EventEmitter.prototype.addListener = function(event, listener) {
      const emitterId = this.constructor.name || 'EventEmitter';
      const key = `${emitterId}:${event}`;
      
      if (!this.listeners) {
        this.listeners = new Map();
      }
      
      const count = this.listeners.get(key) || 0;
      this.listeners.set(key, count + 1);
      
      // 警告：监听器过多
      if (count > 10) {
        console.warn(`⚠️ 可能的内存泄漏: ${key} 有 ${count} 个监听器`);
      }
      
      return originalAddListener.call(this, event, listener);
    };
    
    EventEmitter.prototype.removeListener = function(event, listener) {
      const emitterId = this.constructor.name || 'EventEmitter';
      const key = `${emitterId}:${event}`;
      
      if (this.listeners) {
        const count = this.listeners.get(key) || 0;
        if (count > 0) {
          this.listeners.set(key, count - 1);
        }
      }
      
      return originalRemoveListener.call(this, event, listener);
    };
  }

  // 2. 定时器泄漏检测
  detectTimerLeaks() {
    console.log('🔍 检测定时器泄漏...');
    
    const originalSetTimeout = global.setTimeout;
    const originalSetInterval = global.setInterval;
    const originalClearTimeout = global.clearTimeout;
    const originalClearInterval = global.clearInterval;
    
    global.setTimeout = (callback, delay, ...args) => {
      const id = originalSetTimeout(callback, delay, ...args);
      this.timers.add(id);
      
      // 自动清理长时间的定时器
      if (delay > 300000) { // 5分钟
        console.warn(`⚠️ 长时间定时器: ${delay}ms, ID: ${id}`);
      }
      
      return id;
    };
    
    global.setInterval = (callback, delay, ...args) => {
      const id = originalSetInterval(callback, delay, ...args);
      this.intervals.add(id);
      
      console.log(`📝 创建间隔定时器: ${delay}ms, ID: ${id}`);
      return id;
    };
    
    global.clearTimeout = (id) => {
      this.timers.delete(id);
      return originalClearTimeout(id);
    };
    
    global.clearInterval = (id) => {
      this.intervals.delete(id);
      return originalClearInterval(id);
    };
  }

  // 3. 闭包引用泄漏检测
  detectClosureLeaks() {
    console.log('🔍 检测闭包引用泄漏...');
    
    // 示例：容易造成内存泄漏的闭包
    const leakyClosureExample = () => {
      const largeData = new Array(1000000).fill('data'); // 大对象
      
      // 问题：即使只需要index，整个largeData都被引用
      return {
        getIndex: (i) => i,
        // largeData被闭包引用，无法被GC
        getData: () => largeData[0]
      };
    };
    
    // 修复：避免不必要的引用
    const fixedClosureExample = () => {
      const largeData = new Array(1000000).fill('data');
      const firstItem = largeData[0]; // 只保留需要的数据
      
      return {
        getIndex: (i) => i,
        getData: () => firstItem // 只引用需要的数据
      };
    };
    
    return { leakyClosureExample, fixedClosureExample };
  }

  // 4. DOM引用泄漏检测（Node.js环境模拟）
  detectDOMLeaks() {
    console.log('🔍 检测DOM引用泄漏...');
    
    // 模拟DOM节点
    class MockDOMNode {
      constructor(tagName) {
        this.tagName = tagName;
        this.children = [];
        this.parent = null;
        this.listeners = new Map();
      }
      
      appendChild(child) {
        child.parent = this;
        this.children.push(child);
      }
      
      removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
          this.children.splice(index, 1);
          child.parent = null;
        }
      }
      
      addEventListener(event, listener) {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event).push(listener);
      }
      
      removeEventListener(event, listener) {
        if (this.listeners.has(event)) {
          const listeners = this.listeners.get(event);
          const index = listeners.indexOf(listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }
      }
    }
    
    // 内存泄漏示例：忘记清理事件监听器
    const createLeakyComponent = () => {
      const element = new MockDOMNode('div');
      const data = new Array(100000).fill('data');
      
      const handler = () => {
        console.log(data.length); // 引用了大数据
      };
      
      element.addEventListener('click', handler);
      
      // 问题：没有清理事件监听器
      return element;
    };
    
    // 修复：正确清理资源
    const createFixedComponent = () => {
      const element = new MockDOMNode('div');
      const data = new Array(100000).fill('data');
      
      const handler = () => {
        console.log(data.length);
      };
      
      element.addEventListener('click', handler);
      
      // 提供清理方法
      element.cleanup = () => {
        element.removeEventListener('click', handler);
        element.children.length = 0;
        element.parent = null;
      };
      
      return element;
    };
    
    return { createLeakyComponent, createFixedComponent };
  }

  // 5. 循环引用检测
  detectCircularReferences() {
    console.log('🔍 检测循环引用...');
    
    // 循环引用示例
    const createCircularReference = () => {
      const obj1 = { name: 'obj1' };
      const obj2 = { name: 'obj2' };
      
      obj1.ref = obj2;
      obj2.ref = obj1; // 循环引用
      
      return { obj1, obj2 };
    };
    
    // 检测循环引用的工具
    const hasCircularReference = (obj, seen = new WeakSet()) => {
      if (obj === null || typeof obj !== 'object') {
        return false;
      }
      
      if (seen.has(obj)) {
        return true; // 发现循环引用
      }
      
      seen.add(obj);
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (hasCircularReference(obj[key], seen)) {
            return true;
          }
        }
      }
      
      seen.delete(obj);
      return false;
    };
    
    // 测试
    const circular = createCircularReference();
    const hasCircular = hasCircularReference(circular.obj1);
    
    console.log(`循环引用检测结果: ${hasCircular ? '发现循环引用' : '无循环引用'}`);
    
    return { createCircularReference, hasCircularReference };
  }

  // 综合内存泄漏检测报告
  generateLeakReport() {
    const report = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      activeTimers: this.timers.size,
      activeIntervals: this.intervals.size,
      activeStreams: this.streams.size,
      warnings: []
    };
    
    // 检查活跃的定时器
    if (this.timers.size > 10) {
      report.warnings.push({
        type: 'timers',
        message: `发现 ${this.timers.size} 个活跃定时器，可能存在泄漏`
      });
    }
    
    // 检查活跃的间隔定时器
    if (this.intervals.size > 5) {
      report.warnings.push({
        type: 'intervals',
        message: `发现 ${this.intervals.size} 个活跃间隔定时器，可能存在泄漏`
      });
    }
    
    // 检查内存使用趋势
    const heapUsedMB = report.memory.heapUsed / 1024 / 1024;
    if (heapUsedMB > 100) {
      report.warnings.push({
        type: 'memory',
        message: `堆内存使用量较高: ${heapUsedMB.toFixed(2)}MB`
      });
    }
    
    return report;
  }

  // 清理所有追踪的资源
  cleanup() {
    console.log('🧹 清理检测器资源...');
    
    // 清理定时器
    for (const timerId of this.timers) {
      clearTimeout(timerId);
    }
    this.timers.clear();
    
    // 清理间隔定时器
    for (const intervalId of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
    
    // 清理流
    for (const stream of this.streams) {
      if (stream && typeof stream.destroy === 'function') {
        stream.destroy();
      }
    }
    this.streams.clear();
    
    console.log('✅ 清理完成');
  }
}

// 使用示例
const leakDetector = new MemoryLeakDetector();

// 启用所有检测
leakDetector.detectEventListenerLeaks();
leakDetector.detectTimerLeaks();
leakDetector.detectClosureLeaks();
leakDetector.detectDOMLeaks();
leakDetector.detectCircularReferences();

// 定期生成泄漏报告
const reportInterval = setInterval(() => {
  const report = leakDetector.generateLeakReport();
  
  if (report.warnings.length > 0) {
    console.log('⚠️ 内存泄漏警告:');
    report.warnings.forEach(warning => {
      console.log(`  - ${warning.type}: ${warning.message}`);
    });
  }
}, 10000);

// 程序退出时清理
process.on('SIGINT', () => {
  clearInterval(reportInterval);
  leakDetector.cleanup();
  process.exit(0);
});
```

## 🛠️ 内存优化策略

### 对象池和重用

```javascript
// 对象池实现
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.created = 0;
    this.reused = 0;
    
    // 预分配对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
      this.created++;
    }
  }
  
  acquire() {
    if (this.pool.length > 0) {
      const obj = this.pool.pop();
      this.reused++;
      return obj;
    }
    
    // 池空了，创建新对象
    this.created++;
    return this.createFn();
  }
  
  release(obj) {
    if (this.resetFn) {
      this.resetFn(obj);
    }
    this.pool.push(obj);
  }
  
  getStats() {
    return {
      poolSize: this.pool.length,
      created: this.created,
      reused: this.reused,
      reuseRatio: this.reused / (this.created + this.reused)
    };
  }
}

// 使用示例：HTTP请求对象池
class HTTPRequestPool {
  constructor() {
    this.pool = new ObjectPool(
      () => ({
        url: '',
        method: 'GET',
        headers: {},
        body: null,
        timestamp: 0
      }),
      (obj) => {
        obj.url = '';
        obj.method = 'GET';
        obj.headers = {};
        obj.body = null;
        obj.timestamp = 0;
      },
      50
    );
  }
  
  createRequest(url, method = 'GET', headers = {}, body = null) {
    const request = this.pool.acquire();
    
    request.url = url;
    request.method = method;
    request.headers = { ...headers };
    request.body = body;
    request.timestamp = Date.now();
    
    return request;
  }
  
  releaseRequest(request) {
    this.pool.release(request);
  }
  
  getPoolStats() {
    return this.pool.getStats();
  }
}

// 性能测试
const testObjectPool = () => {
  const requestPool = new HTTPRequestPool();
  const startTime = process.hrtime.bigint();
  const iterations = 100000;
  
  console.log(`🧪 测试对象池性能 (${iterations} 次迭代)...`);
  
  // 使用对象池
  for (let i = 0; i < iterations; i++) {
    const request = requestPool.createRequest(
      `https://api.example.com/users/${i}`,
      'GET',
      { 'Content-Type': 'application/json' }
    );
    
    // 模拟使用请求对象
    // ... 处理请求 ...
    
    requestPool.releaseRequest(request);
  }
  
  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1000000;
  
  console.log(`⏱️ 对象池测试完成: ${duration.toFixed(2)}ms`);
  console.log('📊 对象池统计:', requestPool.getPoolStats());
};

testObjectPool();
```

### 内存监控和告警

```javascript
// 内存监控系统
class MemoryMonitor {
  constructor(options = {}) {
    this.thresholds = {
      heapUsed: options.heapUsedThreshold || 100 * 1024 * 1024, // 100MB
      heapTotal: options.heapTotalThreshold || 200 * 1024 * 1024, // 200MB
      external: options.externalThreshold || 50 * 1024 * 1024, // 50MB
      rss: options.rssThreshold || 300 * 1024 * 1024 // 300MB
    };
    
    this.history = [];
    this.alerts = [];
    this.isMonitoring = false;
    this.monitorInterval = null;
  }
  
  startMonitoring(intervalMs = 5000) {
    if (this.isMonitoring) {
      console.log('⚠️ 内存监控已在运行');
      return;
    }
    
    console.log(`📊 开始内存监控 (间隔: ${intervalMs}ms)`);
    this.isMonitoring = true;
    
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
    
    // 立即收集一次
    this.collectMetrics();
  }
  
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }
    
    console.log('⏹️ 停止内存监控');
    this.isMonitoring = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }
  
  collectMetrics() {
    const usage = process.memoryUsage();
    const timestamp = Date.now();
    
    const metrics = {
      timestamp,
      ...usage,
      formattedUsage: {
        heapUsed: formatBytes(usage.heapUsed),
        heapTotal: formatBytes(usage.heapTotal),
        external: formatBytes(usage.external),
        rss: formatBytes(usage.rss)
      }
    };
    
    this.history.push(metrics);
    
    // 保持历史记录在合理范围内
    if (this.history.length > 1000) {
      this.history = this.history.slice(-500);
    }
    
    // 检查阈值
    this.checkThresholds(metrics);
    
    // 检查内存趋势
    this.checkMemoryTrend();
    
    return metrics;
  }
  
  checkThresholds(metrics) {
    const alerts = [];
    
    // 检查各项内存指标
    Object.keys(this.thresholds).forEach(key => {
      if (metrics[key] > this.thresholds[key]) {
        alerts.push({
          type: 'threshold_exceeded',
          metric: key,
          current: metrics[key],
          threshold: this.thresholds[key],
          formatted: {
            current: formatBytes(metrics[key]),
            threshold: formatBytes(this.thresholds[key])
          },
          timestamp: metrics.timestamp
        });
      }
    });
    
    // 发送告警
    alerts.forEach(alert => {
      this.sendAlert(alert);
    });
  }
  
  checkMemoryTrend() {
    if (this.history.length < 10) return;
    
    // 获取最近10个数据点
    const recent = this.history.slice(-10);
    const trend = this.calculateTrend(recent.map(h => h.heapUsed));
    
    // 如果内存持续增长超过10MB
    if (trend > 10 * 1024 * 1024) {
      this.sendAlert({
        type: 'memory_leak_suspected',
        trend: formatBytes(trend),
        message: '检测到内存持续增长，可能存在内存泄漏',
        timestamp: Date.now()
      });
    }
  }
  
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }
  
  sendAlert(alert) {
    this.alerts.push(alert);
    
    // 控制台输出
    switch (alert.type) {
      case 'threshold_exceeded':
        console.warn(`🚨 内存阈值超限: ${alert.metric} = ${alert.formatted.current} (阈值: ${alert.formatted.threshold})`);
        break;
      case 'memory_leak_suspected':
        console.warn(`🚨 疑似内存泄漏: 内存趋势 +${alert.trend}`);
        break;
    }
    
    // 这里可以集成外部告警系统
    // this.sendToExternalAlertSystem(alert);
  }
  
  forceGC() {
    if (global.gc) {
      console.log('🗑️ 强制执行垃圾收集...');
      const before = process.memoryUsage();
      
      global.gc();
      
      const after = process.memoryUsage();
      const freed = before.heapUsed - after.heapUsed;
      
      console.log(`✅ GC完成，释放内存: ${formatBytes(freed)}`);
      
      return {
        before,
        after,
        freed
      };
    } else {
      console.warn('⚠️ 垃圾收集不可用，请使用 --expose-gc 启动Node.js');
      return null;
    }
  }
  
  getMemoryReport() {
    const current = process.memoryUsage();
    const history = this.history.slice(-20); // 最近20个数据点
    
    return {
      current: {
        ...current,
        formatted: {
          heapUsed: formatBytes(current.heapUsed),
          heapTotal: formatBytes(current.heapTotal),
          external: formatBytes(current.external),
          rss: formatBytes(current.rss)
        }
      },
      thresholds: Object.keys(this.thresholds).reduce((acc, key) => {
        acc[key] = {
          value: this.thresholds[key],
          formatted: formatBytes(this.thresholds[key]),
          status: current[key] > this.thresholds[key] ? 'exceeded' : 'normal'
        };
        return acc;
      }, {}),
      history,
      alerts: this.alerts.slice(-10), // 最近10个告警
      trend: this.history.length >= 10 ? {
        heapUsed: this.calculateTrend(this.history.slice(-10).map(h => h.heapUsed)),
        rss: this.calculateTrend(this.history.slice(-10).map(h => h.rss))
      } : null,
      recommendations: this.generateRecommendations(current)
    };
  }
  
  generateRecommendations(current) {
    const recommendations = [];
    
    // 堆内存建议
    const heapUsageRatio = current.heapUsed / current.heapTotal;
    if (heapUsageRatio > 0.8) {
      recommendations.push({
        type: 'heap_usage',
        severity: 'high',
        message: '堆内存使用率超过80%，建议优化内存使用或增加堆大小'
      });
    }
    
    // 外部内存建议
    if (current.external > 50 * 1024 * 1024) {
      recommendations.push({
        type: 'external_memory',
        severity: 'medium',
        message: '外部内存使用较高，检查Buffer和C++插件的内存使用'
      });
    }
    
    // RSS建议
    if (current.rss > current.heapTotal * 2) {
      recommendations.push({
        type: 'rss',
        severity: 'medium',
        message: 'RSS远大于堆大小，可能存在内存碎片或外部内存泄漏'
      });
    }
    
    return recommendations;
  }
}

// 使用示例
const memoryMonitor = new MemoryMonitor({
  heapUsedThreshold: 50 * 1024 * 1024, // 50MB
  rssThreshold: 150 * 1024 * 1024 // 150MB
});

// 启动监控
memoryMonitor.startMonitoring(3000);

// 模拟内存使用
const simulateMemoryUsage = () => {
  const data = [];
  
  const interval = setInterval(() => {
    // 分配内存
    data.push(new Array(10000).fill('data'));
    
    // 随机释放一些内存
    if (Math.random() > 0.7 && data.length > 100) {
      data.splice(0, 50);
    }
    
    console.log(`📈 当前数据数组长度: ${data.length}`);
    
  }, 2000);
  
  // 10秒后停止模拟
  setTimeout(() => {
    clearInterval(interval);
    
    // 生成最终报告
    const report = memoryMonitor.getMemoryReport();
    console.log('\n📊 内存监控报告:');
    console.log('当前内存:', report.current.formatted);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 建议:');
      report.recommendations.forEach(rec => {
        console.log(`  - ${rec.severity.toUpperCase()}: ${rec.message}`);
      });
    }
    
    // 停止监控
    memoryMonitor.stopMonitoring();
    
  }, 30000);
};

// 启动模拟
setTimeout(simulateMemoryUsage, 2000);
```

Node.js内存管理是性能优化的关键，通过合理的监控和优化策略可以有效避免内存泄漏和性能问题！
