# 垃圾回收

## 🎯 学习目标

- 深入理解V8垃圾收集机制
- 掌握不同GC算法的特点和应用
- 学会GC性能优化和调优
- 了解内存分代管理原理

## 📚 核心概念

### V8垃圾收集器架构

```javascript
// V8 GC架构概述
const v8GCArchitecture = {
  newSpace: {
    name: '新生代空间',
    algorithm: 'Scavenge (复制算法)',
    size: '1-8MB',
    frequency: '高频率，低延迟',
    targetObjects: '短生命周期对象'
  },
  oldSpace: {
    name: '老生代空间',
    algorithm: 'Mark-Sweep-Compact',
    size: '可扩展',
    frequency: '低频率，可能高延迟',
    targetObjects: '长生命周期对象'
  },
  largeObjectSpace: {
    name: '大对象空间',
    algorithm: 'Mark-Sweep',
    condition: '对象大小 > 512KB',
    feature: '不移动对象'
  }
};

// GC触发条件
const gcTriggers = {
  allocationFailure: '分配失败时触发',
  heapLimit: '接近堆内存限制',
  periodicGC: '定期GC',
  explicitCall: '显式调用 global.gc()'
};

console.log('V8 GC架构:', v8GCArchitecture);
```

### 分代垃圾收集

