# 连接池优化

## 概述

连接池优化是提升数据库应用性能的关键环节。通过合理的配置调优、负载均衡、缓存策略和资源管理，可以最大化数据库连接的效率，减少资源浪费，提升系统整体性能。

## 性能分析与诊断

### 1. 性能瓶颈识别
```javascript
// 连接池性能分析器
class PoolPerformanceAnalyzer {
  constructor(pool) {
    this.pool = pool;
    this.metrics = {
      connectionCreationTime: [],
      queryExecutionTime: [],
      connectionUtilization: [],
      waitTime: [],
      throughput: []
    };
    this.startTime = Date.now();
  }
  
  // 分析连接池性能瓶颈
  analyzeBottlenecks() {
    const analysis = {
      bottlenecks: [],
      recommendations: [],
      severity: 'low'
    };
    
    // 分析连接创建时间
    const avgCreationTime = this.getAverageCreationTime();
    if (avgCreationTime > 100) { // 超过100ms
      analysis.bottlenecks.push({
        type: 'slow_connection_creation',
        value: avgCreationTime,
        threshold: 100
      });
      analysis.recommendations.push('优化数据库连接配置，检查网络延迟');
    }
    
    // 分析连接利用率
    const utilization = this.getCurrentUtilization();
    if (utilization > 90) {
      analysis.bottlenecks.push({
        type: 'high_utilization',
        value: utilization,
        threshold: 90
      });
      analysis.recommendations.push('增加连接池最大连接数');
      analysis.severity = 'high';
    } else if (utilization < 10) {
      analysis.bottlenecks.push({
        type: 'low_utilization',
        value: utilization,
        threshold: 10
      });
      analysis.recommendations.push('减少连接池最小连接数以节省资源');
    }
    
    // 分析等待时间
    const avgWaitTime = this.getAverageWaitTime();
    if (avgWaitTime > 1000) { // 超过1秒
      analysis.bottlenecks.push({
        type: 'long_wait_time',
        value: avgWaitTime,
        threshold: 1000
      });
      analysis.recommendations.push('增加连接池大小或优化查询性能');
      analysis.severity = 'critical';
    }
    
    return analysis;
  }
  
  // 获取平均连接创建时间
  getAverageCreationTime() {
    const times = this.metrics.connectionCreationTime;
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
  
  // 获取当前连接利用率
  getCurrentUtilization() {
    const totalConnections = this.pool._allConnections?.length || 0;
    const freeConnections = this.pool._freeConnections?.length || 0;
    const activeConnections = totalConnections - freeConnections;
    
    return totalConnections > 0 ? (activeConnections / totalConnections) * 100 : 0;
  }
  
  // 获取平均等待时间
  getAverageWaitTime() {
    const waitTimes = this.metrics.waitTime;
    return waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;
  }
  
  // 记录连接创建时间
  recordConnectionCreation(duration) {
    this.metrics.connectionCreationTime.push(duration);
    this.keepRecentRecords(this.metrics.connectionCreationTime);
  }
  
  // 记录查询执行时间
  recordQueryExecution(duration) {
    this.metrics.queryExecutionTime.push(duration);
    this.keepRecentRecords(this.metrics.queryExecutionTime);
  }
  
  // 记录等待时间
  recordWaitTime(duration) {
    this.metrics.waitTime.push(duration);
    this.keepRecentRecords(this.metrics.waitTime);
  }
  
  // 保持最近的记录
  keepRecentRecords(array, maxSize = 1000) {
    if (array.length > maxSize) {
      array.splice(0, array.length - maxSize);
    }
  }
  
  // 生成性能报告
  generateReport() {
    const analysis = this.analyzeBottlenecks();
    const uptime = Date.now() - this.startTime;
    
    return {
      uptime: uptime,
      analysis: analysis,
      metrics: {
        avgConnectionCreationTime: this.getAverageCreationTime(),
        avgQueryExecutionTime: this.getAverageQueryTime(),
        avgWaitTime: this.getAverageWaitTime(),
        currentUtilization: this.getCurrentUtilization(),
        throughput: this.calculateThroughput()
      },
      poolStats: this.getPoolStats(),
      timestamp: new Date()
    };
  }
  
  getAverageQueryTime() {
    const times = this.metrics.queryExecutionTime;
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
  
  calculateThroughput() {
    const totalQueries = this.metrics.queryExecutionTime.length;
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    return uptimeSeconds > 0 ? totalQueries / uptimeSeconds : 0;
  }
  
  getPoolStats() {
    return {
      totalConnections: this.pool._allConnections?.length || 0,
      freeConnections: this.pool._freeConnections?.length || 0,
      acquiringConnections: this.pool._acquiringConnections?.length || 0,
      queueLength: this.pool._connectionQueue?.length || 0
    };
  }
}
```

