# 查询分析

## 概述

查询分析是数据库性能优化的核心环节，通过深入分析SQL查询的执行计划、性能指标和资源消耗，识别性能瓶颈并制定优化策略。本文详细介绍如何在Node.js应用中实现全面的查询分析系统。

## 查询性能监控

### 1. 查询执行时间监控
```javascript
// 查询性能监控器
class QueryPerformanceMonitor {
  constructor() {
    this.queryStats = new Map();
    this.slowQueryThreshold = 1000; // 1秒慢查询阈值
    this.slowQueries = [];
    this.totalQueries = 0;
    this.totalExecutionTime = 0;
  }
  
  // 开始查询监控
  startQuery(sql, params) {
    const queryId = this.generateQueryId();
    const startTime = process.hrtime.bigint();
    
    return {
      queryId: queryId,
      sql: sql,
      params: params,
      startTime: startTime,
      
      // 结束查询监控
      end: (result, error) => {
        this.endQuery(queryId, sql, params, startTime, result, error);
      }
    };
  }
  
  // 结束查询监控
  endQuery(queryId, sql, params, startTime, result, error) {
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1000000; // 转换为毫秒
    
    this.totalQueries++;
    this.totalExecutionTime += executionTime;
    
    // 记录查询统计
    const normalizedSQL = this.normalizeSQL(sql);
    const stats = this.queryStats.get(normalizedSQL) || {
      sql: normalizedSQL,
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0,
      lastExecuted: null
    };
    
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    stats.minTime = Math.min(stats.minTime, executionTime);
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.lastExecuted = new Date();
    
    if (error) {
      stats.errors++;
    }
    
    this.queryStats.set(normalizedSQL, stats);
    
    // 记录慢查询
    if (executionTime > this.slowQueryThreshold) {
      this.recordSlowQuery({
        queryId: queryId,
        sql: sql,
        params: params,
        executionTime: executionTime,
        error: error,
        timestamp: new Date(),
        result: result ? {
          rowCount: Array.isArray(result) ? result.length : (result.affectedRows || 0)
        } : null
      });
    }
    
    // 实时日志输出
    this.logQueryExecution(sql, params, executionTime, error);
  }
  
  // 标准化SQL语句
  normalizeSQL(sql) {
    return sql
      .replace(/\s+/g, ' ')
      .replace(/\?/g, '?')
      .replace(/\$\d+/g, '$N')
      .replace(/=\s*'[^']*'/g, "= 'VALUE'")
      .replace(/=\s*\d+/g, '= NUMBER')
      .trim()
      .toLowerCase();
  }
  
  // 生成查询ID
  generateQueryId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // 记录慢查询
  recordSlowQuery(slowQuery) {
    this.slowQueries.push(slowQuery);
    
    // 保持最近1000条慢查询记录
    if (this.slowQueries.length > 1000) {
      this.slowQueries.shift();
    }
    
    console.warn('慢查询检测:', {
      sql: slowQuery.sql.substring(0, 100) + '...',
      executionTime: slowQuery.executionTime + 'ms',
      timestamp: slowQuery.timestamp
    });
  }
  
  // 日志查询执行
  logQueryExecution(sql, params, executionTime, error) {
    const logLevel = executionTime > this.slowQueryThreshold ? 'warn' : 'debug';
    const message = `查询执行 [${executionTime.toFixed(2)}ms]: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`;
    
    if (logLevel === 'warn') {
      console.warn(message);
    } else if (process.env.NODE_ENV === 'development') {
      console.debug(message);
    }
  }
  
  // 获取查询统计报告
  getQueryStats() {
    const sortedQueries = Array.from(this.queryStats.values())
      .sort((a, b) => b.totalTime - a.totalTime);
    
    return {
      summary: {
        totalQueries: this.totalQueries,
        totalExecutionTime: this.totalExecutionTime,
        averageExecutionTime: this.totalQueries > 0 ? this.totalExecutionTime / this.totalQueries : 0,
        slowQueriesCount: this.slowQueries.length,
        uniqueQueries: this.queryStats.size
      },
      topQueriesByTime: sortedQueries.slice(0, 10),
      topQueriesByCount: Array.from(this.queryStats.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      recentSlowQueries: this.slowQueries.slice(-20),
      timestamp: new Date()
    };
  }
  
  // 获取查询性能趋势
  getPerformanceTrends() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    const recentSlowQueries = this.slowQueries.filter(q => 
      q.timestamp.getTime() > oneHourAgo
    );
    
    // 按时间分组统计
    const hourlyStats = {};
    recentSlowQueries.forEach(q => {
      const hour = new Date(q.timestamp).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { count: 0, totalTime: 0 };
      }
      hourlyStats[hour].count++;
      hourlyStats[hour].totalTime += q.executionTime;
    });
    
    return {
      hourlySlowQueries: hourlyStats,
      recentTrend: this.calculateTrend(recentSlowQueries),
      peakHour: this.findPeakHour(hourlyStats)
    };
  }
  
  // 计算趋势
  calculateTrend(queries) {
    if (queries.length < 2) return 'stable';
    
    const midPoint = Math.floor(queries.length / 2);
    const firstHalf = queries.slice(0, midPoint);
    const secondHalf = queries.slice(midPoint);
    
    const firstAvg = firstHalf.reduce((sum, q) => sum + q.executionTime, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, q) => sum + q.executionTime, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.2) return 'deteriorating';
    if (change < -0.2) return 'improving';
    return 'stable';
  }
  
  // 找到峰值时间
  findPeakHour(hourlyStats) {
    let peakHour = 0;
    let maxCount = 0;
    
    Object.entries(hourlyStats).forEach(([hour, stats]) => {
      if (stats.count > maxCount) {
        maxCount = stats.count;
        peakHour = parseInt(hour);
      }
    });
    
    return { hour: peakHour, count: maxCount };
  }
}
```

