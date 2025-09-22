# 性能调优

## 概述

数据库性能调优是一个系统性工程，涉及硬件配置、数据库参数、查询优化、索引设计等多个方面。本文介绍在Node.js环境下进行数据库性能调优的方法和最佳实践。

## 系统级性能调优

### 1. 硬件资源优化
```javascript
// 系统资源监控器
class SystemResourceMonitor {
  constructor() {
    this.os = require('os');
    this.fs = require('fs').promises;
    this.metrics = {
      cpu: [],
      memory: [],
      disk: [],
      network: []
    };
  }
  
  // 监控CPU使用率
  async monitorCPU() {
    const cpus = this.os.cpus();
    const cpuUsage = {
      timestamp: new Date(),
      cores: cpus.length,
      usage: []
    };
    
    cpus.forEach((cpu, index) => {
      const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
      const idle = cpu.times.idle;
      const usage = ((total - idle) / total) * 100;
      
      cpuUsage.usage.push({
        core: index,
        usage: usage.toFixed(2)
      });
    });
    
    this.metrics.cpu.push(cpuUsage);
    return cpuUsage;
  }
  
  // 监控内存使用
  monitorMemory() {
    const totalMem = this.os.totalmem();
    const freeMem = this.os.freemem();
    const usedMem = totalMem - freeMem;
    
    const memoryUsage = {
      timestamp: new Date(),
      total: Math.round(totalMem / 1024 / 1024), // MB
      used: Math.round(usedMem / 1024 / 1024),
      free: Math.round(freeMem / 1024 / 1024),
      usage: ((usedMem / totalMem) * 100).toFixed(2)
    };
    
    this.metrics.memory.push(memoryUsage);
    return memoryUsage;
  }
  
  // 监控磁盘I/O
  async monitorDiskIO() {
    try {
      const diskStats = await this.fs.readFile('/proc/diskstats', 'utf8');
      const lines = diskStats.trim().split('\n');
      
      const diskUsage = {
        timestamp: new Date(),
        disks: []
      };
      
      lines.forEach(line => {
        const fields = line.trim().split(/\s+/);
        if (fields[2] && fields[2].match(/^[hs]d[a-z]$/)) {
          diskUsage.disks.push({
            device: fields[2],
            reads: parseInt(fields[3]),
            writes: parseInt(fields[7]),
            readBytes: parseInt(fields[5]) * 512,
            writeBytes: parseInt(fields[9]) * 512
          });
        }
      });
      
      this.metrics.disk.push(diskUsage);
      return diskUsage;
    } catch (error) {
      console.warn('无法读取磁盘统计:', error.message);
      return null;
    }
  }
  
  // 生成性能报告
  generatePerformanceReport() {
    const report = {
      timestamp: new Date(),
      cpu: this.analyzeCPUTrend(),
      memory: this.analyzeMemoryTrend(),
      disk: this.analyzeDiskTrend(),
      recommendations: []
    };
    
    // 生成优化建议
    if (report.cpu.avgUsage > 80) {
      report.recommendations.push({
        type: 'cpu',
        priority: 'high',
        message: 'CPU使用率过高，考虑增加CPU核心数或优化应用性能'
      });
    }
    
    if (report.memory.avgUsage > 85) {
      report.recommendations.push({
        type: 'memory',
        priority: 'high',
        message: '内存使用率过高，考虑增加内存或优化内存使用'
      });
    }
    
    return report;
  }
  
  analyzeCPUTrend() {
    const recent = this.metrics.cpu.slice(-10);
    if (recent.length === 0) return { avgUsage: 0, trend: 'stable' };
    
    const totalUsage = recent.reduce((sum, metric) => {
      const coreAvg = metric.usage.reduce((coreSum, core) => coreSum + parseFloat(core.usage), 0) / metric.usage.length;
      return sum + coreAvg;
    }, 0);
    
    return {
      avgUsage: (totalUsage / recent.length).toFixed(2),
      trend: this.calculateTrend(recent.map(m => {
        return m.usage.reduce((sum, core) => sum + parseFloat(core.usage), 0) / m.usage.length;
      }))
    };
  }
  
  analyzeMemoryTrend() {
    const recent = this.metrics.memory.slice(-10);
    if (recent.length === 0) return { avgUsage: 0, trend: 'stable' };
    
    const totalUsage = recent.reduce((sum, metric) => sum + parseFloat(metric.usage), 0);
    
    return {
      avgUsage: (totalUsage / recent.length).toFixed(2),
      trend: this.calculateTrend(recent.map(m => parseFloat(m.usage)))
    };
  }
  
  analyzeDiskTrend() {
    const recent = this.metrics.disk.filter(d => d !== null).slice(-10);
    if (recent.length === 0) return { avgIOPS: 0, trend: 'stable' };
    
    // 简化的IOPS计算
    const avgIOPS = recent.reduce((sum, metric) => {
      const totalOps = metric.disks.reduce((diskSum, disk) => diskSum + disk.reads + disk.writes, 0);
      return sum + totalOps;
    }, 0) / recent.length;
    
    return {
      avgIOPS: Math.round(avgIOPS),
      trend: 'stable' // 简化实现
    };
  }
  
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
}
```