### 2. 智能调优建议
```javascript
// 智能连接池调优器
class IntelligentPoolTuner {
  constructor(analyzer) {
    this.analyzer = analyzer;
    this.tuningHistory = [];
    this.currentConfig = {};
  }
  
  // 基于性能分析生成调优建议
  generateTuningRecommendations() {
    const report = this.analyzer.generateReport();
    const recommendations = [];
    
    // 基于利用率调优
    if (report.metrics.currentUtilization > 85) {
      recommendations.push({
        parameter: 'connectionLimit',
        currentValue: this.currentConfig.connectionLimit,
        recommendedValue: Math.min(this.currentConfig.connectionLimit * 1.5, 100),
        reason: '连接池利用率过高，建议增加连接数',
        priority: 'high',
        expectedImprovement: '减少连接等待时间'
      });
    }
    
    // 基于等待时间调优
    if (report.metrics.avgWaitTime > 500) {
      recommendations.push({
        parameter: 'acquireTimeout',
        currentValue: this.currentConfig.acquireTimeout,
        recommendedValue: Math.max(this.currentConfig.acquireTimeout * 1.2, 30000),
        reason: '连接获取等待时间过长',
        priority: 'medium',
        expectedImprovement: '提高连接获取成功率'
      });
    }
    
    // 基于查询性能调优
    if (report.metrics.avgQueryExecutionTime > 1000) {
      recommendations.push({
        parameter: 'timeout',
        currentValue: this.currentConfig.timeout,
        recommendedValue: Math.max(this.currentConfig.timeout * 1.5, 60000),
        reason: '查询执行时间较长，建议增加查询超时时间',
        priority: 'medium',
        expectedImprovement: '减少查询超时错误'
      });
    }
    
    // 基于空闲连接调优
    const idleRatio = report.poolStats.freeConnections / report.poolStats.totalConnections;
    if (idleRatio > 0.6) {
      recommendations.push({
        parameter: 'idleTimeout',
        currentValue: this.currentConfig.idleTimeout,
        recommendedValue: Math.max(this.currentConfig.idleTimeout * 0.8, 300000),
        reason: '空闲连接比例过高，建议缩短空闲超时时间',
        priority: 'low',
        expectedImprovement: '节省数据库连接资源'
      });
    }
    
    return {
      recommendations: recommendations,
      analysis: report.analysis,
      confidence: this.calculateConfidence(recommendations),
      timestamp: new Date()
    };
  }
  
  // 计算调优建议的置信度
  calculateConfidence(recommendations) {
    const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
    const totalCount = recommendations.length;
    
    if (totalCount === 0) return 0;
    if (highPriorityCount >= totalCount * 0.5) return 0.9;
    if (highPriorityCount >= totalCount * 0.3) return 0.7;
    return 0.5;
  }
  
  // 自动应用调优建议
  async autoTune(pool, recommendations) {
    const appliedTunings = [];
    
    for (const rec of recommendations) {
      if (rec.priority === 'high' && this.shouldApplyTuning(rec)) {
        try {
          await this.applyTuning(pool, rec);
          appliedTunings.push(rec);
          
          // 记录调优历史
          this.tuningHistory.push({
            recommendation: rec,
            appliedAt: new Date(),
            success: true
          });
        } catch (error) {
          console.error('自动调优失败:', error);
          this.tuningHistory.push({
            recommendation: rec,
            appliedAt: new Date(),
            success: false,
            error: error.message
          });
        }
      }
    }
    
    return appliedTunings;
  }
  
  // 判断是否应该应用调优
  shouldApplyTuning(recommendation) {
    // 检查最近是否已经调优过同一参数
    const recentTunings = this.tuningHistory.filter(t => 
      t.recommendation.parameter === recommendation.parameter &&
      Date.now() - t.appliedAt.getTime() < 300000 // 5分钟内
    );
    
    return recentTunings.length === 0;
  }
  
  // 应用调优配置
  async applyTuning(pool, recommendation) {
    // 这里需要根据具体的连接池实现来应用配置
    // 大多数连接池不支持运行时动态修改配置
    // 通常需要重启连接池或应用新配置
    
    console.log('应用调优建议:', recommendation);
    
    // 更新当前配置记录
    this.currentConfig[recommendation.parameter] = recommendation.recommendedValue;
    
    // 实际应用需要根据连接池类型实现
    // 例如：重新创建连接池或调用配置更新API
  }
}
```

