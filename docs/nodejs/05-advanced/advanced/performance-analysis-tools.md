# 性能分析工具

## 🎯 学习目标

- 掌握Node.js性能分析工具的使用
- 学会识别和诊断性能瓶颈
- 理解内存泄漏检测和CPU分析
- 了解性能监控和优化策略

## 📚 核心概念

### 性能分析基础

```javascript
// 性能分析核心概念
const performanceAnalysisConcepts = {
  metrics: {
    cpu: {
      description: 'CPU使用率分析',
      indicators: ['用户时间', '系统时间', '空闲时间', '等待时间'],
      tools: ['perf', 'top', 'htop', 'node --prof']
    },
    memory: {
      description: '内存使用分析',
      indicators: ['堆内存', '栈内存', '外部内存', 'GC频率'],
      tools: ['heapdump', 'memwatch', 'clinic.js']
    },
    io: {
      description: 'I/O性能分析',
      indicators: ['磁盘读写', '网络延迟', '文件系统操作'],
      tools: ['iotop', 'netstat', 'lsof']
    },
    eventLoop: {
      description: '事件循环分析',
      indicators: ['延迟', '阻塞', '队列长度', '处理时间'],
      tools: ['clinic.js', '@nodejs/clinic-doctor']
    }
  },
  profiling: {
    types: ['CPU分析', '内存分析', '火焰图', '调用图'],
    approaches: ['采样分析', '插桩分析', '统计分析']
  }
};

console.log('性能分析概念:', performanceAnalysisConcepts);
```

## 🛠️ 内置性能监控工具

### 基础性能监控器

