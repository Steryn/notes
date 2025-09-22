# 性能优化与监控

## 🎯 学习目标

- 掌握Node.js性能分析工具的使用
- 学会识别性能瓶颈
- 理解火焰图分析方法
- 掌握性能优化技巧

## 📚 核心概念

### 性能分析的重要性

性能分析是Node.js应用优化的关键步骤，通过分析可以：

- 识别CPU密集型操作
- 发现内存泄漏
- 优化I/O操作
- 提升整体响应速度

### 常用性能分析工具

1. **Node.js内置profiler**
2. **Clinic.js**
3. **0x火焰图**
4. **V8 profiler**

## 🛠️ 实践案例

### 1. Node.js内置Profiler

```javascript
// performance-profiler.js
const fs = require('fs');
const path = require('path');

class PerformanceProfiler {
  constructor() {
    this.startTime = null;
    this.marks = new Map();
  }

  // 开始性能分析
  start(label = 'default') {
    this.startTime = process.hrtime.bigint();
    this.marks.set(label, this.startTime);
    console.log(`🚀 开始性能分析: ${label}`);
  }

  // 标记时间点
  mark(label) {
    const now = process.hrtime.bigint();
    this.marks.set(label, now);
    console.log(`📍 标记: ${label}`);
  }

  // 测量时间间隔
  measure(startLabel, endLabel) {
    const start = this.marks.get(startLabel);
    const end = this.marks.get(endLabel);
    
    if (!start || !end) {
      throw new Error('标记不存在');
    }

    const duration = Number(end - start) / 1000000; // 转换为毫秒
    console.log(`⏱️  ${startLabel} -> ${endLabel}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  // 内存使用情况
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100
    };
  }

  // 生成性能报告
  generateReport() {
    console.log('\n📊 性能报告');
    console.log('='.repeat(50));
    
    const memory = this.getMemoryUsage();
    console.log('内存使用情况:');
    console.log(`  RSS: ${memory.rss} MB`);
    console.log(`  Heap Total: ${memory.heapTotal} MB`);
    console.log(`  Heap Used: ${memory.heapUsed} MB`);
    console.log(`  External: ${memory.external} MB`);
    
    console.log('\nCPU使用情况:');
    const cpuUsage = process.cpuUsage();
    console.log(`  User: ${cpuUsage.user / 1000}ms`);
    console.log(`  System: ${cpuUsage.system / 1000}ms`);
  }
}

module.exports = PerformanceProfiler;
```

## 📝 总结

在这一章中，我们学习了：

1. **性能分析工具**：Node.js内置profiler的使用
2. **内存泄漏检测**：如何识别和解决内存泄漏
3. **CPU性能分析**：CPU使用情况的分析方法
4. **基准测试**：性能测试和比较的方法

## 🔗 下一步

接下来我们将学习：

- [内存管理](./memory.md)
- [并发与异步优化](./concurrency.md)
- [监控与日志](../monitoring/README.md)

继续学习，掌握Node.js性能优化的核心技能！🚀