## 动态配置优化

### 1. 自适应连接池大小
```javascript
// 自适应连接池管理器
class AdaptivePoolManager {
  constructor(pool, options = {}) {
    this.pool = pool;
    this.options = {
      minConnections: options.minConnections || 5,
      maxConnections: options.maxConnections || 50,
      scaleUpThreshold: options.scaleUpThreshold || 0.8,
      scaleDownThreshold: options.scaleDownThreshold || 0.3,
      adjustmentInterval: options.adjustmentInterval || 60000, // 1分钟
      scaleUpStep: options.scaleUpStep || 2,
      scaleDownStep: options.scaleDownStep || 1
    };
    
    this.currentSize = options.initialSize || 10;
    this.metrics = {
      utilizationHistory: [],
      adjustmentHistory: []
    };
    
    this.startAdaptiveScaling();
  }
  
  startAdaptiveScaling() {
    setInterval(() => {
      this.adjustPoolSize();
    }, this.options.adjustmentInterval);
  }
  
  // 动态调整连接池大小
  adjustPoolSize() {
    const utilization = this.calculateUtilization();
    const avgUtilization = this.getAverageUtilization();
    
    // 记录利用率历史
    this.metrics.utilizationHistory.push({
      utilization: utilization,
      timestamp: Date.now()
    });
    
    // 保持最近100条记录
    if (this.metrics.utilizationHistory.length > 100) {
      this.metrics.utilizationHistory.shift();
    }
    
    let adjustment = 0;
    let reason = '';
    
    // 扩容条件
    if (avgUtilization > this.options.scaleUpThreshold && 
        this.currentSize < this.options.maxConnections) {
      adjustment = Math.min(
        this.options.scaleUpStep,
        this.options.maxConnections - this.currentSize
      );
      reason = `利用率${(avgUtilization * 100).toFixed(1)}%超过扩容阈值${(this.options.scaleUpThreshold * 100)}%`;
    }
    
    // 缩容条件
    else if (avgUtilization < this.options.scaleDownThreshold && 
             this.currentSize > this.options.minConnections) {
      adjustment = -Math.min(
        this.options.scaleDownStep,
        this.currentSize - this.options.minConnections
      );
      reason = `利用率${(avgUtilization * 100).toFixed(1)}%低于缩容阈值${(this.options.scaleDownThreshold * 100)}%`;
    }
    
    if (adjustment !== 0) {
      this.applyAdjustment(adjustment, reason);
    }
  }
  
  // 计算当前利用率
  calculateUtilization() {
    const totalConnections = this.pool._allConnections?.length || 0;
    const freeConnections = this.pool._freeConnections?.length || 0;
    const activeConnections = totalConnections - freeConnections;
    
    return totalConnections > 0 ? activeConnections / totalConnections : 0;
  }
  
  // 获取平均利用率
  getAverageUtilization() {
    const recentMetrics = this.metrics.utilizationHistory.slice(-10); // 最近10次
    if (recentMetrics.length === 0) return 0;
    
    const sum = recentMetrics.reduce((acc, metric) => acc + metric.utilization, 0);
    return sum / recentMetrics.length;
  }
  
  // 应用调整
  applyAdjustment(adjustment, reason) {
    const oldSize = this.currentSize;
    this.currentSize += adjustment;
    
    console.log(`连接池大小调整: ${oldSize} -> ${this.currentSize}, 原因: ${reason}`);
    
    // 记录调整历史
    this.metrics.adjustmentHistory.push({
      oldSize: oldSize,
      newSize: this.currentSize,
      adjustment: adjustment,
      reason: reason,
      timestamp: new Date()
    });
    
    // 实际调整连接池大小
    this.resizePool(this.currentSize);
  }
  
  // 调整连接池实际大小
  async resizePool(newSize) {
    try {
      // 大多数连接池不支持动态调整大小
      // 这里提供一个概念性实现
      
      const currentTotal = this.pool._allConnections?.length || 0;
      
      if (newSize > currentTotal) {
        // 需要增加连接
        const connectionsToAdd = newSize - currentTotal;
        for (let i = 0; i < connectionsToAdd; i++) {
          // 这里需要根据具体连接池实现
          // await this.pool.addConnection();
        }
      } else if (newSize < currentTotal) {
        // 需要减少连接
        const connectionsToRemove = currentTotal - newSize;
        for (let i = 0; i < connectionsToRemove; i++) {
          // 只移除空闲连接
          if (this.pool._freeConnections?.length > 0) {
            // await this.pool.removeIdleConnection();
          }
        }
      }
      
      console.log(`连接池大小已调整为 ${newSize}`);
    } catch (error) {
      console.error('连接池大小调整失败:', error);
    }
  }
  
  // 获取调整统计
  getAdjustmentStats() {
    return {
      currentSize: this.currentSize,
      totalAdjustments: this.metrics.adjustmentHistory.length,
      recentAdjustments: this.metrics.adjustmentHistory.slice(-10),
      averageUtilization: this.getAverageUtilization(),
      utilizationTrend: this.getUtilizationTrend()
    };
  }
  
  // 获取利用率趋势
  getUtilizationTrend() {
    const recent = this.metrics.utilizationHistory.slice(-20);
    if (recent.length < 2) return 'stable';
    
    const first = recent.slice(0, 10);
    const last = recent.slice(-10);
    
    const firstAvg = first.reduce((acc, m) => acc + m.utilization, 0) / first.length;
    const lastAvg = last.reduce((acc, m) => acc + m.utilization, 0) / last.length;
    
    const diff = lastAvg - firstAvg;
    
    if (diff > 0.1) return 'increasing';
    if (diff < -0.1) return 'decreasing';
    return 'stable';
  }
}
```