```javascript
// basic-performance-monitor.js
const { performance, PerformanceObserver } = require('perf_hooks');
const EventEmitter = require('events');

class BasicPerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableCPU: options.enableCPU !== false,
      enableMemory: options.enableMemory !== false,
      enableEventLoop: options.enableEventLoop !== false,
      enableGC: options.enableGC !== false,
      interval: options.interval || 1000,
      ...options
    };
    
    this.metrics = {
      cpu: [],
      memory: [],
      eventLoop: [],
      gc: []
    };
    
    this.observers = [];
    this.timers = [];
    this.isMonitoring = false;
  }

  start() {
    if (this.isMonitoring) {
      console.warn('⚠️ 性能监控已在运行');
      return;
    }

    console.log('🔍 启动性能监控...');
    this.isMonitoring = true;

    if (this.options.enableCPU) {
      this.startCPUMonitoring();
    }

    if (this.options.enableMemory) {
      this.startMemoryMonitoring();
    }

    if (this.options.enableEventLoop) {
      this.startEventLoopMonitoring();
    }

    if (this.options.enableGC) {
      this.startGCMonitoring();
    }

    console.log('✅ 性能监控已启动');
  }

  stop() {
    if (!this.isMonitoring) {
      return;
    }

    console.log('⏹️ 停止性能监控...');
    this.isMonitoring = false;

    // 清理定时器
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];

    // 断开观察器
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    console.log('✅ 性能监控已停止');
  }

  startCPUMonitoring() {
    const measureCPU = () => {
      const startTime = process.hrtime.bigint();
      const startUsage = process.cpuUsage();
      
      setTimeout(() => {
        const endTime = process.hrtime.bigint();
        const endUsage = process.cpuUsage(startUsage);
        const duration = Number(endTime - startTime) / 1000000; // 毫秒
        
        const cpuMetric = {
          timestamp: Date.now(),
          user: (endUsage.user / 1000) / duration * 100, // 转换为百分比
          system: (endUsage.system / 1000) / duration * 100,
          total: ((endUsage.user + endUsage.system) / 1000) / duration * 100
        };
        
        this.metrics.cpu.push(cpuMetric);
        this.trimMetrics('cpu');
        
        this.emit('cpu', cpuMetric);
      }, 100);
    };

    const timer = setInterval(measureCPU, this.options.interval);
    this.timers.push(timer);
  }

  startMemoryMonitoring() {
    const measureMemory = () => {
      const memUsage = process.memoryUsage();
      
      const memoryMetric = {
        timestamp: Date.now(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        arrayBuffers: memUsage.arrayBuffers || 0,
        heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
        utilization: (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2)
      };
      
      this.metrics.memory.push(memoryMetric);
      this.trimMetrics('memory');
      
      this.emit('memory', memoryMetric);
    };

    const timer = setInterval(measureMemory, this.options.interval);
    this.timers.push(timer);
  }

  startEventLoopMonitoring() {
    const measureEventLoop = () => {
      const start = process.hrtime.bigint();
      
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // 毫秒
        
        const eventLoopMetric = {
          timestamp: Date.now(),
          lag: lag
        };
        
        this.metrics.eventLoop.push(eventLoopMetric);
        this.trimMetrics('eventLoop');
        
        this.emit('eventLoop', eventLoopMetric);
        
        if (lag > 10) {
          this.emit('eventLoopLag', { lag, threshold: 10 });
        }
      });
    };

    const timer = setInterval(measureEventLoop, this.options.interval);
    this.timers.push(timer);
  }

  startGCMonitoring() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        if (entry.entryType === 'gc') {
          const gcMetric = {
            timestamp: entry.startTime + entry.timeOrigin,
            duration: entry.duration,
            kind: entry.detail?.kind || 'unknown',
            type: this.getGCTypeName(entry.detail?.kind),
            flags: entry.detail?.flags || 0
          };
          
          this.metrics.gc.push(gcMetric);
          this.trimMetrics('gc');
          
          this.emit('gc', gcMetric);
          
          if (gcMetric.duration > 50) {
            this.emit('longGC', gcMetric);
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['gc'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('⚠️ GC监控不可用:', error.message);
    }
  }

  getGCTypeName(kind) {
    const gcTypes = {
      1: 'Scavenge',
      2: 'Mark-Sweep-Compact',
      4: 'Incremental-Marking',
      8: 'Weak-Processing',
      16: 'Full-GC'
    };

    return gcTypes[kind] || `Unknown(${kind})`;
  }

  trimMetrics(type) {
    const maxEntries = 1000;
    if (this.metrics[type].length > maxEntries) {
      this.metrics[type] = this.metrics[type].slice(-maxEntries);
    }
  }

  // 获取性能摘要
  getSummary() {
    const now = Date.now();
    const timeWindow = 60000; // 1分钟

    const summary = {
      timestamp: now,
      timeWindow: '1分钟',
      cpu: this.getCPUSummary(timeWindow),
      memory: this.getMemorySummary(timeWindow),
      eventLoop: this.getEventLoopSummary(timeWindow),
      gc: this.getGCSummary(timeWindow)
    };

    return summary;
  }

  getCPUSummary(timeWindow) {
    const recentCPU = this.getRecentMetrics('cpu', timeWindow);
    
    if (recentCPU.length === 0) {
      return null;
    }

    const avgUser = recentCPU.reduce((sum, m) => sum + m.user, 0) / recentCPU.length;
    const avgSystem = recentCPU.reduce((sum, m) => sum + m.system, 0) / recentCPU.length;
    const avgTotal = recentCPU.reduce((sum, m) => sum + m.total, 0) / recentCPU.length;
    const maxTotal = Math.max(...recentCPU.map(m => m.total));

    return {
      average: {
        user: avgUser.toFixed(2) + '%',
        system: avgSystem.toFixed(2) + '%',
        total: avgTotal.toFixed(2) + '%'
      },
      peak: maxTotal.toFixed(2) + '%',
      samples: recentCPU.length
    };
  }

  getMemorySummary(timeWindow) {
    const recentMemory = this.getRecentMetrics('memory', timeWindow);
    
    if (recentMemory.length === 0) {
      return null;
    }

    const latest = recentMemory[recentMemory.length - 1];
    const avgHeapUsed = recentMemory.reduce((sum, m) => sum + m.heapUsed, 0) / recentMemory.length;
    const maxHeapUsed = Math.max(...recentMemory.map(m => m.heapUsed));
    const trend = this.calculateMemoryTrend(recentMemory);

    return {
      current: {
        heapUsed: latest.heapUsedMB + 'MB',
        heapTotal: latest.heapTotalMB + 'MB',
        utilization: latest.utilization + '%',
        rss: (latest.rss / 1024 / 1024).toFixed(2) + 'MB'
      },
      average: {
        heapUsed: (avgHeapUsed / 1024 / 1024).toFixed(2) + 'MB'
      },
      peak: {
        heapUsed: (maxHeapUsed / 1024 / 1024).toFixed(2) + 'MB'
      },
      trend: trend > 0 ? `+${(trend / 1024 / 1024).toFixed(2)}MB` : `${(trend / 1024 / 1024).toFixed(2)}MB`,
      samples: recentMemory.length
    };
  }

  getEventLoopSummary(timeWindow) {
    const recentEventLoop = this.getRecentMetrics('eventLoop', timeWindow);
    
    if (recentEventLoop.length === 0) {
      return null;
    }

    const avgLag = recentEventLoop.reduce((sum, m) => sum + m.lag, 0) / recentEventLoop.length;
    const maxLag = Math.max(...recentEventLoop.map(m => m.lag));
    const highLagCount = recentEventLoop.filter(m => m.lag > 10).length;

    return {
      average: avgLag.toFixed(2) + 'ms',
      peak: maxLag.toFixed(2) + 'ms',
      highLagEvents: highLagCount,
      samples: recentEventLoop.length
    };
  }

  getGCSummary(timeWindow) {
    const recentGC = this.getRecentMetrics('gc', timeWindow);
    
    if (recentGC.length === 0) {
      return null;
    }

    const totalTime = recentGC.reduce((sum, m) => sum + m.duration, 0);
    const avgDuration = totalTime / recentGC.length;
    const maxDuration = Math.max(...recentGC.map(m => m.duration));
    const typeCount = {};

    recentGC.forEach(gc => {
      typeCount[gc.type] = (typeCount[gc.type] || 0) + 1;
    });

    return {
      count: recentGC.length,
      totalTime: totalTime.toFixed(2) + 'ms',
      average: avgDuration.toFixed(2) + 'ms',
      peak: maxDuration.toFixed(2) + 'ms',
      types: typeCount
    };
  }

  getRecentMetrics(type, timeWindow) {
    const now = Date.now();
    return this.metrics[type].filter(m => now - m.timestamp <= timeWindow);
  }

  calculateMemoryTrend(memoryData) {
    if (memoryData.length < 2) return 0;
    
    const firstHalf = memoryData.slice(0, Math.floor(memoryData.length / 2));
    const secondHalf = memoryData.slice(Math.floor(memoryData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.heapUsed, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.heapUsed, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  // 生成性能报告
  generateReport() {
    const summary = this.getSummary();
    
    console.log('\n📊 性能监控报告');
    console.log('='.repeat(50));
    console.log(`时间窗口: ${summary.timeWindow}`);
    
    if (summary.cpu) {
      console.log('\n🖥️ CPU使用率:');
      console.log(`  平均: 用户=${summary.cpu.average.user}, 系统=${summary.cpu.average.system}, 总计=${summary.cpu.average.total}`);
      console.log(`  峰值: ${summary.cpu.peak}`);
      console.log(`  样本数: ${summary.cpu.samples}`);
    }
    
    if (summary.memory) {
      console.log('\n💾 内存使用:');
      console.log(`  当前: 堆=${summary.memory.current.heapUsed}/${summary.memory.current.heapTotal} (${summary.memory.current.utilization}), RSS=${summary.memory.current.rss}`);
      console.log(`  平均堆使用: ${summary.memory.average.heapUsed}`);
      console.log(`  峰值堆使用: ${summary.memory.peak.heapUsed}`);
      console.log(`  趋势: ${summary.memory.trend}`);
    }
    
    if (summary.eventLoop) {
      console.log('\n⚡ 事件循环:');
      console.log(`  平均延迟: ${summary.eventLoop.average}`);
      console.log(`  最大延迟: ${summary.eventLoop.peak}`);
      console.log(`  高延迟事件: ${summary.eventLoop.highLagEvents}`);
    }
    
    if (summary.gc) {
      console.log('\n🗑️ 垃圾收集:');
      console.log(`  GC次数: ${summary.gc.count}`);
      console.log(`  总时间: ${summary.gc.totalTime}`);
      console.log(`  平均时间: ${summary.gc.average}`);
      console.log(`  最长时间: ${summary.gc.peak}`);
      console.log(`  类型分布: ${JSON.stringify(summary.gc.types)}`);
    }
    
    return summary;
  }

  // 检测性能异常
  detectAnomalies() {
    const anomalies = [];
    const summary = this.getSummary();
    
    // CPU异常检测
    if (summary.cpu) {
      const cpuTotal = parseFloat(summary.cpu.average.total);
      if (cpuTotal > 80) {
        anomalies.push({
          type: 'cpu',
          severity: 'high',
          message: `CPU使用率过高: ${summary.cpu.average.total}`,
          value: cpuTotal
        });
      }
    }
    
    // 内存异常检测
    if (summary.memory) {
      const utilization = parseFloat(summary.memory.current.utilization);
      if (utilization > 90) {
        anomalies.push({
          type: 'memory',
          severity: 'high',
          message: `内存利用率过高: ${summary.memory.current.utilization}`,
          value: utilization
        });
      }
      
      const trendMB = parseFloat(summary.memory.trend.replace(/[^\d.-]/g, ''));
      if (trendMB > 10) {
        anomalies.push({
          type: 'memory',
          severity: 'medium',
          message: `内存持续增长: ${summary.memory.trend}`,
          value: trendMB
        });
      }
    }
    
    // 事件循环异常检测
    if (summary.eventLoop) {
      const avgLag = parseFloat(summary.eventLoop.average);
      if (avgLag > 50) {
        anomalies.push({
          type: 'eventLoop',
          severity: 'high',
          message: `事件循环延迟过高: ${summary.eventLoop.average}`,
          value: avgLag
        });
      }
    }
    
    // GC异常检测
    if (summary.gc) {
      const avgGCTime = parseFloat(summary.gc.average);
      if (avgGCTime > 100) {
        anomalies.push({
          type: 'gc',
          severity: 'medium',
          message: `GC平均时间过长: ${summary.gc.average}`,
          value: avgGCTime
        });
      }
    }
    
    return anomalies;
  }
}

module.exports = BasicPerformanceMonitor;
```