```javascript
// 分代GC模拟器
class GenerationalGC {
  constructor() {
    this.newGeneration = {
      fromSpace: new Set(),
      toSpace: new Set(),
      capacity: 1024 * 1024, // 1MB
      used: 0
    };
    
    this.oldGeneration = {
      objects: new Set(),
      capacity: 10 * 1024 * 1024, // 10MB
      used: 0,
      markedObjects: new Set()
    };
    
    this.stats = {
      minorGCCount: 0,
      majorGCCount: 0,
      totalGCTime: 0,
      objectsPromoted: 0,
      objectsCollected: 0
    };
  }

  // 分配对象
  allocateObject(size, lifetime = 'short') {
    const obj = {
      id: Math.random().toString(36).substr(2, 9),
      size,
      lifetime,
      age: 0,
      allocatedAt: Date.now(),
      references: new Set()
    };

    if (lifetime === 'long' || this.newGeneration.used + size > this.newGeneration.capacity) {
      // 直接分配到老生代或新生代空间不足
      this.allocateToOldGeneration(obj);
    } else {
      // 分配到新生代
      this.allocateToNewGeneration(obj);
    }

    return obj;
  }

  allocateToNewGeneration(obj) {
    this.newGeneration.fromSpace.add(obj);
    this.newGeneration.used += obj.size;
    
    console.log(`📦 新生代分配: ${obj.id} (${obj.size}字节)`);
    
    // 检查是否需要Minor GC
    if (this.newGeneration.used > this.newGeneration.capacity * 0.8) {
      this.performMinorGC();
    }
  }

  allocateToOldGeneration(obj) {
    this.oldGeneration.objects.add(obj);
    this.oldGeneration.used += obj.size;
    
    console.log(`📦 老生代分配: ${obj.id} (${obj.size}字节)`);
    
    // 检查是否需要Major GC
    if (this.oldGeneration.used > this.oldGeneration.capacity * 0.8) {
      this.performMajorGC();
    }
  }

  // Minor GC (Scavenge算法)
  performMinorGC() {
    console.log('🔄 执行Minor GC (Scavenge)...');
    const startTime = Date.now();
    
    // 1. 标记阶段：找到所有可达对象
    const reachableObjects = this.findReachableObjectsInNewGen();
    
    // 2. 复制阶段：将存活对象复制到toSpace
    for (const obj of reachableObjects) {
      obj.age++;
      
      // 晋升策略：年龄超过阈值或toSpace空间不足
      if (obj.age >= 2 || this.shouldPromoteToOldGen(obj)) {
        this.promoteToOldGeneration(obj);
      } else {
        this.newGeneration.toSpace.add(obj);
      }
    }
    
    // 3. 清理阶段：清空fromSpace，交换fromSpace和toSpace
    const collected = this.newGeneration.fromSpace.size - reachableObjects.length;
    this.newGeneration.fromSpace.clear();
    
    // 交换空间
    const temp = this.newGeneration.fromSpace;
    this.newGeneration.fromSpace = this.newGeneration.toSpace;
    this.newGeneration.toSpace = temp;
    
    // 更新统计
    const gcTime = Date.now() - startTime;
    this.stats.minorGCCount++;
    this.stats.totalGCTime += gcTime;
    this.stats.objectsCollected += collected;
    
    // 重新计算新生代使用量
    this.updateNewGenerationUsage();
    
    console.log(`✅ Minor GC完成: 耗时${gcTime}ms, 收集${collected}个对象`);
  }

  // Major GC (Mark-Sweep-Compact算法)
  performMajorGC() {
    console.log('🔄 执行Major GC (Mark-Sweep-Compact)...');
    const startTime = Date.now();
    
    // 1. 标记阶段
    this.markPhase();
    
    // 2. 清扫阶段
    const collected = this.sweepPhase();
    
    // 3. 压缩阶段（可选）
    if (this.shouldCompact()) {
      this.compactPhase();
    }
    
    const gcTime = Date.now() - startTime;
    this.stats.majorGCCount++;
    this.stats.totalGCTime += gcTime;
    this.stats.objectsCollected += collected;
    
    console.log(`✅ Major GC完成: 耗时${gcTime}ms, 收集${collected}个对象`);
  }

  // 标记阶段
  markPhase() {
    console.log('  🏷️ 标记阶段...');
    this.oldGeneration.markedObjects.clear();
    
    // 从根对象开始标记
    const rootObjects = this.getRootObjects();
    const workList = [...rootObjects];
    
    while (workList.length > 0) {
      const obj = workList.pop();
      
      if (!this.oldGeneration.markedObjects.has(obj)) {
        this.oldGeneration.markedObjects.add(obj);
        
        // 标记所有引用的对象
        for (const ref of obj.references) {
          if (this.oldGeneration.objects.has(ref)) {
            workList.push(ref);
          }
        }
      }
    }
    
    console.log(`    标记了 ${this.oldGeneration.markedObjects.size} 个对象`);
  }

  // 清扫阶段
  sweepPhase() {
    console.log('  🧹 清扫阶段...');
    let collected = 0;
    let freedBytes = 0;
    
    for (const obj of this.oldGeneration.objects) {
      if (!this.oldGeneration.markedObjects.has(obj)) {
        // 未标记的对象可以被回收
        this.oldGeneration.objects.delete(obj);
        freedBytes += obj.size;
        collected++;
      }
    }
    
    this.oldGeneration.used -= freedBytes;
    console.log(`    回收了 ${collected} 个对象，释放 ${freedBytes} 字节`);
    
    return collected;
  }

  // 压缩阶段
  compactPhase() {
    console.log('  📦 压缩阶段...');
    
    // 模拟内存压缩：重新排列对象以减少碎片
    const compactedObjects = Array.from(this.oldGeneration.objects);
    
    // 按对象大小排序，减少内存碎片
    compactedObjects.sort((a, b) => b.size - a.size);
    
    console.log(`    压缩了 ${compactedObjects.length} 个对象`);
  }

  // 辅助方法
  findReachableObjectsInNewGen() {
    // 简化实现：假设所有对象都是可达的
    // 实际实现中需要从根对象遍历引用图
    return Array.from(this.newGeneration.fromSpace);
  }

  shouldPromoteToOldGen(obj) {
    // 晋升策略：大对象或多次存活的对象
    return obj.size > 1024 || obj.age >= 1;
  }

  promoteToOldGeneration(obj) {
    this.oldGeneration.objects.add(obj);
    this.oldGeneration.used += obj.size;
    this.stats.objectsPromoted++;
    
    console.log(`⬆️ 对象晋升到老生代: ${obj.id}`);
  }

  getRootObjects() {
    // 模拟根对象：全局变量、栈变量等
    const roots = [];
    
    // 从老生代中随机选择一些对象作为根
    const oldGenArray = Array.from(this.oldGeneration.objects);
    const rootCount = Math.min(5, oldGenArray.length);
    
    for (let i = 0; i < rootCount; i++) {
      roots.push(oldGenArray[Math.floor(Math.random() * oldGenArray.length)]);
    }
    
    return roots;
  }

  shouldCompact() {
    // 简单的压缩策略：当老生代使用率较低但对象数量较多时
    const objectCount = this.oldGeneration.objects.size;
    const averageObjectSize = this.oldGeneration.used / objectCount;
    
    return averageObjectSize < 1000 && objectCount > 100;
  }

  updateNewGenerationUsage() {
    this.newGeneration.used = 0;
    for (const obj of this.newGeneration.fromSpace) {
      this.newGeneration.used += obj.size;
    }
  }

  // 创建对象间的引用关系
  createReference(objA, objB) {
    objA.references.add(objB);
  }

  // 获取GC统计信息
  getGCStats() {
    return {
      ...this.stats,
      newGeneration: {
        objects: this.newGeneration.fromSpace.size,
        used: this.newGeneration.used,
        capacity: this.newGeneration.capacity,
        utilization: (this.newGeneration.used / this.newGeneration.capacity * 100).toFixed(2) + '%'
      },
      oldGeneration: {
        objects: this.oldGeneration.objects.size,
        used: this.oldGeneration.used,
        capacity: this.oldGeneration.capacity,
        utilization: (this.oldGeneration.used / this.oldGeneration.capacity * 100).toFixed(2) + '%'
      },
      averageGCTime: this.stats.totalGCTime / (this.stats.minorGCCount + this.stats.majorGCCount)
    };
  }
}

// 使用示例
const gc = new GenerationalGC();

// 模拟对象分配和GC
console.log('🚀 开始GC模拟...\n');

// 分配一些短生命周期对象
for (let i = 0; i < 20; i++) {
  const obj = gc.allocateObject(Math.random() * 1000 + 100, 'short');
}

// 分配一些长生命周期对象
for (let i = 0; i < 5; i++) {
  const obj = gc.allocateObject(Math.random() * 2000 + 500, 'long');
}

// 创建一些引用关系
const objects = [...gc.newGeneration.fromSpace, ...gc.oldGeneration.objects];
for (let i = 0; i < 10 && objects.length > 1; i++) {
  const objA = objects[Math.floor(Math.random() * objects.length)];
  const objB = objects[Math.floor(Math.random() * objects.length)];
  if (objA !== objB) {
    gc.createReference(objA, objB);
  }
}

// 显示最终统计
setTimeout(() => {
  console.log('\n📊 GC统计信息:');
  console.log(JSON.stringify(gc.getGCStats(), null, 2));
}, 1000);
```