### 2. 负载均衡优化
```javascript
// 连接池负载均衡器
class PoolLoadBalancer {
  constructor(pools) {
    this.pools = pools.map((pool, index) => ({
      id: index,
      pool: pool,
      weight: 1,
      activeConnections: 0,
      totalRequests: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastHealthCheck: null,
      isHealthy: true
    }));
    
    this.strategy = 'weighted_round_robin'; // round_robin, least_connections, weighted_round_robin
    this.currentIndex = 0;
    
    this.startHealthChecking();
  }
  
  // 获取最优连接池
  getOptimalPool() {
    const healthyPools = this.pools.filter(p => p.isHealthy);
    
    if (healthyPools.length === 0) {
      throw new Error('没有可用的健康连接池');
    }
    
    switch (this.strategy) {
      case 'round_robin':
        return this.roundRobinSelection(healthyPools);
      case 'least_connections':
        return this.leastConnectionsSelection(healthyPools);
      case 'weighted_round_robin':
        return this.weightedRoundRobinSelection(healthyPools);
      default:
        return healthyPools[0];
    }
  }
  
  // 轮询选择
  roundRobinSelection(pools) {
    const pool = pools[this.currentIndex % pools.length];
    this.currentIndex++;
    return pool;
  }
  
  // 最少连接选择
  leastConnectionsSelection(pools) {
    return pools.reduce((min, pool) => 
      pool.activeConnections < min.activeConnections ? pool : min
    );
  }
  
  // 加权轮询选择
  weightedRoundRobinSelection(pools) {
    // 基于权重和当前负载计算得分
    const poolsWithScore = pools.map(pool => {
      const utilizationPenalty = pool.activeConnections / (pool.pool._allConnections?.length || 1);
      const errorPenalty = pool.errorCount / Math.max(pool.totalRequests, 1);
      const responsePenalty = pool.averageResponseTime / 1000; // 转换为秒
      
      const score = pool.weight - utilizationPenalty - errorPenalty - responsePenalty;
      
      return { ...pool, score };
    });
    
    // 选择得分最高的池
    return poolsWithScore.reduce((best, pool) => 
      pool.score > best.score ? pool : best
    );
  }
  
  // 执行查询
  async executeQuery(sql, params) {
    const poolInfo = this.getOptimalPool();
    const startTime = Date.now();
    
    try {
      poolInfo.activeConnections++;
      poolInfo.totalRequests++;
      
      const result = await poolInfo.pool.execute(sql, params);
      
      // 更新性能指标
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(poolInfo, responseTime, true);
      
      return result;
    } catch (error) {
      poolInfo.errorCount++;
      this.updatePerformanceMetrics(poolInfo, Date.now() - startTime, false);
      throw error;
    } finally {
      poolInfo.activeConnections--;
    }
  }
  
  // 更新性能指标
  updatePerformanceMetrics(poolInfo, responseTime, success) {
    // 更新平均响应时间（使用指数移动平均）
    const alpha = 0.1;
    poolInfo.averageResponseTime = 
      poolInfo.averageResponseTime * (1 - alpha) + responseTime * alpha;
    
    // 根据性能调整权重
    if (success && responseTime < 100) {
      poolInfo.weight = Math.min(poolInfo.weight + 0.1, 2.0);
    } else if (!success || responseTime > 1000) {
      poolInfo.weight = Math.max(poolInfo.weight - 0.1, 0.1);
    }
  }
  
  // 健康检查
  startHealthChecking() {
    setInterval(async () => {
      for (const poolInfo of this.pools) {
        await this.checkPoolHealth(poolInfo);
      }
    }, 30000); // 每30秒检查一次
  }
  
  async checkPoolHealth(poolInfo) {
    const startTime = Date.now();
    
    try {
      const connection = await poolInfo.pool.getConnection();
      await connection.execute('SELECT 1');
      connection.release();
      
      const responseTime = Date.now() - startTime;
      
      // 更新健康状态
      poolInfo.isHealthy = responseTime < 5000; // 5秒超时
      poolInfo.lastHealthCheck = new Date();
      
      if (!poolInfo.isHealthy) {
        console.warn(`连接池 ${poolInfo.id} 健康检查失败，响应时间: ${responseTime}ms`);
      }
    } catch (error) {
      poolInfo.isHealthy = false;
      poolInfo.lastHealthCheck = new Date();
      console.error(`连接池 ${poolInfo.id} 健康检查错误:`, error.message);
    }
  }
  
  // 获取负载均衡统计
  getStats() {
    return {
      strategy: this.strategy,
      pools: this.pools.map(p => ({
        id: p.id,
        weight: p.weight,
        activeConnections: p.activeConnections,
        totalRequests: p.totalRequests,
        errorCount: p.errorCount,
        errorRate: p.totalRequests > 0 ? (p.errorCount / p.totalRequests) * 100 : 0,
        averageResponseTime: p.averageResponseTime,
        isHealthy: p.isHealthy,
        lastHealthCheck: p.lastHealthCheck
      })),
      totalRequests: this.pools.reduce((sum, p) => sum + p.totalRequests, 0),
      totalErrors: this.pools.reduce((sum, p) => sum + p.errorCount, 0)
    };
  }
}
```