### 高级性能分析器

```javascript
// advanced-performance-profiler.js
const fs = require('fs').promises;
const path = require('path');
const { performance, PerformanceObserver } = require('perf_hooks');

class AdvancedPerformanceProfiler {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './performance-reports',
      enableFlameGraph: options.enableFlameGraph !== false,
      sampleInterval: options.sampleInterval || 1000,
      profilingDuration: options.profilingDuration || 60000,
      ...options
    };
    
    this.profilers = new Map();
    this.isActive = false;
    this.startTime = null;
    this.samples = [];
  }

  async start() {
    if (this.isActive) {
      throw new Error('性能分析器已在运行');
    }

    console.log('🔍 启动高级性能分析器...');
    this.isActive = true;
    this.startTime = Date.now();

    // 确保输出目录存在
    await this.ensureOutputDir();

    // 启动各种分析器
    this.startCPUProfiling();
    this.startMemoryProfiling();
    this.startFunctionProfiling();
    this.startCustomMetrics();

    console.log(`✅ 性能分析器已启动，将运行 ${this.options.profilingDuration}ms`);

    // 设置自动停止
    setTimeout(() => {
      if (this.isActive) {
        this.stop();
      }
    }, this.options.profilingDuration);
  }

  async stop() {
    if (!this.isActive) {
      return;
    }

    console.log('⏹️ 停止性能分析器...');
    this.isActive = false;

    // 停止所有分析器
    for (const [name, profiler] of this.profilers) {
      if (profiler.stop) {
        profiler.stop();
      }
    }

    // 生成报告
    await this.generateReports();

    console.log('✅ 性能分析完成');
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.options.outputDir, { recursive: true });
    } catch (error) {
      console.error('创建输出目录失败:', error);
    }
  }

  startCPUProfiling() {
    const cpuSamples = [];
    
    const sampleCPU = () => {
      if (!this.isActive) return;

      const startUsage = process.cpuUsage();
      const startTime = process.hrtime.bigint();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        
        const sample = {
          timestamp: Date.now(),
          user: (endUsage.user / 1000) / duration * 100,
          system: (endUsage.system / 1000) / duration * 100,
          duration: duration
        };
        
        cpuSamples.push(sample);
        
        // 继续采样
        setTimeout(sampleCPU, this.options.sampleInterval);
      }, 100);
    };

    sampleCPU();

    this.profilers.set('cpu', {
      samples: cpuSamples,
      stop: () => {
        console.log(`📊 CPU采样完成: ${cpuSamples.length} 个样本`);
      }
    });
  }

  startMemoryProfiling() {
    const memorySamples = [];
    const gcEvents = [];
    
    // 内存采样
    const sampleMemory = () => {
      if (!this.isActive) return;

      const usage = process.memoryUsage();
      const sample = {
        timestamp: Date.now(),
        ...usage,
        heapUtilization: (usage.heapUsed / usage.heapTotal) * 100
      };
      
      memorySamples.push(sample);
      
      setTimeout(sampleMemory, this.options.sampleInterval);
    };

    sampleMemory();

    // GC事件监听
    const gcObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'gc') {
          gcEvents.push({
            timestamp: entry.startTime + entry.timeOrigin,
            duration: entry.duration,
            kind: entry.detail?.kind,
            type: this.getGCTypeName(entry.detail?.kind)
          });
        }
      });
    });

    try {
      gcObserver.observe({ entryTypes: ['gc'] });
    } catch (error) {
      console.warn('GC监控不可用:', error.message);
    }

    this.profilers.set('memory', {
      samples: memorySamples,
      gcEvents: gcEvents,
      observer: gcObserver,
      stop: () => {
        gcObserver.disconnect();
        console.log(`📊 内存采样完成: ${memorySamples.length} 个样本, ${gcEvents.length} 个GC事件`);
      }
    });
  }

  startFunctionProfiling() {
    const functionCalls = new Map();
    const callStack = [];
    
    // 函数调用跟踪
    const originalConsoleTime = console.time;
    const originalConsoleTimeEnd = console.timeEnd;
    
    console.time = (label) => {
      const startTime = performance.now();
      callStack.push({ label, startTime });
      return originalConsoleTime.call(console, label);
    };
    
    console.timeEnd = (label) => {
      const endTime = performance.now();
      const callIndex = callStack.findIndex(call => call.label === label);
      
      if (callIndex > -1) {
        const call = callStack.splice(callIndex, 1)[0];
        const duration = endTime - call.startTime;
        
        if (!functionCalls.has(label)) {
          functionCalls.set(label, {
            count: 0,
            totalTime: 0,
            minTime: Infinity,
            maxTime: 0,
            calls: []
          });
        }
        
        const stats = functionCalls.get(label);
        stats.count++;
        stats.totalTime += duration;
        stats.minTime = Math.min(stats.minTime, duration);
        stats.maxTime = Math.max(stats.maxTime, duration);
        stats.calls.push({
          timestamp: Date.now(),
          duration: duration
        });
      }
      
      return originalConsoleTimeEnd.call(console, label);
    };

    this.profilers.set('functions', {
      calls: functionCalls,
      stop: () => {
        console.time = originalConsoleTime;
        console.timeEnd = originalConsoleTimeEnd;
        console.log(`📊 函数调用跟踪完成: ${functionCalls.size} 个函数`);
      }
    });
  }

  startCustomMetrics() {
    const customMetrics = {
      httpRequests: 0,
      dbQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };
    
    // 提供API给应用代码调用
    global.performanceProfiler = {
      incrementMetric: (name, value = 1) => {
        if (customMetrics.hasOwnProperty(name)) {
          customMetrics[name] += value;
        } else {
          customMetrics[name] = value;
        }
      },
      
      recordTiming: (name, duration) => {
        if (!customMetrics.timings) {
          customMetrics.timings = {};
        }
        
        if (!customMetrics.timings[name]) {
          customMetrics.timings[name] = [];
        }
        
        customMetrics.timings[name].push({
          timestamp: Date.now(),
          duration: duration
        });
      }
    };

    this.profilers.set('custom', {
      metrics: customMetrics,
      stop: () => {
        delete global.performanceProfiler;
        console.log('📊 自定义指标收集完成');
      }
    });
  }

  getGCTypeName(kind) {
    const gcTypes = {
      1: 'Scavenge',
      2: 'Mark-Sweep-Compact',
      4: 'Incremental-Marking',
      8: 'Weak-Processing',
      16: 'Full-GC'
    };

    return gcTypes[kind] || `Unknown(${kind})`;
  }

  async generateReports() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = path.join(this.options.outputDir, `profile-${timestamp}`);
    
    await fs.mkdir(reportDir, { recursive: true });

    // 生成各种报告
    await this.generateCPUReport(reportDir);
    await this.generateMemoryReport(reportDir);
    await this.generateFunctionReport(reportDir);
    await this.generateCustomMetricsReport(reportDir);
    await this.generateSummaryReport(reportDir);

    if (this.options.enableFlameGraph) {
      await this.generateFlameGraph(reportDir);
    }

    console.log(`📋 性能报告已生成: ${reportDir}`);
  }

  async generateCPUReport(reportDir) {
    const cpuProfiler = this.profilers.get('cpu');
    if (!cpuProfiler) return;

    const samples = cpuProfiler.samples;
    const report = {
      summary: {
        totalSamples: samples.length,
        duration: Date.now() - this.startTime,
        avgUser: samples.reduce((sum, s) => sum + s.user, 0) / samples.length,
        avgSystem: samples.reduce((sum, s) => sum + s.system, 0) / samples.length,
        maxUser: Math.max(...samples.map(s => s.user)),
        maxSystem: Math.max(...samples.map(s => s.system))
      },
      samples: samples
    };

    await fs.writeFile(
      path.join(reportDir, 'cpu-profile.json'),
      JSON.stringify(report, null, 2)
    );

    // 生成CSV格式
    const csvLines = ['timestamp,user,system,total'];
    samples.forEach(sample => {
      csvLines.push(`${sample.timestamp},${sample.user.toFixed(2)},${sample.system.toFixed(2)},${(sample.user + sample.system).toFixed(2)}`);
    });

    await fs.writeFile(
      path.join(reportDir, 'cpu-profile.csv'),
      csvLines.join('\n')
    );
  }

  async generateMemoryReport(reportDir) {
    const memoryProfiler = this.profilers.get('memory');
    if (!memoryProfiler) return;

    const samples = memoryProfiler.samples;
    const gcEvents = memoryProfiler.gcEvents;

    const report = {
      summary: {
        totalSamples: samples.length,
        gcEvents: gcEvents.length,
        peakHeapUsed: Math.max(...samples.map(s => s.heapUsed)),
        peakRSS: Math.max(...samples.map(s => s.rss)),
        avgHeapUtilization: samples.reduce((sum, s) => sum + s.heapUtilization, 0) / samples.length,
        totalGCTime: gcEvents.reduce((sum, gc) => sum + gc.duration, 0)
      },
      memoryTimeline: samples,
      gcTimeline: gcEvents
    };

    await fs.writeFile(
      path.join(reportDir, 'memory-profile.json'),
      JSON.stringify(report, null, 2)
    );

    // 生成内存使用CSV
    const memoryCSV = ['timestamp,heapUsed,heapTotal,rss,external,heapUtilization'];
    samples.forEach(sample => {
      memoryCSV.push(`${sample.timestamp},${sample.heapUsed},${sample.heapTotal},${sample.rss},${sample.external},${sample.heapUtilization.toFixed(2)}`);
    });

    await fs.writeFile(
      path.join(reportDir, 'memory-timeline.csv'),
      memoryCSV.join('\n')
    );

    // 生成GC事件CSV
    const gcCSV = ['timestamp,duration,type,kind'];
    gcEvents.forEach(gc => {
      gcCSV.push(`${gc.timestamp},${gc.duration},${gc.type},${gc.kind}`);
    });

    await fs.writeFile(
      path.join(reportDir, 'gc-events.csv'),
      gcCSV.join('\n')
    );
  }

  async generateFunctionReport(reportDir) {
    const functionProfiler = this.profilers.get('functions');
    if (!functionProfiler) return;

    const functionCalls = functionProfiler.calls;
    const report = {
      summary: {
        totalFunctions: functionCalls.size,
        totalCalls: Array.from(functionCalls.values()).reduce((sum, stats) => sum + stats.count, 0)
      },
      functions: {}
    };

    // 转换为可序列化格式
    for (const [name, stats] of functionCalls) {
      report.functions[name] = {
        count: stats.count,
        totalTime: stats.totalTime,
        avgTime: stats.totalTime / stats.count,
        minTime: stats.minTime,
        maxTime: stats.maxTime,
        calls: stats.calls.slice(-100) // 只保留最近100次调用
      };
    }

    await fs.writeFile(
      path.join(reportDir, 'function-profile.json'),
      JSON.stringify(report, null, 2)
    );

    // 生成函数性能排序CSV
    const sortedFunctions = Array.from(functionCalls.entries())
      .sort(([, a], [, b]) => b.totalTime - a.totalTime);

    const functionCSV = ['function,count,totalTime,avgTime,minTime,maxTime'];
    sortedFunctions.forEach(([name, stats]) => {
      functionCSV.push(`${name},${stats.count},${stats.totalTime.toFixed(2)},${(stats.totalTime / stats.count).toFixed(2)},${stats.minTime.toFixed(2)},${stats.maxTime.toFixed(2)}`);
    });

    await fs.writeFile(
      path.join(reportDir, 'function-performance.csv'),
      functionCSV.join('\n')
    );
  }

  async generateCustomMetricsReport(reportDir) {
    const customProfiler = this.profilers.get('custom');
    if (!customProfiler) return;

    const metrics = customProfiler.metrics;
    
    await fs.writeFile(
      path.join(reportDir, 'custom-metrics.json'),
      JSON.stringify(metrics, null, 2)
    );
  }

  async generateSummaryReport(reportDir) {
    const summary = {
      profilingSession: {
        startTime: this.startTime,
        endTime: Date.now(),
        duration: Date.now() - this.startTime,
        profilers: Array.from(this.profilers.keys())
      },
      recommendations: this.generateRecommendations()
    };

    await fs.writeFile(
      path.join(reportDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // 生成HTML报告
    const htmlReport = this.generateHTMLReport(summary);
    await fs.writeFile(
      path.join(reportDir, 'report.html'),
      htmlReport
    );
  }

  generateRecommendations() {
    const recommendations = [];
    
    // CPU建议
    const cpuProfiler = this.profilers.get('cpu');
    if (cpuProfiler) {
      const avgCPU = cpuProfiler.samples.reduce((sum, s) => sum + s.user + s.system, 0) / cpuProfiler.samples.length;
      if (avgCPU > 80) {
        recommendations.push({
          type: 'cpu',
          severity: 'high',
          message: 'CPU使用率过高，考虑优化算法或使用Worker线程'
        });
      }
    }

    // 内存建议
    const memoryProfiler = this.profilers.get('memory');
    if (memoryProfiler) {
      const avgUtilization = memoryProfiler.samples.reduce((sum, s) => sum + s.heapUtilization, 0) / memoryProfiler.samples.length;
      if (avgUtilization > 90) {
        recommendations.push({
          type: 'memory',
          severity: 'high',
          message: '内存利用率过高，检查内存泄漏或增加堆大小'
        });
      }

      const avgGCTime = memoryProfiler.gcEvents.reduce((sum, gc) => sum + gc.duration, 0) / memoryProfiler.gcEvents.length;
      if (avgGCTime > 50) {
        recommendations.push({
          type: 'gc',
          severity: 'medium',
          message: 'GC时间过长，考虑优化对象生命周期'
        });
      }
    }

    return recommendations;
  }

  generateHTMLReport(summary) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Node.js 性能分析报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #e9ecef; border-radius: 3px; }
        .recommendation { padding: 10px; margin: 5px 0; border-left: 4px solid #ffc107; background: #fff3cd; }
        .recommendation.high { border-color: #dc3545; background: #f8d7da; }
        .recommendation.medium { border-color: #fd7e14; background: #ffeaa7; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Node.js 性能分析报告</h1>
        <p>分析时间: ${new Date(summary.profilingSession.startTime).toLocaleString()} - ${new Date(summary.profilingSession.endTime).toLocaleString()}</p>
        <p>持续时间: ${(summary.profilingSession.duration / 1000).toFixed(2)} 秒</p>
        <p>分析器: ${summary.profilingSession.profilers.join(', ')}</p>
    </div>

    <div class="section">
        <h2>📋 优化建议</h2>
        ${summary.recommendations.map(rec => `
            <div class="recommendation ${rec.severity}">
                <strong>${rec.type.toUpperCase()}</strong>: ${rec.message}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>📊 详细报告文件</h2>
        <ul>
            <li><a href="cpu-profile.json">CPU分析报告 (JSON)</a></li>
            <li><a href="memory-profile.json">内存分析报告 (JSON)</a></li>
            <li><a href="function-profile.json">函数调用分析 (JSON)</a></li>
            <li><a href="custom-metrics.json">自定义指标 (JSON)</a></li>
        </ul>
    </div>