### 2. 数据库配置优化
```javascript
// 数据库配置优化器
class DatabaseConfigOptimizer {
  constructor(pool) {
    this.pool = pool;
    this.configRecommendations = {
      mysql: {
        innodb_buffer_pool_size: {
          description: 'InnoDB缓冲池大小',
          calculator: (systemMem) => Math.floor(systemMem * 0.7), // 70%的系统内存
          unit: 'MB'
        },
        innodb_log_file_size: {
          description: 'InnoDB日志文件大小',
          calculator: (bufferPool) => Math.floor(bufferPool * 0.25), // 缓冲池的25%
          unit: 'MB'
        },
        max_connections: {
          description: '最大连接数',
          calculator: (cpuCores) => Math.min(cpuCores * 50, 1000),
          unit: 'connections'
        },
        query_cache_size: {
          description: '查询缓存大小',
          calculator: () => 128, // 固定128MB
          unit: 'MB'
        }
      }
    };
  }
  
  // 分析当前配置
  async analyzeCurrentConfig() {
    const connection = await this.pool.getConnection();
    
    try {
      const [variables] = await connection.execute('SHOW VARIABLES');
      const [status] = await connection.execute('SHOW STATUS');
      
      const config = {};
      variables.forEach(row => {
        config[row.Variable_name] = row.Value;
      });
      
      const stats = {};
      status.forEach(row => {
        stats[row.Variable_name] = row.Value;
      });
      
      return { config, stats };
    } finally {
      connection.release();
    }
  }
  
  // 生成优化建议
  async generateOptimizationRecommendations() {
    const { config, stats } = await this.analyzeCurrentConfig();
    const systemInfo = this.getSystemInfo();
    const recommendations = [];
    
    // 分析InnoDB缓冲池
    const currentBufferPool = this.parseSize(config.innodb_buffer_pool_size);
    const recommendedBufferPool = this.configRecommendations.mysql.innodb_buffer_pool_size.calculator(systemInfo.totalMemoryMB);
    
    if (currentBufferPool < recommendedBufferPool * 0.8) {
      recommendations.push({
        parameter: 'innodb_buffer_pool_size',
        current: `${currentBufferPool}MB`,
        recommended: `${recommendedBufferPool}MB`,
        reason: '缓冲池过小，增加可提高缓存命中率',
        priority: 'high',
        impact: 'high'
      });
    }
    
    // 分析连接数
    const currentMaxConnections = parseInt(config.max_connections);
    const usedConnections = parseInt(stats.Threads_connected);
    const connectionUsage = (usedConnections / currentMaxConnections) * 100;
    
    if (connectionUsage > 80) {
      recommendations.push({
        parameter: 'max_connections',
        current: currentMaxConnections,
        recommended: Math.min(currentMaxConnections * 1.5, 1000),
        reason: '连接使用率过高，可能导致连接不足',
        priority: 'medium',
        impact: 'medium'
      });
    }
    
    // 分析查询缓存
    const queryCacheHitRate = this.calculateQueryCacheHitRate(stats);
    if (queryCacheHitRate < 0.3 && config.query_cache_type !== 'OFF') {
      recommendations.push({
        parameter: 'query_cache_type',
        current: config.query_cache_type,
        recommended: 'OFF',
        reason: '查询缓存命中率低，关闭可提高性能',
        priority: 'medium',
        impact: 'medium'
      });
    }
    
    return {
      systemInfo: systemInfo,
      currentConfig: this.extractImportantConfig(config),
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
    };
  }
  
  // 获取系统信息
  getSystemInfo() {
    const os = require('os');
    return {
      cpuCores: os.cpus().length,
      totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
      freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      platform: os.platform(),
      arch: os.arch()
    };
  }
  
  // 解析大小字符串
  parseSize(sizeStr) {
    const size = parseInt(sizeStr);
    if (sizeStr.includes('G') || sizeStr.includes('g')) {
      return size * 1024;
    } else if (sizeStr.includes('K') || sizeStr.includes('k')) {
      return Math.round(size / 1024);
    }
    return Math.round(size / 1024 / 1024); // 假设是字节
  }
  
  // 计算查询缓存命中率
  calculateQueryCacheHitRate(stats) {
    const hits = parseInt(stats.Qcache_hits || 0);
    const inserts = parseInt(stats.Qcache_inserts || 0);
    const total = hits + inserts;
    
    return total > 0 ? hits / total : 0;
  }
  
  // 提取重要配置
  extractImportantConfig(config) {
    const important = [
      'innodb_buffer_pool_size',
      'innodb_log_file_size',
      'max_connections',
      'query_cache_size',
      'query_cache_type',
      'innodb_flush_log_at_trx_commit',
      'sync_binlog',
      'tmp_table_size',
      'max_heap_table_size'
    ];
    
    const result = {};
    important.forEach(param => {
      if (config[param] !== undefined) {
        result[param] = config[param];
      }
    });
    
    return result;
  }
}
```