## 🛠️ GC性能监控

### 实时GC监控

```javascript
// GC性能监控器
class GCPerformanceMonitor {
  constructor() {
    this.gcEvents = [];
    this.isMonitoring = false;
    this.performanceObserver = null;
    this.metrics = {
      totalGCTime: 0,
      gcCount: 0,
      maxPause: 0,
      avgPause: 0,
      gcTypes: {}
    };
  }

  startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ GC监控已在运行');
      return;
    }

    console.log('📊 开始GC性能监控...');
    this.isMonitoring = true;

    // 使用PerformanceObserver监控GC事件
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          if (entry.entryType === 'gc') {
            this.recordGCEvent(entry);
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['gc'] });
    } else {
      console.warn('⚠️ PerformanceObserver不可用，使用模拟监控');
      this.startSimulatedMonitoring();
    }

    // 定期输出GC统计
    this.statsInterval = setInterval(() => {
      this.logGCStats();
    }, 10000);
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;

    console.log('⏹️ 停止GC监控');
    this.isMonitoring = false;

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  recordGCEvent(entry) {
    const gcEvent = {
      timestamp: entry.startTime + entry.timeOrigin,
      duration: entry.duration,
      kind: entry.detail?.kind || 'unknown',
      type: this.getGCTypeName(entry.detail?.kind)
    };

    this.gcEvents.push(gcEvent);
    
    // 更新指标
    this.updateMetrics(gcEvent);
    
    console.log(`🗑️ GC事件: ${gcEvent.type}, 耗时: ${gcEvent.duration.toFixed(2)}ms`);
    
    // 如果暂停时间过长，发出警告
    if (gcEvent.duration > 50) {
      console.warn(`⚠️ 长GC暂停: ${gcEvent.duration.toFixed(2)}ms (${gcEvent.type})`);
    }

    // 保持事件历史在合理范围内
    if (this.gcEvents.length > 1000) {
      this.gcEvents = this.gcEvents.slice(-500);
    }
  }

  updateMetrics(gcEvent) {
    this.metrics.totalGCTime += gcEvent.duration;
    this.metrics.gcCount++;
    this.metrics.maxPause = Math.max(this.metrics.maxPause, gcEvent.duration);
    this.metrics.avgPause = this.metrics.totalGCTime / this.metrics.gcCount;

    // 按类型统计
    if (!this.metrics.gcTypes[gcEvent.type]) {
      this.metrics.gcTypes[gcEvent.type] = {
        count: 0,
        totalTime: 0,
        maxPause: 0,
        avgPause: 0
      };
    }

    const typeStats = this.metrics.gcTypes[gcEvent.type];
    typeStats.count++;
    typeStats.totalTime += gcEvent.duration;
    typeStats.maxPause = Math.max(typeStats.maxPause, gcEvent.duration);
    typeStats.avgPause = typeStats.totalTime / typeStats.count;
  }

  getGCTypeName(kind) {
    const gcTypes = {
      1: 'Scavenge',
      2: 'Mark-Sweep-Compact',
      4: 'Incremental Marking',
      8: 'Weak Processing',
      16: 'Full GC'
    };

    return gcTypes[kind] || `Unknown(${kind})`;
  }

  startSimulatedMonitoring() {
    // 模拟GC事件（用于演示）
    const simulateGC = () => {
      if (!this.isMonitoring) return;

      // 随机生成GC事件
      const gcTypes = [
        { kind: 1, name: 'Scavenge', probability: 0.7, duration: [1, 10] },
        { kind: 2, name: 'Mark-Sweep-Compact', probability: 0.2, duration: [10, 50] },
        { kind: 16, name: 'Full GC', probability: 0.1, duration: [50, 200] }
      ];

      const random = Math.random();
      let cumulativeProbability = 0;

      for (const gcType of gcTypes) {
        cumulativeProbability += gcType.probability;
        
        if (random <= cumulativeProbability) {
          const duration = gcType.duration[0] + 
            Math.random() * (gcType.duration[1] - gcType.duration[0]);
          
          this.recordGCEvent({
            startTime: Date.now(),
            timeOrigin: 0,
            duration,
            detail: { kind: gcType.kind }
          });
          
          break;
        }
      }

      // 随机间隔后再次模拟
      setTimeout(simulateGC, Math.random() * 5000 + 1000);
    };

    simulateGC();
  }

  logGCStats() {
    if (this.metrics.gcCount === 0) {
      console.log('📊 暂无GC统计数据');
      return;
    }

    console.log('\n📊 GC性能统计:');
    console.log(`  总GC次数: ${this.metrics.gcCount}`);
    console.log(`  总GC时间: ${this.metrics.totalGCTime.toFixed(2)}ms`);
    console.log(`  平均暂停: ${this.metrics.avgPause.toFixed(2)}ms`);
    console.log(`  最大暂停: ${this.metrics.maxPause.toFixed(2)}ms`);
    
    console.log('\n  按类型统计:');
    for (const [type, stats] of Object.entries(this.metrics.gcTypes)) {
      console.log(`    ${type}: ${stats.count}次, 平均${stats.avgPause.toFixed(2)}ms, 最大${stats.maxPause.toFixed(2)}ms`);
    }
    
    // 性能建议
    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      console.log('\n💡 性能建议:');
      recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
    
    console.log('');
  }

  generateRecommendations() {
    const recommendations = [];

    // 平均暂停时间过长
    if (this.metrics.avgPause > 20) {
      recommendations.push('平均GC暂停时间较长，考虑减少对象分配或优化对象生命周期');
    }

    // 最大暂停时间过长
    if (this.metrics.maxPause > 100) {
      recommendations.push('检测到长GC暂停，可能影响应用响应性，考虑启用增量GC');
    }

    // GC频率过高
    const scavengeStats = this.metrics.gcTypes['Scavenge'];
    if (scavengeStats && scavengeStats.count > 100) {
      recommendations.push('Minor GC频率较高，考虑增加新生代大小或减少短期对象分配');
    }

    // Full GC过多
    const fullGCStats = this.metrics.gcTypes['Full GC'];
    if (fullGCStats && fullGCStats.count > 10) {
      recommendations.push('Full GC次数较多，检查是否存在内存泄漏或内存压力');
    }

    return recommendations;
  }

  getDetailedReport() {
    const recentEvents = this.gcEvents.slice(-50);
    
    return {
      summary: this.metrics,
      recentEvents,
      timeline: this.generateTimeline(),
      recommendations: this.generateRecommendations(),
      memoryPressure: this.analyzeMemoryPressure()
    };
  }

  generateTimeline() {
    const now = Date.now();
    const timeWindows = [
      { name: '最近1分钟', duration: 60 * 1000 },
      { name: '最近5分钟', duration: 5 * 60 * 1000 },
      { name: '最近15分钟', duration: 15 * 60 * 1000 }
    ];

    return timeWindows.map(window => {
      const windowStart = now - window.duration;
      const eventsInWindow = this.gcEvents.filter(
        event => event.timestamp >= windowStart
      );

      const totalTime = eventsInWindow.reduce(
        (sum, event) => sum + event.duration, 0
      );

      return {
        name: window.name,
        gcCount: eventsInWindow.length,
        totalTime: totalTime.toFixed(2),
        avgPause: eventsInWindow.length > 0 
          ? (totalTime / eventsInWindow.length).toFixed(2) 
          : 0
      };
    });
  }

  analyzeMemoryPressure() {
    const currentMemory = process.memoryUsage();
    const heapUtilization = (currentMemory.heapUsed / currentMemory.heapTotal) * 100;
    
    let pressure = 'low';
    if (heapUtilization > 80) {
      pressure = 'high';
    } else if (heapUtilization > 60) {
      pressure = 'medium';
    }

    return {
      heapUtilization: heapUtilization.toFixed(2) + '%',
      pressure,
      currentMemory: {
        heapUsed: (currentMemory.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
        heapTotal: (currentMemory.heapTotal / 1024 / 1024).toFixed(2) + 'MB',
        external: (currentMemory.external / 1024 / 1024).toFixed(2) + 'MB'
      }
    };
  }
}

// 使用示例
const gcMonitor = new GCPerformanceMonitor();
gcMonitor.startMonitoring();

// 模拟一些内存密集操作来触发GC
const createMemoryPressure = () => {
  const arrays = [];
  
  const interval = setInterval(() => {
    // 创建大量对象
    const largeArray = new Array(100000).fill(0).map((_, i) => ({
      id: i,
      data: 'x'.repeat(100),
      timestamp: Date.now()
    }));
    
    arrays.push(largeArray);
    
    // 随机释放一些数组
    if (arrays.length > 10 && Math.random() > 0.7) {
      arrays.splice(0, 3);
    }
    
    console.log(`📦 当前数组数量: ${arrays.length}`);
    
  }, 2000);
  
  // 20秒后停止并生成报告
  setTimeout(() => {
    clearInterval(interval);
    
    console.log('\n📋 生成详细GC报告...');
    const report = gcMonitor.getDetailedReport();
    
    console.log('\n📈 时间线统计:');
    report.timeline.forEach(window => {
      console.log(`  ${window.name}: ${window.gcCount}次GC, 总计${window.totalTime}ms, 平均${window.avgPause}ms`);
    });
    
    console.log('\n🎯 内存压力分析:');
    console.log(`  堆利用率: ${report.memoryPressure.heapUtilization}`);
    console.log(`  压力等级: ${report.memoryPressure.pressure}`);
    console.log(`  当前内存: ${JSON.stringify(report.memoryPressure.currentMemory, null, 4)}`);
    
    gcMonitor.stopMonitoring();
    
  }, 20000);
};

// 启动内存压力测试
setTimeout(createMemoryPressure, 3000);
```