## 缓存集成优化

### 1. 查询结果缓存
```javascript
// 查询结果缓存管理器
class QueryCacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.options = {
      maxSize: options.maxSize || 1000,
      defaultTTL: options.defaultTTL || 300000, // 5分钟
      enableStats: options.enableStats !== false
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalQueries: 0
    };
    
    this.startCleanup();
  }
  
  // 生成缓存键
  generateCacheKey(sql, params) {
    const normalizedSQL = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    const paramsStr = JSON.stringify(params || []);
    return `${normalizedSQL}:${paramsStr}`;
  }
  
  // 获取缓存结果
  get(sql, params) {
    const key = this.generateCacheKey(sql, params);
    const cached = this.cache.get(key);
    
    this.stats.totalQueries++;
    
    if (cached && cached.expiresAt > Date.now()) {
      this.stats.hits++;
      cached.accessCount++;
      cached.lastAccessed = Date.now();
      return cached.data;
    }
    
    this.stats.misses++;
    if (cached) {
      this.cache.delete(key); // 删除过期的缓存
    }
    
    return null;
  }
  
  // 设置缓存结果
  set(sql, params, data, ttl) {
    if (!this.shouldCache(sql, data)) {
      return false;
    }
    
    const key = this.generateCacheKey(sql, params);
    const expiresAt = Date.now() + (ttl || this.options.defaultTTL);
    
    // 如果缓存已满，执行LRU淘汰
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      data: data,
      expiresAt: expiresAt,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      size: this.calculateSize(data)
    });
    
    return true;
  }
  
  // 判断是否应该缓存
  shouldCache(sql, data) {
    // 不缓存写操作
    if (/^\s*(insert|update|delete|create|drop|alter)/i.test(sql)) {
      return false;
    }
    
    // 不缓存空结果或过大的结果
    if (!data || this.calculateSize(data) > 1024 * 1024) { // 1MB
      return false;
    }
    
    return true;
  }
  
  // 计算数据大小
  calculateSize(data) {
    return JSON.stringify(data).length;
  }
  
  // LRU淘汰
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, value] of this.cache) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  // 清理过期缓存
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache) {
        if (value.expiresAt <= now) {
          this.cache.delete(key);
        }
      }
    }, 60000); // 每分钟清理一次
  }
  
  // 使缓存失效
  invalidate(pattern) {
    const regex = new RegExp(pattern, 'i');
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }
  
  // 获取缓存统计
  getStats() {
    const hitRate = this.stats.totalQueries > 0 ? 
      (this.stats.hits / this.stats.totalQueries) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: hitRate,
      cacheSize: this.cache.size,
      memoryUsage: this.calculateTotalSize()
    };
  }
  
  calculateTotalSize() {
    let totalSize = 0;
    for (const value of this.cache.values()) {
      totalSize += value.size;
    }
    return totalSize;
  }
}

// 带缓存的连接池包装器
class CachedPool {
  constructor(pool, cacheManager) {
    this.pool = pool;
    this.cache = cacheManager;
  }
  
  async execute(sql, params) {
    // 尝试从缓存获取
    const cached = this.cache.get(sql, params);
    if (cached) {
      return cached;
    }
    
    // 执行查询
    const result = await this.pool.execute(sql, params);
    
    // 缓存结果
    this.cache.set(sql, params, result);
    
    return result;
  }
  
  // 透传其他方法
  getConnection() {
    return this.pool.getConnection();
  }
  
  end() {
    return this.pool.end();
  }
}
```

