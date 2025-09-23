# 性能优化

## 🎯 学习目标

- 掌握Node.js性能分析方法
- 学会识别和解决性能瓶颈
- 理解各种优化策略和技巧
- 掌握性能监控和调优工具

## 📚 核心概念

### 性能分析基础

```javascript
// 性能分析工具集
class PerformanceAnalyzer {
  constructor() {
    this.metrics = {
      cpuUsage: [],
      memoryUsage: [],
      eventLoopLag: [],
      requestLatency: [],
      throughput: []
    };
    
    this.benchmarks = new Map();
    this.profilers = new Map();
    this.isMonitoring = false;
  }

  // CPU使用率监控
  monitorCPUUsage() {
    const startUsage = process.cpuUsage();
    const startTime = process.hrtime.bigint();
    
    return () => {
      const endUsage = process.cpuUsage(startUsage);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // 毫秒
      
      const cpuPercent = {
        user: (endUsage.user / 1000) / duration * 100,
        system: (endUsage.system / 1000) / duration * 100
      };
      
      cpuPercent.total = cpuPercent.user + cpuPercent.system;
      
      this.metrics.cpuUsage.push({
        timestamp: Date.now(),
        ...cpuPercent,
        duration
      });
      
      return cpuPercent;
    };
  }

  // 事件循环延迟监控
  monitorEventLoopLag() {
    const start = process.hrtime.bigint();
    
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // 毫秒
      
      this.metrics.eventLoopLag.push({
        timestamp: Date.now(),
        lag
      });
      
      if (lag > 10) {
        console.warn(`⚠️ 事件循环延迟: ${lag.toFixed(2)}ms`);
      }
    });
  }

  // 内存使用监控
  monitorMemoryUsage() {
    const usage = process.memoryUsage();
    
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      ...usage,
      heapUsedMB: usage.heapUsed / 1024 / 1024,
      heapTotalMB: usage.heapTotal / 1024 / 1024,
      externalMB: usage.external / 1024 / 1024
    });
    
    return usage;
  }

  // 开始综合性能监控
  startMonitoring(interval = 1000) {
    if (this.isMonitoring) {
      console.log('⚠️ 性能监控已在运行');
      return;
    }
    
    console.log(`📊 开始性能监控 (间隔: ${interval}ms)`);
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      // CPU监控
      const cpuMonitor = this.monitorCPUUsage();
      setTimeout(cpuMonitor, 100);
      
      // 内存监控
      this.monitorMemoryUsage();
      
      // 事件循环监控
      this.monitorEventLoopLag();
      
    }, interval);
    
    // 定期清理历史数据
    this.cleanupInterval = setInterval(() => {
      this.cleanupMetrics();
    }, 60000);
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    console.log('⏹️ 停止性能监控');
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  cleanupMetrics() {
    const maxEntries = 1000;
    
    Object.keys(this.metrics).forEach(key => {
      if (this.metrics[key].length > maxEntries) {
        this.metrics[key] = this.metrics[key].slice(-maxEntries / 2);
      }
    });
  }

  // 性能基准测试
  benchmark(name, fn, options = {}) {
    const {
      iterations = 1000,
      warmup = 100,
      timeout = 30000
    } = options;
    
    console.log(`🏃 开始基准测试: ${name} (${iterations} 次迭代)`);
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`基准测试超时: ${name}`));
      }, timeout);
      
      // 预热
      for (let i = 0; i < warmup; i++) {
        try {
          fn();
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
          return;
        }
      }
      
      // 实际测试
      const results = [];
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();
      
      for (let i = 0; i < iterations; i++) {
        const iterStart = process.hrtime.bigint();
        
        try {
          fn();
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
          return;
        }
        
        const iterEnd = process.hrtime.bigint();
        results.push(Number(iterEnd - iterStart) / 1000000); // 毫秒
      }
      
      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();
      
      clearTimeout(timeoutId);
      
      const totalTime = Number(endTime - startTime) / 1000000;
      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
      const minTime = Math.min(...results);
      const maxTime = Math.max(...results);
      
      // 计算标准差
      const variance = results.reduce((acc, time) => {
        return acc + Math.pow(time - avgTime, 2);
      }, 0) / results.length;
      const stdDev = Math.sqrt(variance);
      
      const benchmark = {
        name,
        iterations,
        totalTime: totalTime.toFixed(2),
        avgTime: avgTime.toFixed(4),
        minTime: minTime.toFixed(4),
        maxTime: maxTime.toFixed(4),
        stdDev: stdDev.toFixed(4),
        opsPerSecond: (iterations / (totalTime / 1000)).toFixed(0),
        memoryDelta: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal
        },
        timestamp: Date.now()
      };
      
      this.benchmarks.set(name, benchmark);
      
      console.log(`✅ ${name}: ${benchmark.avgTime}ms 平均, ${benchmark.opsPerSecond} ops/sec`);
      
      resolve(benchmark);
    });
  }

  // 比较多个实现的性能
  async compareBenchmarks(implementations) {
    console.log(`🔍 比较 ${implementations.length} 个实现的性能...\n`);
    
    const results = [];
    
    for (const impl of implementations) {
      try {
        const result = await this.benchmark(impl.name, impl.fn, impl.options);
        results.push(result);
      } catch (error) {
        console.error(`❌ ${impl.name} 测试失败:`, error.message);
      }
    }
    
    // 按平均时间排序
    results.sort((a, b) => parseFloat(a.avgTime) - parseFloat(b.avgTime));
    
    console.log('\n🏆 性能排名:');
    results.forEach((result, index) => {
      const speedup = index === 0 ? '1.00x' : 
        `${(parseFloat(results[0].avgTime) / parseFloat(result.avgTime)).toFixed(2)}x`;
      
      console.log(`${index + 1}. ${result.name}:`);
      console.log(`   平均时间: ${result.avgTime}ms`);
      console.log(`   吞吐量: ${result.opsPerSecond} ops/sec`);
      console.log(`   相对速度: ${speedup} ${index === 0 ? '(最快)' : '(慢于最快)'}`);
      console.log('');
    });
    
    return results;
  }

  // 生成性能报告
  generatePerformanceReport() {
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5分钟
    
    const report = {
      timestamp: now,
      timeWindow: '5分钟',
      summary: {},
      details: {},
      recommendations: []
    };
    
    // CPU分析
    const recentCPU = this.metrics.cpuUsage.filter(
      m => now - m.timestamp < timeWindow
    );
    
    if (recentCPU.length > 0) {
      const avgCPU = recentCPU.reduce((acc, m) => acc + m.total, 0) / recentCPU.length;
      const maxCPU = Math.max(...recentCPU.map(m => m.total));
      
      report.summary.cpu = {
        average: avgCPU.toFixed(2) + '%',
        peak: maxCPU.toFixed(2) + '%',
        samples: recentCPU.length
      };
      
      if (avgCPU > 80) {
        report.recommendations.push({
          type: 'cpu',
          severity: 'high',
          message: 'CPU使用率过高，检查计算密集型操作'
        });
      }
    }
    
    // 内存分析
    const recentMemory = this.metrics.memoryUsage.filter(
      m => now - m.timestamp < timeWindow
    );
    
    if (recentMemory.length > 0) {
      const latestMemory = recentMemory[recentMemory.length - 1];
      const memoryTrend = this.calculateMemoryTrend(recentMemory);
      
      report.summary.memory = {
        current: latestMemory.heapUsedMB.toFixed(2) + 'MB',
        total: latestMemory.heapTotalMB.toFixed(2) + 'MB',
        external: latestMemory.externalMB.toFixed(2) + 'MB',
        trend: memoryTrend > 0 ? `+${memoryTrend.toFixed(2)}MB` : `${memoryTrend.toFixed(2)}MB`
      };
      
      if (memoryTrend > 10) {
        report.recommendations.push({
          type: 'memory',
          severity: 'high',
          message: '内存持续增长，可能存在内存泄漏'
        });
      }
    }
    
    // 事件循环分析
    const recentEventLoop = this.metrics.eventLoopLag.filter(
      m => now - m.timestamp < timeWindow
    );
    
    if (recentEventLoop.length > 0) {
      const avgLag = recentEventLoop.reduce((acc, m) => acc + m.lag, 0) / recentEventLoop.length;
      const maxLag = Math.max(...recentEventLoop.map(m => m.lag));
      
      report.summary.eventLoop = {
        averageLag: avgLag.toFixed(2) + 'ms',
        maxLag: maxLag.toFixed(2) + 'ms',
        samples: recentEventLoop.length
      };
      
      if (avgLag > 10) {
        report.recommendations.push({
          type: 'eventloop',
          severity: 'medium',
          message: '事件循环延迟较高，检查阻塞操作'
        });
      }
    }
    
    // 基准测试结果
    report.benchmarks = Array.from(this.benchmarks.values());
    
    return report;
  }

  calculateMemoryTrend(memoryData) {
    if (memoryData.length < 2) return 0;
    
    const firstHalf = memoryData.slice(0, Math.floor(memoryData.length / 2));
    const secondHalf = memoryData.slice(Math.floor(memoryData.length / 2));
    
    const firstAvg = firstHalf.reduce((acc, m) => acc + m.heapUsedMB, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, m) => acc + m.heapUsedMB, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }
}

// 使用示例
const analyzer = new PerformanceAnalyzer();
analyzer.startMonitoring(2000);

// 性能测试示例
const testImplementations = [
  {
    name: 'for循环',
    fn: () => {
      const arr = [];
      for (let i = 0; i < 1000; i++) {
        arr.push(i * i);
      }
      return arr;
    }
  },
  {
    name: 'Array.map',
    fn: () => {
      return Array.from({ length: 1000 }, (_, i) => i * i);
    }
  },
  {
    name: '预分配数组',
    fn: () => {
      const arr = new Array(1000);
      for (let i = 0; i < 1000; i++) {
        arr[i] = i * i;
      }
      return arr;
    }
  }
];

// 执行性能比较
setTimeout(async () => {
  await analyzer.compareBenchmarks(testImplementations);
  
  // 生成性能报告
  setTimeout(() => {
    const report = analyzer.generatePerformanceReport();
    console.log('\n📊 性能报告:');
    console.log(JSON.stringify(report.summary, null, 2));
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 优化建议:');
      report.recommendations.forEach(rec => {
        console.log(`  ${rec.severity.toUpperCase()}: ${rec.message}`);
      });
    }
    
    analyzer.stopMonitoring();
  }, 3000);
}, 2000);
```