### 2. 查询执行计划分析
```javascript
// 查询执行计划分析器
class QueryPlanAnalyzer {
  constructor(pool) {
    this.pool = pool;
    this.planCache = new Map();
  }
  
  // 分析MySQL查询执行计划
  async analyzeMySQLPlan(sql, params) {
    try {
      const connection = await this.pool.getConnection();
      
      // 获取执行计划
      const [explainResult] = await connection.execute(`EXPLAIN FORMAT=JSON ${sql}`, params);
      const plan = JSON.parse(explainResult[0]['EXPLAIN']);
      
      connection.release();
      
      // 分析执行计划
      const analysis = this.analyzeMySQLExplain(plan);
      
      // 缓存执行计划
      const normalizedSQL = this.normalizeSQL(sql);
      this.planCache.set(normalizedSQL, {
        plan: plan,
        analysis: analysis,
        timestamp: new Date()
      });
      
      return analysis;
    } catch (error) {
      console.error('执行计划分析失败:', error);
      return null;
    }
  }
  
  // 分析MySQL EXPLAIN结果
  analyzeMySQLExplain(plan) {
    const analysis = {
      cost: 0,
      rowsExamined: 0,
      issues: [],
      recommendations: [],
      tableScans: 0,
      indexUsage: [],
      joinTypes: []
    };
    
    this.traverseMySQLPlan(plan.query_block, analysis);
    
    // 生成建议
    this.generateMySQLRecommendations(analysis);
    
    return analysis;
  }
  
  // 遍历MySQL执行计划
  traverseMySQLPlan(block, analysis) {
    if (block.cost_info) {
      analysis.cost += parseFloat(block.cost_info.query_cost || 0);
    }
    
    // 分析表访问
    if (block.table) {
      this.analyzeMySQLTable(block.table, analysis);
    }
    
    // 分析嵌套循环连接
    if (block.nested_loop) {
      block.nested_loop.forEach(item => {
        if (item.table) {
          this.analyzeMySQLTable(item.table, analysis);
        }
      });
    }
    
    // 分析子查询
    if (block.subqueries) {
      block.subqueries.forEach(subquery => {
        this.traverseMySQLPlan(subquery, analysis);
      });
    }
  }
  
  // 分析MySQL表访问
  analyzeMySQLTable(table, analysis) {
    analysis.rowsExamined += parseInt(table.rows_examined_per_scan || 0);
    
    // 检查访问类型
    if (table.access_type === 'ALL') {
      analysis.tableScans++;
      analysis.issues.push(`表 ${table.table_name} 进行全表扫描`);
    }
    
    // 检查索引使用
    if (table.key) {
      analysis.indexUsage.push({
        table: table.table_name,
        index: table.key,
        keyLength: table.key_length
      });
    } else if (table.access_type !== 'system' && table.access_type !== 'const') {
      analysis.issues.push(`表 ${table.table_name} 未使用索引`);
    }
    
    // 检查连接类型
    if (table.access_type) {
      analysis.joinTypes.push(table.access_type);
    }
    
    // 检查额外信息
    if (table.extra) {
      if (table.extra.includes('Using filesort')) {
        analysis.issues.push(`表 ${table.table_name} 使用文件排序`);
      }
      if (table.extra.includes('Using temporary')) {
        analysis.issues.push(`表 ${table.table_name} 使用临时表`);
      }
    }
  }
  
  // 生成MySQL优化建议
  generateMySQLRecommendations(analysis) {
    if (analysis.tableScans > 0) {
      analysis.recommendations.push('考虑为全表扫描的表添加适当的索引');
    }
    
    if (analysis.cost > 1000) {
      analysis.recommendations.push('查询成本较高，考虑优化查询逻辑或添加索引');
    }
    
    if (analysis.rowsExamined > 10000) {
      analysis.recommendations.push('检查的行数过多，考虑添加WHERE条件限制结果集');
    }
    
    if (analysis.issues.some(issue => issue.includes('文件排序'))) {
      analysis.recommendations.push('考虑添加覆盖索引避免文件排序');
    }
    
    if (analysis.issues.some(issue => issue.includes('临时表'))) {
      analysis.recommendations.push('优化GROUP BY或ORDER BY子句避免使用临时表');
    }
  }
  
  // 分析PostgreSQL查询执行计划
  async analyzePostgreSQLPlan(sql, params) {
    try {
      const connection = await this.pool.getConnection();
      
      // 获取执行计划
      const explainResult = await connection.query(`EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) ${sql}`, params);
      const plan = explainResult.rows[0]['QUERY PLAN'][0];
      
      connection.release();
      
      // 分析执行计划
      const analysis = this.analyzePostgreSQLExplain(plan);
      
      return analysis;
    } catch (error) {
      console.error('PostgreSQL执行计划分析失败:', error);
      return null;
    }
  }
  
  // 分析PostgreSQL EXPLAIN结果
  analyzePostgreSQLExplain(plan) {
    const analysis = {
      totalCost: plan['Total Cost'],
      actualTime: plan['Actual Total Time'],
      planningTime: plan['Planning Time'],
      executionTime: plan['Execution Time'],
      rowsReturned: plan['Actual Rows'],
      issues: [],
      recommendations: [],
      bufferStats: plan['Shared Hit Blocks'] ? {
        sharedHit: plan['Shared Hit Blocks'],
        sharedRead: plan['Shared Read Blocks'],
        sharedWritten: plan['Shared Written Blocks']
      } : null
    };
    
    this.traversePostgreSQLPlan(plan.Plan, analysis);
    this.generatePostgreSQLRecommendations(analysis);
    
    return analysis;
  }
  
  // 遍历PostgreSQL执行计划
  traversePostgreSQLPlan(node, analysis) {
    // 检查节点类型
    if (node['Node Type'] === 'Seq Scan') {
      analysis.issues.push(`表 ${node['Relation Name']} 进行顺序扫描`);
    }
    
    if (node['Node Type'] === 'Sort' && node['Sort Method'] === 'external merge') {
      analysis.issues.push('排序操作使用磁盘，考虑增加work_mem');
    }
    
    // 检查索引使用
    if (node['Node Type'] === 'Index Scan' || node['Node Type'] === 'Index Only Scan') {
      // 索引使用良好
    } else if (node['Relation Name'] && node['Node Type'] !== 'Seq Scan') {
      // 可能需要索引优化
    }
    
    // 递归检查子节点
    if (node.Plans) {
      node.Plans.forEach(childNode => {
        this.traversePostgreSQLPlan(childNode, analysis);
      });
    }
  }
  
  // 生成PostgreSQL优化建议
  generatePostgreSQLRecommendations(analysis) {
    if (analysis.issues.some(issue => issue.includes('顺序扫描'))) {
      analysis.recommendations.push('考虑为顺序扫描的表添加适当的索引');
    }
    
    if (analysis.totalCost > 10000) {
      analysis.recommendations.push('查询成本很高，考虑重写查询或优化索引');
    }
    
    if (analysis.actualTime > 1000) {
      analysis.recommendations.push('查询执行时间较长，检查是否有锁等待或I/O瓶颈');
    }
    
    if (analysis.bufferStats && analysis.bufferStats.sharedRead > analysis.bufferStats.sharedHit) {
      analysis.recommendations.push('缓存命中率较低，考虑增加shared_buffers');
    }
  }
  
  // 标准化SQL
  normalizeSQL(sql) {
    return sql
      .replace(/\s+/g, ' ')
      .replace(/\?/g, '?')
      .replace(/\$\d+/g, '$N')
      .trim()
      .toLowerCase();
  }
  
  // 获取执行计划缓存
  getCachedPlan(sql) {
    const normalizedSQL = this.normalizeSQL(sql);
    return this.planCache.get(normalizedSQL);
  }
  
  // 清理过期的执行计划缓存
  cleanupPlanCache() {
    const oneHourAgo = Date.now() - 3600000;
    
    for (const [sql, cache] of this.planCache) {
      if (cache.timestamp.getTime() < oneHourAgo) {
        this.planCache.delete(sql);
      }
    }
  }
}
```