## 查询性能调优

### 1. 慢查询优化
```javascript
// 慢查询优化器
class SlowQueryOptimizer {
  constructor(pool) {
    this.pool = pool;
    this.optimizationStrategies = [
      { name: 'index_optimization', handler: this.optimizeIndexes.bind(this) },
      { name: 'query_rewrite', handler: this.rewriteQuery.bind(this) },
      { name: 'table_structure', handler: this.optimizeTableStructure.bind(this) },
      { name: 'data_type_optimization', handler: this.optimizeDataTypes.bind(this) }
    ];
  }
  
  // 优化慢查询
  async optimizeSlowQuery(query) {
    const optimization = {
      originalQuery: query.sql,
      executionTime: query.executionTime,
      optimizations: [],
      estimatedImprovement: 0
    };
    
    // 获取执行计划
    const executionPlan = await this.getExecutionPlan(query.sql, query.params);
    
    // 应用优化策略
    for (const strategy of this.optimizationStrategies) {
      try {
        const result = await strategy.handler(query, executionPlan);
        if (result && result.applicable) {
          optimization.optimizations.push({
            strategy: strategy.name,
            description: result.description,
            recommendation: result.recommendation,
            estimatedImprovement: result.estimatedImprovement,
            priority: result.priority
          });
        }
      } catch (error) {
        console.error(`优化策略 ${strategy.name} 执行失败:`, error);
      }
    }
    
    // 计算总体改进估算
    optimization.estimatedImprovement = this.calculateTotalImprovement(optimization.optimizations);
    
    return optimization;
  }
  
  // 获取执行计划
  async getExecutionPlan(sql, params) {
    const connection = await this.pool.getConnection();
    
    try {
      const [result] = await connection.execute(`EXPLAIN FORMAT=JSON ${sql}`, params);
      return JSON.parse(result[0]['EXPLAIN']);
    } catch (error) {
      console.error('获取执行计划失败:', error);
      return null;
    } finally {
      connection.release();
    }
  }
  
  // 索引优化
  async optimizeIndexes(query, executionPlan) {
    if (!executionPlan) return null;
    
    const issues = this.analyzeIndexIssues(executionPlan);
    if (issues.length === 0) return null;
    
    const recommendations = [];
    
    issues.forEach(issue => {
      if (issue.type === 'full_table_scan') {
        recommendations.push(`为表 ${issue.table} 的查询条件创建索引`);
      } else if (issue.type === 'using_filesort') {
        recommendations.push(`为表 ${issue.table} 的ORDER BY字段创建索引`);
      } else if (issue.type === 'using_temporary') {
        recommendations.push(`优化表 ${issue.table} 的GROUP BY或DISTINCT操作`);
      }
    });
    
    return {
      applicable: true,
      description: '索引优化可以显著提升查询性能',
      recommendation: recommendations.join('; '),
      estimatedImprovement: this.estimateIndexImprovement(issues),
      priority: 'high'
    };
  }
  
  // 分析索引问题
  analyzeIndexIssues(executionPlan) {
    const issues = [];
    
    const traversePlan = (node) => {
      if (node.table) {
        if (node.table.access_type === 'ALL') {
          issues.push({
            type: 'full_table_scan',
            table: node.table.table_name,
            rows: node.table.rows_examined_per_scan
          });
        }
        
        if (node.table.extra) {
          if (node.table.extra.includes('Using filesort')) {
            issues.push({
              type: 'using_filesort',
              table: node.table.table_name
            });
          }
          
          if (node.table.extra.includes('Using temporary')) {
            issues.push({
              type: 'using_temporary',
              table: node.table.table_name
            });
          }
        }
      }
      
      if (node.nested_loop) {
        node.nested_loop.forEach(item => traversePlan(item));
      }
    };
    
    traversePlan(executionPlan.query_block);
    return issues;
  }
  
  // 估算索引改进效果
  estimateIndexImprovement(issues) {
    let improvement = 0;
    
    issues.forEach(issue => {
      switch (issue.type) {
        case 'full_table_scan':
          improvement += issue.rows > 10000 ? 80 : 50;
          break;
        case 'using_filesort':
          improvement += 30;
          break;
        case 'using_temporary':
          improvement += 40;
          break;
      }
    });
    
    return Math.min(improvement, 90); // 最大90%改进
  }
  
  // 查询重写
  async rewriteQuery(query, executionPlan) {
    const rewriteOpportunities = [];
    const sql = query.sql.toLowerCase();
    
    // 检查子查询优化机会
    if (sql.includes('exists') || sql.includes(' in (select')) {
      rewriteOpportunities.push('将子查询重写为JOIN操作');
    }
    
    // 检查DISTINCT优化
    if (sql.includes('distinct') && !sql.includes('group by')) {
      rewriteOpportunities.push('评估DISTINCT的必要性，考虑使用GROUP BY');
    }
    
    // 检查LIMIT优化
    if (sql.includes('order by') && !sql.includes('limit')) {
      rewriteOpportunities.push('为排序查询添加LIMIT限制结果集');
    }
    
    if (rewriteOpportunities.length === 0) return null;
    
    return {
      applicable: true,
      description: '查询重写可以改善执行效率',
      recommendation: rewriteOpportunities.join('; '),
      estimatedImprovement: rewriteOpportunities.length * 15, // 每个优化15%
      priority: 'medium'
    };
  }
  
  // 表结构优化
  async optimizeTableStructure(query, executionPlan) {
    // 这里可以分析表结构并提供优化建议
    // 简化实现
    return {
      applicable: true,
      description: '表结构优化建议',
      recommendation: '考虑表分区、字段类型优化等',
      estimatedImprovement: 20,
      priority: 'low'
    };
  }
  
  // 数据类型优化
  async optimizeDataTypes(query, executionPlan) {
    // 分析数据类型使用是否合理
    return {
      applicable: true,
      description: '数据类型优化',
      recommendation: '使用合适的数据类型可以减少存储空间和提高查询效率',
      estimatedImprovement: 10,
      priority: 'low'
    };
  }
  
  // 计算总体改进
  calculateTotalImprovement(optimizations) {
    // 使用加权平均而不是简单相加
    const weightedSum = optimizations.reduce((sum, opt) => {
      const weight = opt.priority === 'high' ? 1.0 : opt.priority === 'medium' ? 0.7 : 0.4;
      return sum + (opt.estimatedImprovement * weight);
    }, 0);
    
    const totalWeight = optimizations.reduce((sum, opt) => {
      const weight = opt.priority === 'high' ? 1.0 : opt.priority === 'medium' ? 0.7 : 0.4;
      return sum + weight;
    }, 0);
    
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }
}
```