## 🚀 代码优化技巧

### 算法和数据结构优化

```javascript
// 常见算法优化示例
class AlgorithmOptimizer {
  // 字符串操作优化
  static stringOptimization() {
    console.log('🔤 字符串操作优化测试...\n');
    
    const testData = Array.from({ length: 1000 }, (_, i) => `string_${i}`);
    
    const implementations = [
      {
        name: '字符串拼接 - +=',
        fn: () => {
          let result = '';
          for (const str of testData) {
            result += str + ',';
          }
          return result;
        }
      },
      {
        name: '字符串拼接 - Array.join',
        fn: () => {
          return testData.join(',') + ',';
        }
      },
      {
        name: '字符串拼接 - 模板字符串',
        fn: () => {
          let result = '';
          for (const str of testData) {
            result += `${str},`;
          }
          return result;
        }
      }
    ];
    
    return implementations;
  }

  // 数组操作优化
  static arrayOptimization() {
    console.log('📚 数组操作优化测试...\n');
    
    const testData = Array.from({ length: 10000 }, (_, i) => i);
    
    const implementations = [
      {
        name: '数组过滤 - filter',
        fn: () => {
          return testData.filter(x => x % 2 === 0);
        }
      },
      {
        name: '数组过滤 - for循环',
        fn: () => {
          const result = [];
          for (let i = 0; i < testData.length; i++) {
            if (testData[i] % 2 === 0) {
              result.push(testData[i]);
            }
          }
          return result;
        }
      },
      {
        name: '数组过滤 - 预分配',
        fn: () => {
          const result = new Array(Math.floor(testData.length / 2));
          let resultIndex = 0;
          
          for (let i = 0; i < testData.length; i++) {
            if (testData[i] % 2 === 0) {
              result[resultIndex++] = testData[i];
            }
          }
          
          result.length = resultIndex; // 调整实际长度
          return result;
        }
      }
    ];
    
    return implementations;
  }

  // 对象操作优化
  static objectOptimization() {
    console.log('🏷️ 对象操作优化测试...\n');
    
    const implementations = [
      {
        name: '对象创建 - 字面量',
        fn: () => {
          const objects = [];
          for (let i = 0; i < 1000; i++) {
            objects.push({
              id: i,
              name: `object_${i}`,
              value: i * 2,
              active: i % 2 === 0
            });
          }
          return objects;
        }
      },
      {
        name: '对象创建 - 构造函数',
        fn: () => {
          function ObjectConstructor(id, name, value, active) {
            this.id = id;
            this.name = name;
            this.value = value;
            this.active = active;
          }
          
          const objects = [];
          for (let i = 0; i < 1000; i++) {
            objects.push(new ObjectConstructor(
              i, 
              `object_${i}`, 
              i * 2, 
              i % 2 === 0
            ));
          }
          return objects;
        }
      },
      {
        name: '对象创建 - Object.create',
        fn: () => {
          const prototype = {
            getId() { return this.id; },
            getName() { return this.name; }
          };
          
          const objects = [];
          for (let i = 0; i < 1000; i++) {
            const obj = Object.create(prototype);
            obj.id = i;
            obj.name = `object_${i}`;
            obj.value = i * 2;
            obj.active = i % 2 === 0;
            objects.push(obj);
          }
          return objects;
        }
      }
    ];
    
    return implementations;
  }

  // 循环优化
  static loopOptimization() {
    console.log('🔄 循环优化测试...\n');
    
    const testArray = Array.from({ length: 100000 }, (_, i) => i);
    
    const implementations = [
      {
        name: 'for循环 - 标准',
        fn: () => {
          let sum = 0;
          for (let i = 0; i < testArray.length; i++) {
            sum += testArray[i];
          }
          return sum;
        }
      },
      {
        name: 'for循环 - 缓存长度',
        fn: () => {
          let sum = 0;
          const len = testArray.length;
          for (let i = 0; i < len; i++) {
            sum += testArray[i];
          }
          return sum;
        }
      },
      {
        name: 'for循环 - 倒序',
        fn: () => {
          let sum = 0;
          for (let i = testArray.length - 1; i >= 0; i--) {
            sum += testArray[i];
          }
          return sum;
        }
      },
      {
        name: 'while循环',
        fn: () => {
          let sum = 0;
          let i = testArray.length;
          while (i--) {
            sum += testArray[i];
          }
          return sum;
        }
      },
      {
        name: 'for-of循环',
        fn: () => {
          let sum = 0;
          for (const value of testArray) {
            sum += value;
          }
          return sum;
        }
      },
      {
        name: 'reduce方法',
        fn: () => {
          return testArray.reduce((sum, value) => sum + value, 0);
        }
      }
    ];
    
    return implementations;
  }

  // 异步操作优化
  static asyncOptimization() {
    console.log('⚡ 异步操作优化测试...\n');
    
    // 模拟异步操作
    const asyncOperation = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const implementations = [
      {
        name: '串行执行',
        fn: async () => {
          const results = [];
          for (let i = 0; i < 10; i++) {
            await asyncOperation(1);
            results.push(i);
          }
          return results;
        }
      },
      {
        name: '并行执行 - Promise.all',
        fn: async () => {
          const promises = [];
          for (let i = 0; i < 10; i++) {
            promises.push(asyncOperation(1).then(() => i));
          }
          return Promise.all(promises);
        }
      },
      {
        name: '并行执行 - 限制并发',
        fn: async () => {
          const results = [];
          const concurrency = 3;
          
          for (let i = 0; i < 10; i += concurrency) {
            const batch = [];
            for (let j = 0; j < concurrency && i + j < 10; j++) {
              batch.push(asyncOperation(1).then(() => i + j));
            }
            const batchResults = await Promise.all(batch);
            results.push(...batchResults);
          }
          
          return results;
        }
      }
    ];
    
    return implementations;
  }
}

// 缓存优化策略
class CacheOptimizer {
  constructor() {
    this.caches = new Map();
  }

  // LRU缓存实现
  createLRUCache(maxSize = 100) {
    const cache = new Map();
    
    const get = (key) => {
      if (cache.has(key)) {
        // 移到最后（最近使用）
        const value = cache.get(key);
        cache.delete(key);
        cache.set(key, value);
        return value;
      }
      return null;
    };
    
    const set = (key, value) => {
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        // 删除最久未使用的项（第一个）
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    };
    
    const clear = () => cache.clear();
    const size = () => cache.size;
    
    return { get, set, clear, size };
  }

  // 函数结果缓存（记忆化）
  memoize(fn, keyGenerator = (...args) => JSON.stringify(args)) {
    const cache = new Map();
    
    return (...args) => {
      const key = keyGenerator(...args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  }

  // 缓存性能测试
  testCachePerformance() {
    console.log('💾 缓存性能测试...\n');
    
    // 计算密集型函数
    const fibonacci = (n) => {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    };
    
    const memoizedFibonacci = this.memoize(fibonacci);
    
    const implementations = [
      {
        name: '斐波那契 - 无缓存',
        fn: () => {
          const results = [];
          for (let i = 1; i <= 30; i++) {
            results.push(fibonacci(i));
          }
          return results;
        },
        options: { iterations: 10 }
      },
      {
        name: '斐波那契 - 记忆化',
        fn: () => {
          const results = [];
          for (let i = 1; i <= 30; i++) {
            results.push(memoizedFibonacci(i));
          }
          return results;
        },
        options: { iterations: 100 }
      }
    ];
    
    return implementations;
  }
}

// 内存优化策略
class MemoryOptimizer {
  // 对象池模式
  createObjectPool(createFn, resetFn, initialSize = 10) {
    const pool = [];
    const stats = { created: 0, reused: 0 };
    
    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      pool.push(createFn());
      stats.created++;
    }
    
    const acquire = () => {
      if (pool.length > 0) {
        stats.reused++;
        return pool.pop();
      }
      
      stats.created++;
      return createFn();
    };
    
    const release = (obj) => {
      if (resetFn) resetFn(obj);
      pool.push(obj);
    };
    
    const getStats = () => ({ ...stats, poolSize: pool.length });
    
    return { acquire, release, getStats };
  }

  // 内存使用优化测试
  testMemoryOptimization() {
    console.log('🧠 内存优化测试...\n');
    
    // 创建对象池
    const objectPool = this.createObjectPool(
      () => ({ id: 0, data: null, processed: false }),
      (obj) => {
        obj.id = 0;
        obj.data = null;
        obj.processed = false;
      }
    );
    
    const implementations = [
      {
        name: '对象创建 - 直接创建',
        fn: () => {
          const objects = [];
          for (let i = 0; i < 1000; i++) {
            const obj = { id: i, data: `data_${i}`, processed: false };
            // 模拟处理
            obj.processed = true;
            objects.push(obj);
          }
          return objects;
        }
      },
      {
        name: '对象创建 - 对象池',
        fn: () => {
          const objects = [];
          for (let i = 0; i < 1000; i++) {
            const obj = objectPool.acquire();
            obj.id = i;
            obj.data = `data_${i}`;
            obj.processed = true;
            objects.push(obj);
          }
          
          // 释放对象回池中
          objects.forEach(obj => objectPool.release(obj));
          return objects;
        }
      }
    ];
    
    return implementations;
  }
}

// 综合性能测试
async function runComprehensivePerformanceTest() {
  console.log('🚀 开始综合性能优化测试...\n');
  
  const analyzer = new PerformanceAnalyzer();
  const cacheOptimizer = new CacheOptimizer();
  const memoryOptimizer = new MemoryOptimizer();
  
  // 收集所有测试
  const allTests = [
    ...AlgorithmOptimizer.stringOptimization(),
    ...AlgorithmOptimizer.arrayOptimization(),
    ...AlgorithmOptimizer.objectOptimization(),
    ...AlgorithmOptimizer.loopOptimization(),
    ...cacheOptimizer.testCachePerformance(),
    ...memoryOptimizer.testMemoryOptimization()
  ];
  
  // 分批执行测试
  const batchSize = 3;
  for (let i = 0; i < allTests.length; i += batchSize) {
    const batch = allTests.slice(i, i + batchSize);
    
    console.log(`\n📊 执行测试批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(allTests.length / batchSize)}`);
    console.log('='.repeat(50));
    
    await analyzer.compareBenchmarks(batch);
    
    // 短暂休息，避免系统过载
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 性能优化测试完成！');
  console.log('\n主要优化建议:');
  console.log('1. 使用适当的数据结构和算法');
  console.log('2. 避免不必要的对象创建');
  console.log('3. 利用缓存减少重复计算');
  console.log('4. 优化循环和异步操作');
  console.log('5. 使用对象池管理内存');
}

// 执行综合测试
runComprehensivePerformanceTest().catch(console.error);
```