### 2. 连接预热优化
```javascript
// 连接池预热管理器
class PoolWarmupManager {
  constructor(pool, options = {}) {
    this.pool = pool;
    this.options = {
      warmupQueries: options.warmupQueries || ['SELECT 1', 'SELECT NOW()'],
      warmupConnections: options.warmupConnections || 5,
      warmupTimeout: options.warmupTimeout || 10000,
      enablePreloading: options.enablePreloading !== false
    };
  }
  
  // 执行连接池预热
  async warmup() {
    console.log('开始连接池预热...');
    const startTime = Date.now();
    
    try {
      // 预热连接
      await this.warmupConnections();
      
      // 预加载常用数据
      if (this.options.enablePreloading) {
        await this.preloadData();
      }
      
      const warmupTime = Date.now() - startTime;
      console.log(`连接池预热完成，耗时: ${warmupTime}ms`);
      
      return {
        success: true,
        warmupTime: warmupTime,
        connectionsWarmed: this.options.warmupConnections
      };
    } catch (error) {
      console.error('连接池预热失败:', error);
      return {
        success: false,
        error: error.message,
        warmupTime: Date.now() - startTime
      };
    }
  }
  
  // 预热连接
  async warmupConnections() {
    const warmupPromises = [];
    
    for (let i = 0; i < this.options.warmupConnections; i++) {
      warmupPromises.push(this.warmupSingleConnection());
    }
    
    await Promise.all(warmupPromises);
  }
  
  // 预热单个连接
  async warmupSingleConnection() {
    const connection = await this.pool.getConnection();
    
    try {
      // 执行预热查询
      for (const query of this.options.warmupQueries) {
        await connection.execute(query);
      }
      
      // 模拟真实查询模式
      await this.simulateRealQueries(connection);
    } finally {
      connection.release();
    }
  }
  
  // 模拟真实查询模式
  async simulateRealQueries(connection) {
    // 这里可以执行一些典型的查询来预热数据库缓存
    const commonQueries = [
      'SHOW STATUS',
      'SHOW VARIABLES LIKE "max_connections"',
      'SELECT DATABASE()'
    ];
    
    for (const query of commonQueries) {
      try {
        await connection.execute(query);
      } catch (error) {
        // 忽略预热查询错误
        console.warn('预热查询失败:', query, error.message);
      }
    }
  }
  
  // 预加载常用数据
  async preloadData() {
    // 这里可以预加载一些常用的数据到应用缓存中
    console.log('预加载常用数据...');
    
    // 示例：预加载配置数据
    try {
      await this.pool.execute('SELECT * FROM system_config');
      console.log('系统配置数据预加载完成');
    } catch (error) {
      console.warn('系统配置数据预加载失败:', error.message);
    }
  }
  
  // 定期预热（在低峰时段）
  scheduleRegularWarmup() {
    // 每天凌晨2点执行预热
    const scheduleWarmup = () => {
      const now = new Date();
      const next2AM = new Date();
      next2AM.setHours(2, 0, 0, 0);
      
      if (next2AM <= now) {
        next2AM.setDate(next2AM.getDate() + 1);
      }
      
      const msUntil2AM = next2AM.getTime() - now.getTime();
      
      setTimeout(() => {
        this.warmup().then(() => {
          // 安排下一次预热
          scheduleWarmup();
        });
      }, msUntil2AM);
    };
    
    scheduleWarmup();
  }
}
```