## 🎯 GC优化策略

### GC调优参数

```javascript
// GC调优配置管理器
class GCTuningManager {
  constructor() {
    this.defaultSettings = {
      // 堆大小设置
      maxOldSpaceSize: 1400, // MB
      maxSemiSpaceSize: 16,  // MB (新生代单个半空间)
      
      // GC行为控制
      exposeGC: true,
      traceGC: false,
      traceGCVerbose: false,
      
      // 优化选项
      optimize: true,
      alwaysCompact: false,
      neverCompact: false,
      
      // 增量标记
      incrementalMarking: true,
      incrementalMarkingWrappers: true
    };
    
    this.currentSettings = { ...this.defaultSettings };
    this.recommendations = [];
  }

  // 分析应用特征并推荐GC设置
  analyzeAndRecommend(appProfile) {
    console.log('🔍 分析应用特征...');
    
    const {
      memoryUsagePattern,
      objectLifetime,
      allocationRate,
      responseTimeRequirement
    } = appProfile;

    this.recommendations = [];

    // 基于内存使用模式调整
    if (memoryUsagePattern === 'high') {
      this.recommendations.push({
        setting: 'maxOldSpaceSize',
        value: 4096,
        reason: '高内存使用应用，增加老生代空间'
      });
    }

    // 基于对象生命周期调整
    if (objectLifetime === 'short') {
      this.recommendations.push({
        setting: 'maxSemiSpaceSize',
        value: 32,
        reason: '短生命周期对象较多，增加新生代空间'
      });
    }

    // 基于分配速率调整
    if (allocationRate === 'high') {
      this.recommendations.push({
        setting: 'incrementalMarking',
        value: true,
        reason: '高分配速率，启用增量标记减少暂停时间'
      });
    }

    // 基于响应时间要求调整
    if (responseTimeRequirement === 'strict') {
      this.recommendations.push({
        setting: 'alwaysCompact',
        value: false,
        reason: '严格响应时间要求，避免压缩操作'
      });
      
      this.recommendations.push({
        setting: 'traceGC',
        value: false,
        reason: '严格响应时间要求，关闭GC追踪'
      });
    }

    return this.recommendations;
  }

  // 应用推荐设置
  applyRecommendations() {
    console.log('⚙️ 应用GC调优建议...');
    
    for (const rec of this.recommendations) {
      this.currentSettings[rec.setting] = rec.value;
      console.log(`  设置 ${rec.setting} = ${rec.value} (${rec.reason})`);
    }
  }

  // 生成Node.js启动参数
  generateNodeFlags() {
    const flags = [];

    // 堆大小设置
    if (this.currentSettings.maxOldSpaceSize !== this.defaultSettings.maxOldSpaceSize) {
      flags.push(`--max-old-space-size=${this.currentSettings.maxOldSpaceSize}`);
    }

    if (this.currentSettings.maxSemiSpaceSize !== this.defaultSettings.maxSemiSpaceSize) {
      flags.push(`--max-semi-space-size=${this.currentSettings.maxSemiSpaceSize}`);
    }

    // GC控制选项
    if (this.currentSettings.exposeGC) {
      flags.push('--expose-gc');
    }

    if (this.currentSettings.traceGC) {
      flags.push('--trace-gc');
    }

    if (this.currentSettings.traceGCVerbose) {
      flags.push('--trace-gc-verbose');
    }

    // 优化选项
    if (this.currentSettings.optimize) {
      flags.push('--optimize-for-size');
    }

    if (this.currentSettings.alwaysCompact) {
      flags.push('--gc-global');
    }

    if (this.currentSettings.neverCompact) {
      flags.push('--gc-interval=-1');
    }

    // 增量标记
    if (!this.currentSettings.incrementalMarking) {
      flags.push('--noincremental-marking');
    }

    return flags;
  }

  // 性能测试和对比
  async performBenchmark(testFunction, iterations = 1000) {
    console.log(`🏃 开始性能基准测试 (${iterations} 次迭代)...`);
    
    const results = {
      beforeOptimization: null,
      afterOptimization: null
    };

    // 测试当前设置
    results.beforeOptimization = await this.runBenchmark(
      testFunction, 
      iterations, 
      '优化前'
    );

    // 应用优化设置
    this.applyRecommendations();

    // 测试优化后设置
    results.afterOptimization = await this.runBenchmark(
      testFunction, 
      iterations, 
      '优化后'
    );

    // 对比结果
    this.compareBenchmarkResults(results);

    return results;
  }

  async runBenchmark(testFunction, iterations, label) {
    console.log(`  🔄 执行${label}测试...`);
    
    // 预热
    for (let i = 0; i < 100; i++) {
      testFunction();
    }

    // 强制GC以获得干净的起始状态
    if (global.gc) {
      global.gc();
    }

    const startMemory = process.memoryUsage();
    const startTime = process.hrtime.bigint();
    let gcCount = 0;

    // 监控GC次数
    const originalGC = global.gc;
    if (originalGC) {
      global.gc = () => {
        gcCount++;
        return originalGC();
      };
    }

    // 执行测试
    for (let i = 0; i < iterations; i++) {
      testFunction();
    }

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();

    // 恢复原始gc函数
    if (originalGC) {
      global.gc = originalGC;
    }

    const result = {
      label,
      executionTime: Number(endTime - startTime) / 1000000, // 毫秒
      memoryDelta: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external
      },
      gcCount,
      averageIterationTime: Number(endTime - startTime) / 1000000 / iterations
    };

    console.log(`    ⏱️ 总执行时间: ${result.executionTime.toFixed(2)}ms`);
    console.log(`    📊 平均每次: ${result.averageIterationTime.toFixed(4)}ms`);
    console.log(`    🗑️ GC次数: ${result.gcCount}`);
    console.log(`    📈 内存变化: ${(result.memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`);

    return result;
  }

  compareBenchmarkResults(results) {
    const before = results.beforeOptimization;
    const after = results.afterOptimization;

    console.log('\n📊 性能对比结果:');
    
    // 执行时间对比
    const timeImprovement = ((before.executionTime - after.executionTime) / before.executionTime * 100);
    console.log(`  执行时间: ${timeImprovement > 0 ? '提升' : '下降'} ${Math.abs(timeImprovement).toFixed(2)}%`);

    // GC次数对比
    const gcImprovement = before.gcCount - after.gcCount;
    console.log(`  GC次数: ${gcImprovement > 0 ? '减少' : '增加'} ${Math.abs(gcImprovement)} 次`);

    // 内存使用对比
    const memoryImprovement = before.memoryDelta.heapUsed - after.memoryDelta.heapUsed;
    console.log(`  内存使用: ${memoryImprovement > 0 ? '减少' : '增加'} ${Math.abs(memoryImprovement / 1024 / 1024).toFixed(2)}MB`);

    // 综合评分
    let score = 0;
    if (timeImprovement > 0) score += 30;
    if (gcImprovement > 0) score += 40;
    if (memoryImprovement > 0) score += 30;

    console.log(`\n🎯 优化评分: ${score}/100`);
    
    if (score >= 70) {
      console.log('✅ 优化效果显著！');
    } else if (score >= 40) {
      console.log('⚠️ 优化效果一般，可能需要进一步调整');
    } else {
      console.log('❌ 优化效果不佳，建议重新评估配置');
    }
  }

  // 生成完整的调优报告
  generateTuningReport() {
    return {
      currentSettings: this.currentSettings,
      recommendations: this.recommendations,
      nodeFlags: this.generateNodeFlags(),
      tuningGuide: {
        highMemoryApps: '增加 --max-old-space-size',
        lowLatencyApps: '启用 --incremental-marking',
        cpuIntensiveApps: '考虑 --optimize-for-size',
        longRunningApps: '定期监控内存泄漏'
      }
    };
  }
}

// 使用示例
const gcTuner = new GCTuningManager();

// 定义应用特征
const appProfile = {
  memoryUsagePattern: 'high',
  objectLifetime: 'mixed',
  allocationRate: 'medium',
  responseTimeRequirement: 'normal'
};

// 分析并获取建议
const recommendations = gcTuner.analyzeAndRecommend(appProfile);

console.log('\n💡 GC调优建议:');
recommendations.forEach(rec => {
  console.log(`  ${rec.setting}: ${rec.value} - ${rec.reason}`);
});

// 生成Node.js启动参数
const nodeFlags = gcTuner.generateNodeFlags();
console.log('\n🚀 推荐的Node.js启动参数:');
console.log(`node ${nodeFlags.join(' ')} app.js`);

// 生成完整报告
const report = gcTuner.generateTuningReport();
console.log('\n📋 完整调优报告:');
console.log(JSON.stringify(report, null, 2));
```

V8垃圾收集机制是Node.js性能的关键，通过深入理解和合理调优可以显著提升应用性能！