</body>
</html>`;
  }

  async generateFlameGraph(reportDir) {
    // 生成火焰图数据（简化版）
    const cpuProfiler = this.profilers.get('cpu');
    if (!cpuProfiler) return;

    const flameData = {
      name: 'root',
      value: cpuProfiler.samples.length,
      children: [
        {
          name: 'user',
          value: Math.floor(cpuProfiler.samples.reduce((sum, s) => sum + s.user, 0))
        },
        {
          name: 'system', 
          value: Math.floor(cpuProfiler.samples.reduce((sum, s) => sum + s.system, 0))
        }
      ]
    };

    await fs.writeFile(
      path.join(reportDir, 'flame-graph.json'),
      JSON.stringify(flameData, null, 2)
    );
  }
}

module.exports = AdvancedPerformanceProfiler;
```

## 🔧 第三方性能工具集成

### Clinic.js集成

```javascript
// clinic-integration.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class ClinicIntegration {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './clinic-reports',
      tools: options.tools || ['doctor', 'bubbleprof', 'flame'],
      ...options
    };
  }

  async runDiagnosis(scriptPath, args = []) {
    console.log('🏥 开始Clinic.js诊断...');
    
    const results = {};
    
    for (const tool of this.options.tools) {
      console.log(`🔍 运行 clinic ${tool}...`);
      
      try {
        const result = await this.runClinicTool(tool, scriptPath, args);
        results[tool] = result;
        console.log(`✅ ${tool} 分析完成`);
      } catch (error) {
        console.error(`❌ ${tool} 分析失败:`, error.message);
        results[tool] = { error: error.message };
      }
    }
    
    // 生成综合报告
    await this.generateComprehensiveReport(results);
    
    return results;
  }

  async runClinicTool(tool, scriptPath, args) {
    return new Promise((resolve, reject) => {
      const clinicArgs = [tool, '--dest', this.options.outputDir, scriptPath, ...args];
      const clinic = spawn('clinic', clinicArgs, {
        stdio: 'pipe',
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      clinic.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      clinic.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      clinic.on('close', (code) => {
        if (code === 0) {
          resolve({
            tool,
            stdout,
            stderr,
            exitCode: code,
            reportPath: this.getReportPath(tool)
          });
        } else {
          reject(new Error(`Clinic ${tool} 退出码: ${code}\n${stderr}`));
        }
      });

      clinic.on('error', (error) => {
        reject(new Error(`启动 clinic ${tool} 失败: ${error.message}`));
      });
    });
  }

  getReportPath(tool) {
    // Clinic.js 生成的报告路径模式
    return path.join(this.options.outputDir, `clinic-${tool}-*.html`);
  }

  async generateComprehensiveReport(results) {
    const reportPath = path.join(this.options.outputDir, 'comprehensive-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      tools: results,
      summary: this.generateSummary(results),
      recommendations: this.generateRecommendations(results)
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 综合报告已生成: ${reportPath}`);
  }

  generateSummary(results) {
    const summary = {
      toolsRun: Object.keys(results).length,
      successful: Object.values(results).filter(r => !r.error).length,
      failed: Object.values(results).filter(r => r.error).length
    };

    return summary;
  }

  generateRecommendations(results) {
    const recommendations = [];

    // 基于工具结果生成建议
    if (results.doctor && !results.doctor.error) {
      recommendations.push({
        tool: 'doctor',
        message: '查看Doctor报告了解事件循环延迟和CPU使用情况'
      });
    }

    if (results.bubbleprof && !results.bubbleprof.error) {
      recommendations.push({
        tool: 'bubbleprof',
        message: '查看Bubbleprof报告了解异步操作性能'
      });
    }

    if (results.flame && !results.flame.error) {
      recommendations.push({
        tool: 'flame',
        message: '查看火焰图了解CPU热点和函数调用分布'
      });
    }

    return recommendations;
  }
}