## 缓存策略优化

### 1. 多层缓存架构
```javascript
// 多层缓存管理器
class MultiLevelCacheManager {
  constructor(options = {}) {
    this.levels = {
      l1: new Map(), // 内存缓存
      l2: null, // Redis缓存
      l3: null  // 数据库缓存
    };
    
    this.config = {
      l1MaxSize: options.l1MaxSize || 1000,
      l1TTL: options.l1TTL || 300000, // 5分钟
      l2TTL: options.l2TTL || 1800000, // 30分钟
      enableStats: options.enableStats !== false
    };
    
    this.stats = {
      l1: { hits: 0, misses: 0, evictions: 0 },
      l2: { hits: 0, misses: 0, evictions: 0 },
      l3: { hits: 0, misses: 0, evictions: 0 }
    };
    
    this.initializeRedis(options.redisConfig);
  }
  
  // 初始化Redis
  async initializeRedis(redisConfig) {
    if (!redisConfig) return;
    
    try {
      const Redis = require('ioredis');
      this.levels.l2 = new Redis(redisConfig);
      console.log('Redis缓存初始化成功');
    } catch (error) {
      console.error('Redis缓存初始化失败:', error);
    }
  }
  
  // 获取缓存
  async get(key) {
    // L1缓存查找
    const l1Result = this.getFromL1(key);
    if (l1Result !== null) {
      this.stats.l1.hits++;
      return l1Result;
    }
    this.stats.l1.misses++;
    
    // L2缓存查找
    if (this.levels.l2) {
      const l2Result = await this.getFromL2(key);
      if (l2Result !== null) {
        this.stats.l2.hits++;
        // 回填到L1缓存
        this.setToL1(key, l2Result, this.config.l1TTL);
        return l2Result;
      }
      this.stats.l2.misses++;
    }
    
    // L3缓存（数据库）查找
    // 这里应该从数据库获取数据
    this.stats.l3.misses++;
    return null;
  }
  
  // 设置缓存
  async set(key, value, ttl) {
    // 设置到L1缓存
    this.setToL1(key, value, ttl || this.config.l1TTL);
    
    // 设置到L2缓存
    if (this.levels.l2) {
      await this.setToL2(key, value, ttl || this.config.l2TTL);
    }
  }
  
  // L1缓存操作
  getFromL1(key) {
    const item = this.levels.l1.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.levels.l1.delete(key);
      return null;
    }
    
    item.lastAccessed = Date.now();
    return item.value;
  }
  
  setToL1(key, value, ttl) {
    // 检查缓存大小限制
    if (this.levels.l1.size >= this.config.l1MaxSize) {
      this.evictFromL1();
    }
    
    this.levels.l1.set(key, {
      value: value,
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now()
    });
  }
  
  // L1缓存LRU淘汰
  evictFromL1() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.levels.l1) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.levels.l1.delete(oldestKey);
      this.stats.l1.evictions++;
    }
  }
  
  // L2缓存操作
  async getFromL2(key) {
    try {
      const value = await this.levels.l2.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('L2缓存读取失败:', error);
      return null;
    }
  }
  
  async setToL2(key, value, ttl) {
    try {
      await this.levels.l2.setex(key, Math.floor(ttl / 1000), JSON.stringify(value));
    } catch (error) {
      console.error('L2缓存写入失败:', error);
    }
  }
  
  // 删除缓存
  async delete(key) {
    this.levels.l1.delete(key);
    
    if (this.levels.l2) {
      try {
        await this.levels.l2.del(key);
      } catch (error) {
        console.error('L2缓存删除失败:', error);
      }
    }
  }
  
  // 清空缓存
  async clear() {
    this.levels.l1.clear();
    
    if (this.levels.l2) {
      try {
        await this.levels.l2.flushdb();
      } catch (error) {
        console.error('L2缓存清空失败:', error);
      }
    }
  }
  
  // 获取缓存统计
  getStats() {
    const totalRequests = Object.values(this.stats).reduce((sum, level) => sum + level.hits + level.misses, 0);
    
    return {
      l1: {
        ...this.stats.l1,
        hitRate: this.stats.l1.hits + this.stats.l1.misses > 0 ? 
          (this.stats.l1.hits / (this.stats.l1.hits + this.stats.l1.misses)) * 100 : 0,
        size: this.levels.l1.size
      },
      l2: {
        ...this.stats.l2,
        hitRate: this.stats.l2.hits + this.stats.l2.misses > 0 ? 
          (this.stats.l2.hits / (this.stats.l2.hits + this.stats.l2.misses)) * 100 : 0
      },
      overall: {
        totalRequests: totalRequests,
        overallHitRate: totalRequests > 0 ? 
          ((this.stats.l1.hits + this.stats.l2.hits) / totalRequests) * 100 : 0
      }
    };
  }
}
```

## 总结

数据库性能调优是一个持续的过程：

1. **系统级优化**：硬件资源配置和数据库参数调优
2. **查询优化**：索引设计、查询重写、执行计划分析
3. **缓存策略**：多层缓存架构提升数据访问速度
4. **监控体系**：持续监控性能指标和资源使用情况
5. **自动化调优**：建立自动化的性能分析和优化流程
6. **最佳实践**：遵循数据库性能优化的最佳实践

通过系统化的性能调优，可以显著提升数据库应用的性能和用户体验。