## 慢查询分析

### 1. 慢查询检测和记录
```javascript
// 慢查询检测器
class SlowQueryDetector {
  constructor(options = {}) {
    this.slowThreshold = options.slowThreshold || 1000; // 1秒
    this.verySlowThreshold = options.verySlowThreshold || 5000; // 5秒
    this.criticalThreshold = options.criticalThreshold || 10000; // 10秒
    
    this.slowQueries = [];
    this.queryPatterns = new Map();
    this.alertCallbacks = [];
    
    this.maxSlowQueries = options.maxSlowQueries || 1000;
    this.enablePatternAnalysis = options.enablePatternAnalysis !== false;
  }
  
  // 检测慢查询
  detectSlowQuery(sql, params, executionTime, metadata = {}) {
    if (executionTime < this.slowThreshold) {
      return null; // 不是慢查询
    }
    
    const severity = this.getSeverity(executionTime);
    const slowQuery = {
      id: this.generateId(),
      sql: sql,
      params: params,
      executionTime: executionTime,
      severity: severity,
      timestamp: new Date(),
      metadata: metadata,
      stackTrace: this.captureStackTrace(),
      fingerprint: this.generateFingerprint(sql)
    };
    
    // 记录慢查询
    this.recordSlowQuery(slowQuery);
    
    // 分析查询模式
    if (this.enablePatternAnalysis) {
      this.analyzeQueryPattern(slowQuery);
    }
    
    // 触发告警
    this.triggerAlerts(slowQuery);
    
    return slowQuery;
  }
  
  // 获取严重程度
  getSeverity(executionTime) {
    if (executionTime >= this.criticalThreshold) return 'critical';
    if (executionTime >= this.verySlowThreshold) return 'high';
    return 'medium';
  }
  
  // 记录慢查询
  recordSlowQuery(slowQuery) {
    this.slowQueries.push(slowQuery);
    
    // 保持最大记录数限制
    if (this.slowQueries.length > this.maxSlowQueries) {
      this.slowQueries.shift();
    }
    
    // 输出日志
    console.warn('慢查询检测:', {
      id: slowQuery.id,
      executionTime: slowQuery.executionTime + 'ms',
      severity: slowQuery.severity,
      sql: slowQuery.sql.substring(0, 100) + (slowQuery.sql.length > 100 ? '...' : ''),
      timestamp: slowQuery.timestamp
    });
  }
  
  // 分析查询模式
  analyzeQueryPattern(slowQuery) {
    const pattern = this.queryPatterns.get(slowQuery.fingerprint) || {
      fingerprint: slowQuery.fingerprint,
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      firstSeen: slowQuery.timestamp,
      lastSeen: slowQuery.timestamp,
      examples: []
    };
    
    pattern.count++;
    pattern.totalTime += slowQuery.executionTime;
    pattern.avgTime = pattern.totalTime / pattern.count;
    pattern.minTime = Math.min(pattern.minTime, slowQuery.executionTime);
    pattern.maxTime = Math.max(pattern.maxTime, slowQuery.executionTime);
    pattern.lastSeen = slowQuery.timestamp;
    
    // 保存示例查询
    if (pattern.examples.length < 3) {
      pattern.examples.push({
        sql: slowQuery.sql,
        params: slowQuery.params,
        executionTime: slowQuery.executionTime,
        timestamp: slowQuery.timestamp
      });
    }
    
    this.queryPatterns.set(slowQuery.fingerprint, pattern);
  }
  
  // 生成查询指纹
  generateFingerprint(sql) {
    return sql
      .replace(/\s+/g, ' ')
      .replace(/\?/g, '?')
      .replace(/\$\d+/g, '$N')
      .replace(/=\s*'[^']*'/g, "= 'VALUE'")
      .replace(/=\s*\d+/g, '= NUMBER')
      .replace(/IN\s*\([^)]+\)/gi, 'IN (VALUES)')
      .trim()
      .toLowerCase();
  }
  
  // 捕获堆栈跟踪
  captureStackTrace() {
    const error = new Error();
    const stack = error.stack?.split('\n').slice(2, 8); // 前几层调用栈
    return stack || [];
  }
  
  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // 触发告警
  triggerAlerts(slowQuery) {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(slowQuery);
      } catch (error) {
        console.error('告警回调执行失败:', error);
      }
    });
  }
  
  // 添加告警回调
  addAlertCallback(callback) {
    this.alertCallbacks.push(callback);
  }
  
  // 获取慢查询统计
  getSlowQueryStats() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;
    
    const recentQueries = this.slowQueries.filter(q => 
      q.timestamp.getTime() > oneHourAgo
    );
    
    const dailyQueries = this.slowQueries.filter(q => 
      q.timestamp.getTime() > oneDayAgo
    );
    
    return {
      total: this.slowQueries.length,
      recentCount: recentQueries.length,
      dailyCount: dailyQueries.length,
      severityDistribution: this.getSeverityDistribution(this.slowQueries),
      topPatterns: this.getTopPatterns(10),
      averageExecutionTime: this.getAverageExecutionTime(this.slowQueries),
      peakHours: this.getPeakHours(dailyQueries)
    };
  }
  
  // 获取严重程度分布
  getSeverityDistribution(queries) {
    const distribution = { critical: 0, high: 0, medium: 0 };
    
    queries.forEach(query => {
      distribution[query.severity]++;
    });
    
    return distribution;
  }
  
  // 获取热点查询模式
  getTopPatterns(limit = 10) {
    return Array.from(this.queryPatterns.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  // 获取平均执行时间
  getAverageExecutionTime(queries) {
    if (queries.length === 0) return 0;
    
    const totalTime = queries.reduce((sum, query) => sum + query.executionTime, 0);
    return totalTime / queries.length;
  }
  
  // 获取峰值时段
  getPeakHours(queries) {
    const hourlyCount = {};
    
    queries.forEach(query => {
      const hour = query.timestamp.getHours();
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });
    
    return Object.entries(hourlyCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  }
  
  // 获取慢查询详情
  getSlowQueryDetails(queryId) {
    return this.slowQueries.find(query => query.id === queryId);
  }
  
  // 获取查询模式详情
  getPatternDetails(fingerprint) {
    return this.queryPatterns.get(fingerprint);
  }
}
```