## 资源管理优化

### 1. 内存使用优化
```javascript
// 内存使用监控和优化
class MemoryOptimizer {
  constructor(pool) {
    this.pool = pool;
    this.memoryThreshold = 0.8; // 80%内存使用率阈值
    this.gcInterval = 300000; // 5分钟GC间隔
    
    this.startMemoryMonitoring();
  }
  
  // 开始内存监控
  startMemoryMonitoring() {
    setInterval(() => {
      this.checkMemoryUsage();
    }, 60000); // 每分钟检查一次
    
    // 定期强制垃圾回收
    setInterval(() => {
      this.forceGarbageCollection();
    }, this.gcInterval);
  }
  
  // 检查内存使用情况
  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsageRatio = usedMem / totalMem;
    
    console.log('内存使用情况:', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB',
      systemUsage: Math.round(memoryUsageRatio * 100) + '%'
    });
    
    // 内存使用率过高时采取优化措施
    if (memoryUsageRatio > this.memoryThreshold) {
      console.warn('内存使用率过高，开始优化...');
      this.optimizeMemoryUsage();
    }
  }
  
  // 优化内存使用
  async optimizeMemoryUsage() {
    // 1. 清理空闲连接
    await this.cleanupIdleConnections();
    
    // 2. 强制垃圾回收
    this.forceGarbageCollection();
    
    // 3. 清理应用缓存
    this.clearApplicationCaches();
    
    // 4. 减少连接池大小
    this.temporarilyReducePoolSize();
  }
  
  // 清理空闲连接
  async cleanupIdleConnections() {
    const idleConnections = this.pool._freeConnections?.length || 0;
    const targetReduction = Math.floor(idleConnections * 0.3); // 减少30%
    
    console.log(`清理${targetReduction}个空闲连接`);
    
    // 这里需要根据具体的连接池实现
    // 大多数连接池会自动管理空闲连接
  }
  
  // 强制垃圾回收
  forceGarbageCollection() {
    if (global.gc) {
      console.log('执行垃圾回收...');
      global.gc();
    } else {
      console.warn('垃圾回收不可用，请使用 --expose-gc 启动参数');
    }
  }
  
  // 清理应用缓存
  clearApplicationCaches() {
    // 清理各种应用级缓存
    console.log('清理应用缓存...');
    
    // 示例：清理查询缓存
    if (global.queryCache) {
      global.queryCache.clear();
    }
  }
  
  // 临时减少连接池大小
  temporarilyReducePoolSize() {
    console.log('临时减少连接池大小...');
    
    // 记录原始大小
    const originalSize = this.pool._allConnections?.length || 0;
    
    // 30分钟后恢复原始大小
    setTimeout(() => {
      console.log('恢复连接池原始大小...');
      // 这里需要根据具体实现来恢复
    }, 1800000); // 30分钟
  }
  
  // 获取内存统计
  getMemoryStats() {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    
    return {
      process: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      system: {
        totalMemory: totalMem,
        freeMemory: freeMem,
        usedMemory: totalMem - freeMem,
        usagePercentage: ((totalMem - freeMem) / totalMem) * 100
      },
      pool: {
        totalConnections: this.pool._allConnections?.length || 0,
        freeConnections: this.pool._freeConnections?.length || 0
      }
    };
  }
}
```