// 性能基准测试套件
class PerformanceBenchmarkSuite {
  constructor() {
    this.benchmarks = new Map();
    this.results = [];
  }

  addBenchmark(name, fn, options = {}) {
    this.benchmarks.set(name, {
      fn,
      iterations: options.iterations || 1000,
      warmup: options.warmup || 100,
      timeout: options.timeout || 30000
    });
  }

  async runAll() {
    console.log('🏃 开始性能基准测试套件...\n');
    
    for (const [name, config] of this.benchmarks) {
      console.log(`测试: ${name}`);
      
      try {
        const result = await this.runBenchmark(name, config);
        this.results.push(result);
        
        console.log(`  ✅ 完成: ${result.avgTime.toFixed(4)}ms 平均, ${result.opsPerSecond} ops/sec\n`);
      } catch (error) {
        console.error(`  ❌ 失败: ${error.message}\n`);
        this.results.push({
          name,
          error: error.message,
          success: false
        });
      }
    }

    this.displayResults();
    return this.results;
  }

  async runBenchmark(name, config) {
    const { fn, iterations, warmup, timeout } = config;

    // 预热
    for (let i = 0; i < warmup; i++) {
      await fn();
    }

    const times = [];
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const iterStart = process.hrtime.bigint();
      await fn();
      const iterEnd = process.hrtime.bigint();
      
      times.push(Number(iterEnd - iterStart) / 1000000); // 转换为毫秒
      
      // 超时检查
      if (Date.now() - startTime > timeout) {
        throw new Error(`基准测试超时: ${name}`);
      }
    }