### 2. 慢查询优化建议
```javascript
// 慢查询优化建议生成器
class SlowQueryOptimizer {
  constructor(planAnalyzer) {
    this.planAnalyzer = planAnalyzer;
    this.optimizationRules = this.initializeRules();
  }
  
  // 初始化优化规则
  initializeRules() {
    return [
      {
        name: 'missing_index',
        pattern: /SELECT.*FROM.*WHERE/i,
        check: (query, plan) => {
          return plan?.issues?.some(issue => issue.includes('全表扫描') || issue.includes('顺序扫描'));
        },
        suggestion: '考虑为WHERE条件中的字段添加索引'
      },
      {
        name: 'no_limit',
        pattern: /SELECT.*FROM(?!.*LIMIT)/i,
        check: (query) => {
          return !query.sql.toLowerCase().includes('limit') && 
                 query.sql.toLowerCase().includes('select');
        },
        suggestion: '考虑添加LIMIT子句限制结果集大小'
      },
      {
        name: 'select_star',
        pattern: /SELECT\s+\*/i,
        check: (query) => {
          return query.sql.toLowerCase().includes('select *');
        },
        suggestion: '避免使用SELECT *，只查询需要的字段'
      },
      {
        name: 'inefficient_join',
        pattern: /JOIN/i,
        check: (query, plan) => {
          return plan?.issues?.some(issue => issue.includes('嵌套循环'));
        },
        suggestion: '优化JOIN查询，确保连接字段有索引'
      },
      {
        name: 'unnecessary_sorting',
        pattern: /ORDER BY/i,
        check: (query, plan) => {
          return plan?.issues?.some(issue => issue.includes('文件排序'));
        },
        suggestion: '考虑添加覆盖索引避免排序操作'
      },
      {
        name: 'subquery_optimization',
        pattern: /EXISTS\s*\(|IN\s*\(/i,
        check: (query) => {
          return /EXISTS\s*\(|IN\s*\(/.test(query.sql);
        },
        suggestion: '考虑将子查询重写为JOIN操作'
      }
    ];
  }
  
  // 生成优化建议
  async generateOptimizationSuggestions(slowQuery) {
    const suggestions = {
      queryId: slowQuery.id,
      sql: slowQuery.sql,
      executionTime: slowQuery.executionTime,
      severity: slowQuery.severity,
      suggestions: [],
      estimatedImprovement: 0
    };
    
    try {
      // 获取执行计划
      const plan = await this.planAnalyzer.analyzeMySQLPlan(slowQuery.sql, slowQuery.params);
      
      // 应用优化规则
      for (const rule of this.optimizationRules) {
        if (rule.pattern.test(slowQuery.sql) && rule.check(slowQuery, plan)) {
          suggestions.suggestions.push({
            type: rule.name,
            description: rule.suggestion,
            priority: this.calculatePriority(rule.name, slowQuery),
            examples: this.getOptimizationExamples(rule.name, slowQuery.sql)
          });
        }
      }
      
      // 基于执行计划的建议
      if (plan) {
        suggestions.suggestions.push(...this.generatePlanBasedSuggestions(plan));
      }
      
      // 估算改进效果
      suggestions.estimatedImprovement = this.estimateImprovement(suggestions.suggestions, slowQuery);
      
    } catch (error) {
      console.error('生成优化建议失败:', error);
      suggestions.suggestions.push({
        type: 'analysis_error',
        description: '无法分析查询执行计划，请手动检查查询语句',
        priority: 'low'
      });
    }
    
    return suggestions;
  }
  
  // 计算优化优先级
  calculatePriority(ruleType, slowQuery) {
    const severityWeight = {
      critical: 3,
      high: 2,
      medium: 1
    };
    
    const ruleWeight = {
      missing_index: 3,
      inefficient_join: 3,
      unnecessary_sorting: 2,
      select_star: 1,
      no_limit: 2,
      subquery_optimization: 2
    };
    
    const score = (severityWeight[slowQuery.severity] || 1) * (ruleWeight[ruleType] || 1);
    
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }
  
  // 获取优化示例
  getOptimizationExamples(ruleType, originalSQL) {
    const examples = {
      missing_index: {
        before: 'SELECT * FROM users WHERE email = ?',
        after: '-- 添加索引: CREATE INDEX idx_users_email ON users(email)\nSELECT * FROM users WHERE email = ?'
      },
      select_star: {
        before: 'SELECT * FROM users WHERE id = ?',
        after: 'SELECT id, name, email FROM users WHERE id = ?'
      },
      no_limit: {
        before: 'SELECT * FROM posts ORDER BY created_at DESC',
        after: 'SELECT * FROM posts ORDER BY created_at DESC LIMIT 20'
      },
      inefficient_join: {
        before: 'SELECT * FROM users u, orders o WHERE u.id = o.user_id',
        after: 'SELECT * FROM users u INNER JOIN orders o ON u.id = o.user_id'
      },
      unnecessary_sorting: {
        before: 'SELECT * FROM users ORDER BY created_at',
        after: '-- 添加索引: CREATE INDEX idx_users_created_at ON users(created_at)\nSELECT * FROM users ORDER BY created_at'
      },
      subquery_optimization: {
        before: 'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE status = "completed")',
        after: 'SELECT DISTINCT u.* FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE o.status = "completed"'
      }
    };
    
    return examples[ruleType] || null;
  }
  
  // 基于执行计划生成建议
  generatePlanBasedSuggestions(plan) {
    const suggestions = [];
    
    if (plan.issues) {
      plan.issues.forEach(issue => {
        if (issue.includes('全表扫描')) {
          suggestions.push({
            type: 'full_table_scan',
            description: '检测到全表扫描，建议添加适当的索引',
            priority: 'high'
          });
        }
        
        if (issue.includes('临时表')) {
          suggestions.push({
            type: 'temporary_table',
            description: '查询使用了临时表，考虑优化GROUP BY或DISTINCT操作',
            priority: 'medium'
          });
        }
        
        if (issue.includes('文件排序')) {
          suggestions.push({
            type: 'filesort',
            description: '查询使用了文件排序，考虑添加覆盖索引',
            priority: 'medium'
          });
        }
      });
    }
    
    if (plan.cost > 1000) {
      suggestions.push({
        type: 'high_cost',
        description: '查询成本很高，建议重新设计查询逻辑',
        priority: 'high'
      });
    }
    
    return suggestions;
  }
  
  // 估算改进效果
  estimateImprovement(suggestions, slowQuery) {
    let improvement = 0;
    
    suggestions.forEach(suggestion => {
      const improvementMap = {
        missing_index: 0.7,      // 70%改进
        inefficient_join: 0.5,   // 50%改进
        unnecessary_sorting: 0.3, // 30%改进
        select_star: 0.2,        // 20%改进
        no_limit: 0.4,           // 40%改进
        subquery_optimization: 0.6, // 60%改进
        full_table_scan: 0.8,    // 80%改进
        temporary_table: 0.4,    // 40%改进
        filesort: 0.3            // 30%改进
      };
      
      improvement = Math.max(improvement, improvementMap[suggestion.type] || 0);
    });
    
    return Math.round(improvement * 100); // 返回百分比
  }
  
  // 生成优化报告
  generateOptimizationReport(slowQueries) {
    const report = {
      summary: {
        totalSlowQueries: slowQueries.length,
        avgExecutionTime: slowQueries.reduce((sum, q) => sum + q.executionTime, 0) / slowQueries.length,
        optimizationOpportunities: 0
      },
      topOptimizationTargets: [],
      commonIssues: {},
      recommendations: []
    };
    
    // 统计常见问题
    slowQueries.forEach(query => {
      this.optimizationRules.forEach(rule => {
        if (rule.pattern.test(query.sql)) {
          report.commonIssues[rule.name] = (report.commonIssues[rule.name] || 0) + 1;
        }
      });
    });
    
    // 生成通用建议
    Object.entries(report.commonIssues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([issue, count]) => {
        const rule = this.optimizationRules.find(r => r.name === issue);
        if (rule) {
          report.recommendations.push({
            issue: issue,
            affectedQueries: count,
            suggestion: rule.suggestion,
            priority: count > slowQueries.length * 0.3 ? 'high' : 'medium'
          });
        }
      });
    
    return report;
  }
}
```