## 🔧 系统级优化

### I/O优化策略

```javascript
// I/O性能优化工具
const fs = require('fs').promises;
const path = require('path');
const { Transform, pipeline } = require('stream');
const { promisify } = require('util');

class IOOptimizer {
  constructor() {
    this.metrics = {
      fileOperations: [],
      streamOperations: [],
      networkRequests: []
    };
  }

  // 文件操作优化
  async testFileOperations() {
    console.log('📁 文件I/O优化测试...\n');
    
    const testFile = path.join(__dirname, 'test-large-file.txt');
    const testData = 'x'.repeat(1000000); // 1MB数据
    
    // 创建测试文件
    await fs.writeFile(testFile, testData);
    
    const implementations = [
      {
        name: '文件读取 - 一次性读取',
        fn: async () => {
          return await fs.readFile(testFile, 'utf8');
        }
      },
      {
        name: '文件读取 - 流式读取',
        fn: async () => {
          const fs_stream = require('fs');
          const chunks = [];
          
          return new Promise((resolve, reject) => {
            const stream = fs_stream.createReadStream(testFile, { 
              encoding: 'utf8',
              highWaterMark: 16 * 1024 // 16KB chunks
            });
            
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('end', () => resolve(chunks.join('')));
            stream.on('error', reject);
          });
        }
      },
      {
        name: '文件写入 - 同步写入',
        fn: async () => {
          const outputFile = path.join(__dirname, 'test-output-sync.txt');
          await fs.writeFile(outputFile, testData);
          await fs.unlink(outputFile); // 清理
        }
      },
      {
        name: '文件写入 - 流式写入',
        fn: async () => {
          const fs_stream = require('fs');
          const outputFile = path.join(__dirname, 'test-output-stream.txt');
          
          return new Promise((resolve, reject) => {
            const writeStream = fs_stream.createWriteStream(outputFile);
            
            writeStream.on('finish', async () => {
              await fs.unlink(outputFile); // 清理
              resolve();
            });
            writeStream.on('error', reject);
            
            // 分块写入
            const chunkSize = 16 * 1024;
            for (let i = 0; i < testData.length; i += chunkSize) {
              writeStream.write(testData.slice(i, i + chunkSize));
            }
            writeStream.end();
          });
        }
      }
    ];
    
    // 清理测试文件
    try {
      await fs.unlink(testFile);
    } catch (error) {
      // 忽略清理错误
    }
    
    return implementations;
  }

  // 流处理优化
  async testStreamProcessing() {
    console.log('🌊 流处理优化测试...\n');
    
    const testData = Array.from({ length: 100000 }, (_, i) => `line ${i}\n`);
    
    const implementations = [
      {
        name: '数据处理 - 内存中处理',
        fn: async () => {
          const data = testData.join('');
          const lines = data.split('\n');
          const processed = lines
            .filter(line => line.includes('5'))
            .map(line => line.toUpperCase());
          return processed.length;
        }
      },
      {
        name: '数据处理 - 流式处理',
        fn: async () => {
          const { Readable } = require('stream');
          
          // 创建可读流
          const sourceStream = new Readable({
            read() {
              if (testData.length > 0) {
                this.push(testData.shift());
              } else {
                this.push(null); // 结束流
              }
            }
          });
          
          // 创建处理流
          const filterTransform = new Transform({
            transform(chunk, encoding, callback) {
              const line = chunk.toString();
              if (line.includes('5')) {
                this.push(line.toUpperCase());
              }
              callback();
            }
          });
          
          // 计数器
          let count = 0;
          const countTransform = new Transform({
            transform(chunk, encoding, callback) {
              count++;
              callback();
            }
          });
          
          return new Promise((resolve, reject) => {
            pipeline(
              sourceStream,
              filterTransform,
              countTransform,
              (error) => {
                if (error) reject(error);
                else resolve(count);
              }
            );
          });
        }
      }
    ];
    
    return implementations;
  }

  // 批量操作优化
  async testBatchOperations() {
    console.log('📦 批量操作优化测试...\n');
    
    const operations = Array.from({ length: 1000 }, (_, i) => i);
    
    // 模拟异步操作
    const asyncOperation = (value) => 
      new Promise(resolve => setTimeout(() => resolve(value * 2), 1));
    
    const implementations = [
      {
        name: '批量处理 - 串行执行',
        fn: async () => {
          const results = [];
          for (const op of operations) {
            const result = await asyncOperation(op);
            results.push(result);
          }
          return results;
        }
      },
      {
        name: '批量处理 - 全并行',
        fn: async () => {
          const promises = operations.map(op => asyncOperation(op));
          return Promise.all(promises);
        }
      },
      {
        name: '批量处理 - 限制并发',
        fn: async () => {
          const results = [];
          const concurrency = 10;
          
          for (let i = 0; i < operations.length; i += concurrency) {
            const batch = operations.slice(i, i + concurrency);
            const batchPromises = batch.map(op => asyncOperation(op));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
          }
          
          return results;
        }
      },
      {
        name: '批量处理 - 工作队列',
        fn: async () => {
          const results = [];
          const workers = [];
          const concurrency = 10;
          
          let operationIndex = 0;
          
          const worker = async () => {
            while (operationIndex < operations.length) {
              const currentIndex = operationIndex++;
              if (currentIndex < operations.length) {
                const result = await asyncOperation(operations[currentIndex]);
                results[currentIndex] = result;
              }
            }
          };
          
          // 启动工作线程
          for (let i = 0; i < concurrency; i++) {
            workers.push(worker());
          }
          
          await Promise.all(workers);
          return results;
        }
      }
    ];
    
    return implementations;
  }

  // 缓存策略优化
  createAdvancedCache() {
    const cache = new Map();
    const accessTimes = new Map();
    const stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    
    const maxSize = 1000;
    const ttl = 60000; // 1分钟
    
    const get = (key) => {
      const now = Date.now();
      
      if (cache.has(key)) {
        const { value, timestamp } = cache.get(key);
        
        // 检查是否过期
        if (now - timestamp > ttl) {
          cache.delete(key);
          accessTimes.delete(key);
          stats.misses++;
          return null;
        }
        
        // 更新访问时间
        accessTimes.set(key, now);
        stats.hits++;
        return value;
      }
      
      stats.misses++;
      return null;
    };
    
    const set = (key, value) => {
      const now = Date.now();
      
      // 如果缓存已满，执行LRU淘汰
      if (cache.size >= maxSize && !cache.has(key)) {
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [k, time] of accessTimes) {
          if (time < oldestTime) {
            oldestTime = time;
            oldestKey = k;
          }
        }
        
        if (oldestKey) {
          cache.delete(oldestKey);
          accessTimes.delete(oldestKey);
          stats.evictions++;
        }
      }
      
      cache.set(key, { value, timestamp: now });
      accessTimes.set(key, now);
    };
    
    const clear = () => {
      cache.clear();
      accessTimes.clear();
    };
    
    const getStats = () => ({
      ...stats,
      size: cache.size,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0
    });
    
    return { get, set, clear, getStats };
  }

  // 综合I/O性能测试
  async runIOPerformanceTest() {
    console.log('🚀 开始I/O性能优化测试...\n');
    
    const allTests = [
      ...(await this.testFileOperations()),
      ...(await this.testStreamProcessing()),
      ...(await this.testBatchOperations())
    ];
    
    return allTests;
  }
}

// 使用示例和综合测试
async function runCompleteOptimizationSuite() {
  console.log('🎯 开始完整的性能优化测试套件...\n');
  
  const performanceAnalyzer = new PerformanceAnalyzer();
  const ioOptimizer = new IOOptimizer();
  
  // 启动性能监控
  performanceAnalyzer.startMonitoring(1000);
  
  try {
    // I/O优化测试
    const ioTests = await ioOptimizer.runIOPerformanceTest();
    await performanceAnalyzer.compareBenchmarks(ioTests);
    
    // 等待一些监控数据
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 生成最终报告
    const report = performanceAnalyzer.generatePerformanceReport();
    
    console.log('\n📋 最终性能优化报告:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(report.summary, null, 2));
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 系统优化建议:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`);
      });
    }
    
    console.log('\n🏆 优化最佳实践总结:');
    console.log('1. 使用流处理大文件，避免内存溢出');
    console.log('2. 实施适当的并发控制，避免系统过载');
    console.log('3. 使用缓存减少重复I/O操作');
    console.log('4. 批量处理操作以提高效率');
    console.log('5. 监控系统资源使用情况');
    console.log('6. 选择合适的算法和数据结构');
    console.log('7. 优化异步操作的并发策略');
    
  } finally {
    performanceAnalyzer.stopMonitoring();
  }
}

// 执行完整测试套件
runCompleteOptimizationSuite().catch(console.error);
```

Node.js性能优化是一个系统性工程，需要从代码、算法、I/O、内存等多个维度进行综合考虑和持续优化！