    const totalTime = Date.now() - startTime;
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // 计算标准差
    const variance = times.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);

    return {
      name,
      success: true,
      iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      stdDev,
      opsPerSecond: Math.round(iterations / (totalTime / 1000)),
      times: times.slice(0, 100) // 保留前100个样本
    };
  }

  displayResults() {
    console.log('📊 基准测试结果汇总:');
    console.log('='.repeat(80));
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    if (successful.length > 0) {
      // 按平均时间排序
      successful.sort((a, b) => a.avgTime - b.avgTime);
      
      console.log('\n🏆 成功的测试 (按性能排序):');
      successful.forEach((result, index) => {
        const rank = index + 1;
        const speedup = index === 0 ? '1.00x' : `${(successful[0].avgTime / result.avgTime).toFixed(2)}x`;
        
        console.log(`${rank}. ${result.name}:`);
        console.log(`   平均时间: ${result.avgTime.toFixed(4)}ms`);
        console.log(`   吞吐量: ${result.opsPerSecond} ops/sec`);
        console.log(`   标准差: ${result.stdDev.toFixed(4)}ms`);
        console.log(`   相对速度: ${speedup} ${index === 0 ? '(最快)' : '(相对最快)'}`);
        console.log('');
      });
    }
    
    if (failed.length > 0) {
      console.log('❌ 失败的测试:');
      failed.forEach(result => {
        console.log(`- ${result.name}: ${result.error}`);
      });
    }
    
    console.log(`\n📈 总结: ${successful.length} 成功, ${failed.length} 失败`);
  }

  exportResults(filePath) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length
      },
      results: this.results
    };

    require('fs').writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`📄 结果已导出到: ${filePath}`);
  }
}

module.exports = {
  ClinicIntegration,
  PerformanceBenchmarkSuite
};
```

Node.js性能分析工具为开发者提供了强大的性能诊断能力，通过合理使用这些工具可以快速定位和解决性能问题！