## 查询模式分析

### 1. 查询模式识别
```javascript
// 查询模式分析器
class QueryPatternAnalyzer {
  constructor() {
    this.patterns = new Map();
    this.antiPatterns = this.initializeAntiPatterns();
  }
  
  // 初始化反模式
  initializeAntiPatterns() {
    return [
      {
        name: 'n_plus_one',
        description: 'N+1查询问题',
        detector: (queries) => this.detectNPlusOne(queries),
        severity: 'high'
      },
      {
        name: 'cartesian_product',
        description: '笛卡尔积查询',
        detector: (queries) => this.detectCartesianProduct(queries),
        severity: 'critical'
      },
      {
        name: 'unnecessary_distinct',
        description: '不必要的DISTINCT',
        detector: (queries) => this.detectUnnecessaryDistinct(queries),
        severity: 'medium'
      },
      {
        name: 'inefficient_pagination',
        description: '低效分页查询',
        detector: (queries) => this.detectInefficientPagination(queries),
        severity: 'medium'
      },
      {
        name: 'missing_where_clause',
        description: '缺少WHERE条件',
        detector: (queries) => this.detectMissingWhereClause(queries),
        severity: 'high'
      }
    ];
  }
  
  // 分析查询模式
  analyzePatterns(queries) {
    const analysis = {
      totalQueries: queries.length,
      uniquePatterns: 0,
      antiPatternsFound: [],
      patternDistribution: {},
      recommendations: []
    };
    
    // 识别查询模式
    queries.forEach(query => {
      const fingerprint = this.generateFingerprint(query.sql);
      const pattern = this.patterns.get(fingerprint) || {
        fingerprint: fingerprint,
        count: 0,
        avgExecutionTime: 0,
        totalTime: 0,
        examples: []
      };
      
      pattern.count++;
      pattern.totalTime += query.executionTime || 0;
      pattern.avgExecutionTime = pattern.totalTime / pattern.count;
      
      if (pattern.examples.length < 3) {
        pattern.examples.push(query);
      }
      
      this.patterns.set(fingerprint, pattern);
    });
    
    analysis.uniquePatterns = this.patterns.size;
    
    // 检测反模式
    this.antiPatterns.forEach(antiPattern => {
      const detected = antiPattern.detector(queries);
      if (detected.length > 0) {
        analysis.antiPatternsFound.push({
          name: antiPattern.name,
          description: antiPattern.description,
          severity: antiPattern.severity,
          occurrences: detected.length,
          examples: detected.slice(0, 3)
        });
      }
    });
    
    // 生成模式分布
    const sortedPatterns = Array.from(this.patterns.values())
      .sort((a, b) => b.count - a.count);
    
    sortedPatterns.slice(0, 10).forEach((pattern, index) => {
      analysis.patternDistribution[`pattern_${index + 1}`] = {
        fingerprint: pattern.fingerprint,
        count: pattern.count,
        percentage: (pattern.count / queries.length) * 100,
        avgExecutionTime: pattern.avgExecutionTime
      };
    });
    
    // 生成建议
    analysis.recommendations = this.generatePatternRecommendations(analysis);
    
    return analysis;
  }
  
  // 检测N+1查询问题
  detectNPlusOne(queries) {
    const nPlusOneQueries = [];
    const queryGroups = {};
    
    // 按时间窗口分组查询
    queries.forEach(query => {
      const timeWindow = Math.floor(query.timestamp?.getTime() / 1000 / 5) * 5; // 5秒窗口
      const fingerprint = this.generateFingerprint(query.sql);
      
      if (!queryGroups[timeWindow]) {
        queryGroups[timeWindow] = {};
      }
      
      if (!queryGroups[timeWindow][fingerprint]) {
        queryGroups[timeWindow][fingerprint] = [];
      }
      
      queryGroups[timeWindow][fingerprint].push(query);
    });
    
    // 检测重复查询
    Object.values(queryGroups).forEach(window => {
      Object.entries(window).forEach(([fingerprint, queries]) => {
        if (queries.length > 10) { // 在短时间内执行超过10次相同查询
          nPlusOneQueries.push({
            fingerprint: fingerprint,
            count: queries.length,
            examples: queries.slice(0, 3),
            timeWindow: queries[0].timestamp
          });
        }
      });
    });
    
    return nPlusOneQueries;
  }
  
  // 检测笛卡尔积查询
  detectCartesianProduct(queries) {
    const cartesianQueries = [];
    
    queries.forEach(query => {
      const sql = query.sql.toLowerCase();
      
      // 检测没有JOIN条件的多表查询
      if (sql.includes('from') && sql.includes(',')) {
        const fromClause = sql.substring(sql.indexOf('from'), sql.indexOf('where') > -1 ? sql.indexOf('where') : sql.length);
        const tableCount = (fromClause.match(/,/g) || []).length + 1;
        
        if (tableCount > 1 && !sql.includes('join') && !sql.includes('where')) {
          cartesianQueries.push(query);
        }
      }
      
      // 检测JOIN但没有ON条件
      if (sql.includes('join') && !sql.includes(' on ')) {
        cartesianQueries.push(query);
      }
    });
    
    return cartesianQueries;
  }
  
  // 检测不必要的DISTINCT
  detectUnnecessaryDistinct(queries) {
    const unnecessaryDistinct = [];
    
    queries.forEach(query => {
      const sql = query.sql.toLowerCase();
      
      if (sql.includes('distinct')) {
        // 如果查询包含主键或唯一键，DISTINCT可能是不必要的
        if (sql.includes('id =') || sql.includes('primary key')) {
          unnecessaryDistinct.push(query);
        }
        
        // 如果只查询一个表且没有JOIN，DISTINCT可能不必要
        if (!sql.includes('join') && !sql.includes(',') && sql.includes('from')) {
          const fromMatch = sql.match(/from\s+(\w+)/);
          if (fromMatch && !sql.includes('group by')) {
            unnecessaryDistinct.push(query);
          }
        }
      }
    });
    
    return unnecessaryDistinct;
  }
  
  // 检测低效分页查询
  detectInefficientPagination(queries) {
    const inefficientPagination = [];
    
    queries.forEach(query => {
      const sql = query.sql.toLowerCase();
      
      if (sql.includes('limit') && sql.includes('offset')) {
        const offsetMatch = sql.match(/offset\s+(\d+)/);
        if (offsetMatch) {
          const offset = parseInt(offsetMatch[1]);
          if (offset > 1000) { // 大偏移量分页
            inefficientPagination.push({
              ...query,
              reason: '大偏移量分页效率低下',
              offset: offset
            });
          }
        }
      }
      
      // 检测没有ORDER BY的LIMIT查询
      if (sql.includes('limit') && !sql.includes('order by')) {
        inefficientPagination.push({
          ...query,
          reason: '分页查询缺少ORDER BY子句'
        });
      }
    });
    
    return inefficientPagination;
  }
  
  // 检测缺少WHERE条件的查询
  detectMissingWhereClause(queries) {
    const missingWhere = [];
    
    queries.forEach(query => {
      const sql = query.sql.toLowerCase();
      
      if (sql.includes('select') && sql.includes('from') && !sql.includes('where')) {
        // 排除一些合理的情况
        if (!sql.includes('count(*)') && !sql.includes('limit 1') && !sql.includes('order by')) {
          missingWhere.push(query);
        }
      }
    });
    
    return missingWhere;
  }
  
  // 生成查询指纹
  generateFingerprint(sql) {
    return sql
      .replace(/\s+/g, ' ')
      .replace(/\?/g, '?')
      .replace(/\$\d+/g, '$N')
      .replace(/=\s*'[^']*'/g, "= 'VALUE'")
      .replace(/=\s*\d+/g, '= NUMBER')
      .replace(/IN\s*\([^)]+\)/gi, 'IN (VALUES)')
      .trim()
      .toLowerCase();
  }
  
  // 生成模式建议
  generatePatternRecommendations(analysis) {
    const recommendations = [];
    
    // 基于反模式生成建议
    analysis.antiPatternsFound.forEach(antiPattern => {
      switch (antiPattern.name) {
        case 'n_plus_one':
          recommendations.push({
            type: 'optimization',
            priority: 'high',
            description: '检测到N+1查询问题，建议使用JOIN或批量查询优化',
            impact: '可显著提升性能，减少数据库往返次数'
          });
          break;
        case 'cartesian_product':
          recommendations.push({
            type: 'bug_fix',
            priority: 'critical',
            description: '检测到笛卡尔积查询，请添加适当的JOIN条件',
            impact: '修复后可避免返回大量无用数据和性能问题'
          });
          break;
        case 'inefficient_pagination':
          recommendations.push({
            type: 'optimization',
            priority: 'medium',
            description: '优化分页查询，考虑使用游标分页或索引优化',
            impact: '改善大数据集分页的性能'
          });
          break;
      }
    });
    
    // 基于查询频率生成建议
    const topPatterns = Object.values(analysis.patternDistribution)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    topPatterns.forEach(pattern => {
      if (pattern.percentage > 20) {
        recommendations.push({
          type: 'caching',
          priority: 'medium',
          description: `查询模式 "${pattern.fingerprint.substring(0, 50)}..." 占总查询的${pattern.percentage.toFixed(1)}%，建议考虑缓存`,
          impact: '通过缓存热点查询可以显著减少数据库负载'
        });
      }
    });
    
    return recommendations;
  }
  
  // 获取查询模式报告
  getPatternReport() {
    const sortedPatterns = Array.from(this.patterns.values())
      .sort((a, b) => b.count - a.count);
    
    return {
      totalPatterns: this.patterns.size,
      topPatterns: sortedPatterns.slice(0, 20),
      summary: {
        mostFrequentPattern: sortedPatterns[0],
        slowestPattern: sortedPatterns.sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)[0],
        totalQueries: sortedPatterns.reduce((sum, p) => sum + p.count, 0)
      }
    };
  }
}
```

## 总结

查询分析是数据库性能优化的基础：

1. **全面监控**：监控查询执行时间、资源消耗和错误率
2. **执行计划分析**：深入分析查询执行计划，识别性能瓶颈
3. **慢查询检测**：自动检测和记录慢查询，提供优化建议
4. **模式识别**：识别查询模式和反模式，预防性能问题
5. **智能建议**：基于分析结果生成具体的优化建议
6. **持续优化**：建立持续的查询分析和优化流程

通过系统化的查询分析，可以及时发现性能问题，指导数据库优化工作，提升应用整体性能。