### 2. CPU使用优化
```javascript
// CPU使用监控和优化
class CPUOptimizer {
  constructor(pool) {
    this.pool = pool;
    this.cpuThreshold = 80; // 80% CPU使用率阈值
    this.monitoringInterval = 5000; // 5秒监控间隔
    this.cpuHistory = [];
    
    this.startCPUMonitoring();
  }
  
  // 开始CPU监控
  startCPUMonitoring() {
    setInterval(() => {
      this.checkCPUUsage();
    }, this.monitoringInterval);
  }
  
  // 检查CPU使用情况
  async checkCPUUsage() {
    const cpuUsage = await this.getCPUUsage();
    
    this.cpuHistory.push({
      usage: cpuUsage,
      timestamp: Date.now()
    });
    
    // 保持最近100条记录
    if (this.cpuHistory.length > 100) {
      this.cpuHistory.shift();
    }
    
    const avgCPU = this.getAverageCPUUsage();
    
    if (avgCPU > this.cpuThreshold) {
      console.warn(`CPU使用率过高: ${avgCPU.toFixed(1)}%`);
      await this.optimizeCPUUsage();
    }
  }
  
  // 获取CPU使用率
  getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();
      
      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const elapsedTime = Date.now() - startTime;
        
        // 计算CPU使用率百分比
        const cpuPercent = (currentUsage.user + currentUsage.system) / (elapsedTime * 1000);
        resolve(Math.min(cpuPercent * 100, 100));
      }, 100);
    });
  }
  
  // 获取平均CPU使用率
  getAverageCPUUsage() {
    const recentHistory = this.cpuHistory.slice(-10); // 最近10次
    if (recentHistory.length === 0) return 0;
    
    const sum = recentHistory.reduce((acc, record) => acc + record.usage, 0);
    return sum / recentHistory.length;
  }
  
  // 优化CPU使用
  async optimizeCPUUsage() {
    console.log('开始CPU优化...');
    
    // 1. 限制并发连接数
    this.limitConcurrentConnections();
    
    // 2. 启用查询队列
    this.enableQueryQueue();
    
    // 3. 延迟非关键任务
    this.delayNonCriticalTasks();
    
    // 4. 优化查询执行
    this.optimizeQueryExecution();
  }
  
  // 限制并发连接数
  limitConcurrentConnections() {
    const currentConnections = this.pool._allConnections?.length || 0;
    const targetConnections = Math.floor(currentConnections * 0.7); // 减少到70%
    
    console.log(`限制并发连接数到 ${targetConnections}`);
    
    // 临时限制，10分钟后恢复
    setTimeout(() => {
      console.log('恢复正常并发连接数');
    }, 600000);
  }
  
  // 启用查询队列
  enableQueryQueue() {
    console.log('启用查询队列以控制CPU负载');
    
    // 实现查询队列逻辑
    // 限制同时执行的查询数量
  }
  
  // 延迟非关键任务
  delayNonCriticalTasks() {
    console.log('延迟非关键任务执行');
    
    // 延迟统计、日志、清理等非关键任务
    // 可以使用setTimeout或将任务放入低优先级队列
  }
  
  // 优化查询执行
  optimizeQueryExecution() {
    console.log('优化查询执行策略');
    
    // 1. 启用查询缓存
    // 2. 批量处理查询
    // 3. 使用连接复用
    // 4. 避免复杂的JOIN操作
  }
  
  // 获取CPU统计
  getCPUStats() {
    return {
      currentUsage: this.cpuHistory.length > 0 ? this.cpuHistory[this.cpuHistory.length - 1].usage : 0,
      averageUsage: this.getAverageCPUUsage(),
      maxUsage: Math.max(...this.cpuHistory.map(h => h.usage)),
      minUsage: Math.min(...this.cpuHistory.map(h => h.usage)),
      trend: this.getCPUTrend(),
      coreCount: require('os').cpus().length
    };
  }
  
  // 获取CPU趋势
  getCPUTrend() {
    if (this.cpuHistory.length < 10) return 'stable';
    
    const recent = this.cpuHistory.slice(-10);
    const first = recent.slice(0, 5);
    const last = recent.slice(-5);
    
    const firstAvg = first.reduce((acc, h) => acc + h.usage, 0) / first.length;
    const lastAvg = last.reduce((acc, h) => acc + h.usage, 0) / last.length;
    
    const diff = lastAvg - firstAvg;
    
    if (diff > 10) return 'increasing';
    if (diff < -10) return 'decreasing';
    return 'stable';
  }
}
```

## 总结

连接池优化的关键策略：

1. **性能分析**：持续监控和分析连接池性能指标
2. **动态调优**：基于负载情况自动调整连接池配置
3. **负载均衡**：在多个连接池间智能分配请求
4. **缓存集成**：使用查询缓存减少数据库访问
5. **资源管理**：优化内存和CPU使用率
6. **预热策略**：在低峰时段预热连接和数据
7. **智能路由**：根据查询类型选择最优连接池

通过这些优化策略，可以显著提升连接池性能，减少资源消耗，提高系统整体效率。
