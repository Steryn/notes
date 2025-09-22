# 索引优化

## 概述

索引是数据库性能优化的核心工具，正确的索引策略可以将查询性能提升几个数量级。本文详细介绍如何在Node.js应用中进行索引设计、创建、监控和优化。

## 索引基础理论

### 1. 索引类型和特点
```javascript
// 索引类型分析器
class IndexTypeAnalyzer {
  constructor() {
    this.indexTypes = {
      btree: {
        name: 'B-Tree索引',
        description: '最常用的索引类型，适用于等值查询和范围查询',
        advantages: ['支持排序', '支持范围查询', '支持前缀匹配'],
        disadvantages: ['存储开销大', '维护成本高'],
        bestFor: ['等值查询', '范围查询', 'ORDER BY', 'GROUP BY']
      },
      hash: {
        name: '哈希索引',
        description: '基于哈希表的索引，只支持等值查询',
        advantages: ['等值查询极快', '存储空间小'],
        disadvantages: ['不支持范围查询', '不支持排序', '不支持前缀匹配'],
        bestFor: ['等值查询', '唯一性约束']
      },
      fulltext: {
        name: '全文索引',
        description: '专门用于文本搜索的索引',
        advantages: ['支持文本搜索', '支持相关性排序'],
        disadvantages: ['存储开销大', '维护复杂'],
        bestFor: ['全文搜索', '模糊匹配']
      },
      spatial: {
        name: '空间索引',
        description: '用于地理位置数据的索引',
        advantages: ['支持空间查询', '支持地理位置计算'],
        disadvantages: ['特定用途', '复杂度高'],
        bestFor: ['地理位置查询', '空间范围查询']
      }
    };
  }
  
  // 推荐索引类型
  recommendIndexType(queryPattern, dataType, cardinality) {
    const recommendations = [];
    
    if (queryPattern.includes('=') && !queryPattern.includes('LIKE')) {
      if (cardinality > 0.8) { // 高基数
        recommendations.push({
          type: 'btree',
          confidence: 0.9,
          reason: '等值查询且数据基数高，B-Tree索引最适合'
        });
      } else {
        recommendations.push({
          type: 'hash',
          confidence: 0.7,
          reason: '等值查询且数据基数低，哈希索引可能更高效'
        });
      }
    }
    
    if (queryPattern.includes('BETWEEN') || queryPattern.includes('>') || queryPattern.includes('<')) {
      recommendations.push({
        type: 'btree',
        confidence: 0.95,
        reason: '范围查询必须使用B-Tree索引'
      });
    }
    
    if (queryPattern.includes('ORDER BY')) {
      recommendations.push({
        type: 'btree',
        confidence: 0.9,
        reason: '排序操作需要B-Tree索引'
      });
    }
    
    if (queryPattern.includes('LIKE') && dataType === 'text') {
      if (queryPattern.includes('%')) {
        recommendations.push({
          type: 'fulltext',
          confidence: 0.8,
          reason: '模糊匹配建议使用全文索引'
        });
      } else {
        recommendations.push({
          type: 'btree',
          confidence: 0.7,
          reason: '前缀匹配可以使用B-Tree索引'
        });
      }
    }
    
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }
  
  // 分析索引效果
  analyzeIndexEffectiveness(indexStats) {
    const analysis = {
      utilization: 0,
      selectivity: 0,
      effectiveness: 'unknown',
      recommendations: []
    };
    
    // 计算索引利用率
    if (indexStats.totalQueries > 0) {
      analysis.utilization = (indexStats.indexUsage / indexStats.totalQueries) * 100;
    }
    
    // 计算索引选择性
    if (indexStats.totalRows > 0) {
      analysis.selectivity = indexStats.distinctValues / indexStats.totalRows;
    }
    
    // 评估索引效果
    if (analysis.utilization > 80 && analysis.selectivity > 0.5) {
      analysis.effectiveness = 'excellent';
    } else if (analysis.utilization > 50 && analysis.selectivity > 0.3) {
      analysis.effectiveness = 'good';
    } else if (analysis.utilization > 20 && analysis.selectivity > 0.1) {
      analysis.effectiveness = 'fair';
    } else {
      analysis.effectiveness = 'poor';
    }
    
    // 生成建议
    if (analysis.utilization < 10) {
      analysis.recommendations.push('索引使用率过低，考虑删除该索引');
    }
    
    if (analysis.selectivity < 0.1) {
      analysis.recommendations.push('索引选择性过低，考虑创建复合索引');
    }
    
    if (analysis.effectiveness === 'poor') {
      analysis.recommendations.push('索引效果不佳，需要重新设计索引策略');
    }
    
    return analysis;
  }
}
```

### 2. 索引设计原则
```javascript
// 索引设计顾问
class IndexDesignAdvisor {
  constructor() {
    this.designPrinciples = [
      {
        name: 'selectivity',
        description: '索引选择性原则',
        rule: '优先为高选择性字段创建索引',
        checker: (column) => this.checkSelectivity(column)
      },
      {
        name: 'cardinality',
        description: '基数原则',
        rule: '高基数字段更适合创建索引',
        checker: (column) => this.checkCardinality(column)
      },
      {
        name: 'query_frequency',
        description: '查询频率原则',
        rule: '为频繁查询的字段创建索引',
        checker: (column) => this.checkQueryFrequency(column)
      },
      {
        name: 'column_order',
        description: '列顺序原则',
        rule: '复合索引中选择性高的列应放在前面',
        checker: (columns) => this.checkColumnOrder(columns)
      },
      {
        name: 'covering_index',
        description: '覆盖索引原则',
        rule: '考虑创建覆盖索引减少回表操作',
        checker: (query) => this.checkCoveringIndex(query)
      }
    ];
  }
  
  // 检查选择性
  checkSelectivity(column) {
    const selectivity = column.distinctValues / column.totalRows;
    
    return {
      score: Math.min(selectivity * 100, 100),
      recommendation: selectivity > 0.5 ? 
        '选择性良好，适合创建索引' : 
        '选择性较低，考虑与其他列组合创建复合索引',
      priority: selectivity > 0.5 ? 'high' : 'medium'
    };
  }
  
  // 检查基数
  checkCardinality(column) {
    const cardinality = column.distinctValues;
    const cardinalityRatio = cardinality / column.totalRows;
    
    let score = 0;
    let recommendation = '';
    let priority = 'low';
    
    if (cardinalityRatio > 0.8) {
      score = 90;
      recommendation = '基数很高，强烈建议创建索引';
      priority = 'high';
    } else if (cardinalityRatio > 0.5) {
      score = 70;
      recommendation = '基数较高，建议创建索引';
      priority = 'medium';
    } else if (cardinalityRatio > 0.1) {
      score = 40;
      recommendation = '基数一般，可考虑创建复合索引';
      priority = 'medium';
    } else {
      score = 20;
      recommendation = '基数较低，不建议单独创建索引';
      priority = 'low';
    }
    
    return { score, recommendation, priority };
  }
  
  // 检查查询频率
  checkQueryFrequency(column) {
    const frequency = column.queryCount || 0;
    const totalQueries = column.totalQueries || 1;
    const frequencyRatio = frequency / totalQueries;
    
    let score = Math.min(frequencyRatio * 100, 100);
    let recommendation = '';
    let priority = 'low';
    
    if (frequencyRatio > 0.5) {
      recommendation = '查询频率很高，强烈建议创建索引';
      priority = 'high';
    } else if (frequencyRatio > 0.2) {
      recommendation = '查询频率较高，建议创建索引';
      priority = 'medium';
    } else if (frequencyRatio > 0.05) {
      recommendation = '查询频率一般，可考虑创建索引';
      priority = 'medium';
    } else {
      recommendation = '查询频率较低，不建议创建索引';
      priority = 'low';
    }
    
    return { score, recommendation, priority };
  }
  
  // 检查列顺序
  checkColumnOrder(columns) {
    const sortedBySelectivity = [...columns].sort((a, b) => b.selectivity - a.selectivity);
    const isOptimal = JSON.stringify(columns.map(c => c.name)) === 
                     JSON.stringify(sortedBySelectivity.map(c => c.name));
    
    return {
      score: isOptimal ? 100 : 60,
      recommendation: isOptimal ? 
        '列顺序已优化' : 
        `建议调整列顺序为: ${sortedBySelectivity.map(c => c.name).join(', ')}`,
      priority: isOptimal ? 'low' : 'medium'
    };
  }
  
  // 检查覆盖索引
  checkCoveringIndex(query) {
    const selectColumns = this.extractSelectColumns(query.sql);
    const whereColumns = this.extractWhereColumns(query.sql);
    const allColumns = [...new Set([...selectColumns, ...whereColumns])];
    
    return {
      score: 70,
      recommendation: `考虑创建覆盖索引包含列: ${allColumns.join(', ')}`,
      priority: 'medium',
      suggestedColumns: allColumns
    };
  }
  
  // 提取SELECT列
  extractSelectColumns(sql) {
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i);
    if (!selectMatch) return [];
    
    const selectClause = selectMatch[1];
    if (selectClause.includes('*')) return [];
    
    return selectClause.split(',').map(col => col.trim().replace(/.*\./, ''));
  }
  
  // 提取WHERE列
  extractWhereColumns(sql) {
    const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (!whereMatch) return [];
    
    const whereClause = whereMatch[1];
    const columns = [];
    
    // 简单的列提取（实际应该用更复杂的解析器）
    const columnMatches = whereClause.match(/(\w+)\s*[=<>!]/g);
    if (columnMatches) {
      columnMatches.forEach(match => {
        const column = match.replace(/\s*[=<>!].*/, '').trim();
        columns.push(column);
      });
    }
    
    return columns;
  }
  
  // 生成索引设计建议
  generateIndexDesign(tableAnalysis, queryPatterns) {
    const recommendations = [];
    
    // 分析每个查询模式
    queryPatterns.forEach(pattern => {
      const columns = this.analyzeQueryColumns(pattern);
      
      columns.forEach(column => {
        const columnStats = tableAnalysis.columns[column];
        if (!columnStats) return;
        
        const analysis = {
          column: column,
          selectivity: this.checkSelectivity(columnStats),
          cardinality: this.checkCardinality(columnStats),
          frequency: this.checkQueryFrequency(columnStats)
        };
        
        const totalScore = (analysis.selectivity.score + 
                           analysis.cardinality.score + 
                           analysis.frequency.score) / 3;
        
        if (totalScore > 60) {
          recommendations.push({
            type: 'single_column',
            column: column,
            score: totalScore,
            analysis: analysis,
            sql: `CREATE INDEX idx_${tableAnalysis.tableName}_${column} ON ${tableAnalysis.tableName}(${column})`
          });
        }
      });
      
      // 分析复合索引机会
      if (columns.length > 1) {
        const compositeAnalysis = this.analyzeCompositeIndex(columns, tableAnalysis);
        if (compositeAnalysis.score > 70) {
          recommendations.push({
            type: 'composite',
            columns: columns,
            score: compositeAnalysis.score,
            analysis: compositeAnalysis,
            sql: `CREATE INDEX idx_${tableAnalysis.tableName}_${columns.join('_')} ON ${tableAnalysis.tableName}(${columns.join(', ')})`
          });
        }
      }
    });
    
    // 去重并排序
    const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
    return uniqueRecommendations.sort((a, b) => b.score - a.score);
  }
  
  // 分析查询列
  analyzeQueryColumns(queryPattern) {
    const columns = [];
    
    // 提取WHERE条件中的列
    const whereColumns = this.extractWhereColumns(queryPattern.sql);
    columns.push(...whereColumns);
    
    // 提取ORDER BY中的列
    const orderByMatch = queryPattern.sql.match(/ORDER\s+BY\s+([\w\s,]+)/i);
    if (orderByMatch) {
      const orderColumns = orderByMatch[1].split(',').map(col => 
        col.trim().replace(/\s+(ASC|DESC)$/i, '').replace(/.*\./, '')
      );
      columns.push(...orderColumns);
    }
    
    return [...new Set(columns)];
  }
  
  // 分析复合索引
  analyzeCompositeIndex(columns, tableAnalysis) {
    let totalScore = 0;
    let validColumns = 0;
    
    columns.forEach(column => {
      const columnStats = tableAnalysis.columns[column];
      if (columnStats) {
        const selectivity = this.checkSelectivity(columnStats);
        const cardinality = this.checkCardinality(columnStats);
        const frequency = this.checkQueryFrequency(columnStats);
        
        totalScore += (selectivity.score + cardinality.score + frequency.score) / 3;
        validColumns++;
      }
    });
    
    const avgScore = validColumns > 0 ? totalScore / validColumns : 0;
    const compositeBonus = columns.length > 1 ? 10 : 0; // 复合索引额外加分
    
    return {
      score: avgScore + compositeBonus,
      columnCount: columns.length,
      recommendation: `创建复合索引可以优化多列查询`,
      priority: avgScore > 70 ? 'high' : 'medium'
    };
  }
  
  // 去重建议
  deduplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      const key = rec.type === 'single_column' ? 
        rec.column : 
        rec.columns.sort().join(',');
      
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}
```

## 索引创建和管理

### 1. 自动索引创建
```javascript
// 自动索引创建器
class AutoIndexCreator {
  constructor(pool, options = {}) {
    this.pool = pool;
    this.options = {
      enableAutoCreation: options.enableAutoCreation || false,
      dryRun: options.dryRun !== false,
      maxIndexesPerTable: options.maxIndexesPerTable || 10,
      minQueryCount: options.minQueryCount || 100,
      minImprovement: options.minImprovement || 0.3
    };
    
    this.pendingIndexes = new Map();
    this.createdIndexes = new Map();
  }
  
  // 分析并创建索引
  async analyzeAndCreateIndexes(queryStats, tableStats) {
    const recommendations = [];
    
    // 分析每个表的查询模式
    for (const [tableName, stats] of Object.entries(tableStats)) {
      const tableRecommendations = await this.analyzeTableIndexes(tableName, stats, queryStats);
      recommendations.push(...tableRecommendations);
    }
    
    // 按优先级排序
    const sortedRecommendations = recommendations.sort((a, b) => b.priority - a.priority);
    
    // 创建索引
    const results = [];
    for (const recommendation of sortedRecommendations.slice(0, 10)) { // 限制同时创建的索引数量
      const result = await this.createIndexIfBeneficial(recommendation);
      results.push(result);
    }
    
    return results;
  }
  
  // 分析表索引需求
  async analyzeTableIndexes(tableName, tableStats, queryStats) {
    const recommendations = [];
    
    // 获取表的查询统计
    const tableQueries = queryStats.filter(q => 
      q.sql.toLowerCase().includes(tableName.toLowerCase())
    );
    
    if (tableQueries.length < this.options.minQueryCount) {
      return recommendations; // 查询量不足，不建议创建索引
    }
    
    // 分析慢查询
    const slowQueries = tableQueries.filter(q => q.executionTime > 1000);
    
    for (const query of slowQueries) {
      const indexRecommendation = await this.analyzeQueryForIndex(query, tableStats);
      if (indexRecommendation) {
        recommendations.push(indexRecommendation);
      }
    }
    
    return recommendations;
  }
  
  // 分析查询的索引需求
  async analyzeQueryForIndex(query, tableStats) {
    try {
      // 获取执行计划
      const plan = await this.getExecutionPlan(query.sql, query.params);
      
      if (!plan || !this.needsIndex(plan)) {
        return null;
      }
      
      // 提取索引候选列
      const candidateColumns = this.extractIndexCandidates(query.sql, plan);
      
      if (candidateColumns.length === 0) {
        return null;
      }
      
      // 计算预期改进
      const expectedImprovement = this.estimateImprovement(plan, candidateColumns);
      
      if (expectedImprovement < this.options.minImprovement) {
        return null;
      }
      
      return {
        tableName: this.extractTableName(query.sql),
        columns: candidateColumns,
        queryExample: query,
        expectedImprovement: expectedImprovement,
        priority: this.calculatePriority(query, expectedImprovement),
        indexType: this.determineIndexType(candidateColumns, query.sql),
        estimatedSize: this.estimateIndexSize(candidateColumns, tableStats)
      };
    } catch (error) {
      console.error('分析查询索引需求失败:', error);
      return null;
    }
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
  
  // 判断是否需要索引
  needsIndex(plan) {
    const issues = this.extractPlanIssues(plan);
    
    return issues.some(issue => 
      issue.includes('全表扫描') || 
      issue.includes('Using filesort') ||
      issue.includes('Using temporary')
    );
  }
  
  // 提取执行计划问题
  extractPlanIssues(plan) {
    const issues = [];
    
    const traversePlan = (node) => {
      if (node.table) {
        if (node.table.access_type === 'ALL') {
          issues.push(`表 ${node.table.table_name} 全表扫描`);
        }
        
        if (node.table.extra) {
          if (node.table.extra.includes('Using filesort')) {
            issues.push(`表 ${node.table.table_name} 使用文件排序`);
          }
          if (node.table.extra.includes('Using temporary')) {
            issues.push(`表 ${node.table.table_name} 使用临时表`);
          }
        }
      }
      
      if (node.nested_loop) {
        node.nested_loop.forEach(item => traversePlan(item));
      }
    };
    
    traversePlan(plan.query_block);
    return issues;
  }
  
  // 提取索引候选列
  extractIndexCandidates(sql, plan) {
    const candidates = [];
    
    // 从WHERE条件提取
    const whereColumns = this.extractWhereColumns(sql);
    candidates.push(...whereColumns);
    
    // 从ORDER BY提取
    const orderByMatch = sql.match(/ORDER\s+BY\s+([\w\s,]+)/i);
    if (orderByMatch) {
      const orderColumns = orderByMatch[1].split(',').map(col => 
        col.trim().replace(/\s+(ASC|DESC)$/i, '').replace(/.*\./, '')
      );
      candidates.push(...orderColumns);
    }
    
    // 从GROUP BY提取
    const groupByMatch = sql.match(/GROUP\s+BY\s+([\w\s,]+)/i);
    if (groupByMatch) {
      const groupColumns = groupByMatch[1].split(',').map(col => 
        col.trim().replace(/.*\./, '')
      );
      candidates.push(...groupColumns);
    }
    
    return [...new Set(candidates)];
  }
  
  // 估算改进效果
  estimateImprovement(plan, columns) {
    let improvement = 0;
    
    // 基于执行计划问题估算改进
    const issues = this.extractPlanIssues(plan);
    
    issues.forEach(issue => {
      if (issue.includes('全表扫描')) {
        improvement += 0.7; // 70%改进
      }
      if (issue.includes('文件排序')) {
        improvement += 0.3; // 30%改进
      }
      if (issue.includes('临时表')) {
        improvement += 0.4; // 40%改进
      }
    });
    
    // 基于查询成本估算
    const cost = plan.query_block?.cost_info?.query_cost || 0;
    if (cost > 1000) {
      improvement += 0.5;
    } else if (cost > 100) {
      improvement += 0.3;
    }
    
    return Math.min(improvement, 0.9); // 最大90%改进
  }
  
  // 计算优先级
  calculatePriority(query, expectedImprovement) {
    let priority = 0;
    
    // 基于执行时间
    if (query.executionTime > 5000) {
      priority += 30;
    } else if (query.executionTime > 1000) {
      priority += 20;
    } else {
      priority += 10;
    }
    
    // 基于查询频率
    const frequency = query.count || 1;
    if (frequency > 1000) {
      priority += 30;
    } else if (frequency > 100) {
      priority += 20;
    } else {
      priority += 10;
    }
    
    // 基于预期改进
    priority += expectedImprovement * 40;
    
    return Math.min(priority, 100);
  }
  
  // 确定索引类型
  determineIndexType(columns, sql) {
    if (columns.length === 1) {
      if (sql.toLowerCase().includes('like')) {
        return 'fulltext';
      }
      return 'btree';
    } else {
      return 'composite';
    }
  }
  
  // 估算索引大小
  estimateIndexSize(columns, tableStats) {
    let estimatedSize = 0;
    
    columns.forEach(column => {
      const columnStats = tableStats.columns[column];
      if (columnStats) {
        // 简单估算：行数 * 平均列长度 * 索引开销系数
        estimatedSize += tableStats.rowCount * (columnStats.avgLength || 10) * 1.2;
      }
    });
    
    return Math.round(estimatedSize / 1024 / 1024); // 转换为MB
  }
  
  // 创建有益的索引
  async createIndexIfBeneficial(recommendation) {
    const indexName = `idx_auto_${recommendation.tableName}_${recommendation.columns.join('_')}`;
    
    // 检查索引是否已存在
    const existingIndex = await this.checkIndexExists(recommendation.tableName, indexName);
    if (existingIndex) {
      return {
        success: false,
        reason: '索引已存在',
        recommendation: recommendation
      };
    }
    
    // 检查表的索引数量限制
    const indexCount = await this.getTableIndexCount(recommendation.tableName);
    if (indexCount >= this.options.maxIndexesPerTable) {
      return {
        success: false,
        reason: '表索引数量已达上限',
        recommendation: recommendation
      };
    }
    
    // 生成创建索引的SQL
    const createSQL = this.generateCreateIndexSQL(indexName, recommendation);
    
    if (this.options.dryRun) {
      console.log('DRY RUN - 将创建索引:', createSQL);
      return {
        success: true,
        dryRun: true,
        sql: createSQL,
        recommendation: recommendation
      };
    }
    
    // 实际创建索引
    if (this.options.enableAutoCreation) {
      try {
        const startTime = Date.now();
        await this.executeCreateIndex(createSQL);
        const creationTime = Date.now() - startTime;
        
        // 记录创建的索引
        this.createdIndexes.set(indexName, {
          recommendation: recommendation,
          createdAt: new Date(),
          creationTime: creationTime
        });
        
        console.log(`索引创建成功: ${indexName}, 耗时: ${creationTime}ms`);
        
        return {
          success: true,
          indexName: indexName,
          creationTime: creationTime,
          recommendation: recommendation
        };
      } catch (error) {
        console.error('索引创建失败:', error);
        return {
          success: false,
          error: error.message,
          recommendation: recommendation
        };
      }
    } else {
      return {
        success: false,
        reason: '自动创建索引未启用',
        recommendation: recommendation,
        suggestedSQL: createSQL
      };
    }
  }
  
  // 检查索引是否存在
  async checkIndexExists(tableName, indexName) {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        'SELECT COUNT(*) as count FROM information_schema.statistics WHERE table_name = ? AND index_name = ?',
        [tableName, indexName]
      );
      
      return rows[0].count > 0;
    } finally {
      connection.release();
    }
  }
  
  // 获取表的索引数量
  async getTableIndexCount(tableName) {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        'SELECT COUNT(DISTINCT index_name) as count FROM information_schema.statistics WHERE table_name = ?',
        [tableName]
      );
      
      return rows[0].count;
    } finally {
      connection.release();
    }
  }
  
  // 生成创建索引SQL
  generateCreateIndexSQL(indexName, recommendation) {
    const columns = recommendation.columns.join(', ');
    return `CREATE INDEX ${indexName} ON ${recommendation.tableName}(${columns})`;
  }
  
  // 执行创建索引
  async executeCreateIndex(sql) {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.execute(sql);
    } finally {
      connection.release();
    }
  }
  
  // 提取表名
  extractTableName(sql) {
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    return fromMatch ? fromMatch[1] : 'unknown';
  }
  
  // 提取WHERE列
  extractWhereColumns(sql) {
    const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (!whereMatch) return [];
    
    const whereClause = whereMatch[1];
    const columns = [];
    
    const columnMatches = whereClause.match(/(\w+)\s*[=<>!]/g);
    if (columnMatches) {
      columnMatches.forEach(match => {
        const column = match.replace(/\s*[=<>!].*/, '').trim();
        columns.push(column);
      });
    }
    
    return columns;
  }
}
```

## 索引监控和维护

### 1. 索引使用情况监控
```javascript
// 索引使用监控器
class IndexUsageMonitor {
  constructor(pool) {
    this.pool = pool;
    this.usageStats = new Map();
    this.monitoringInterval = null;
  }
  
  // 开始监控
  startMonitoring(interval = 300000) { // 5分钟
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(async () => {
      await this.collectIndexUsageStats();
    }, interval);
    
    console.log('索引使用监控已启动');
  }
  
  // 停止监控
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('索引使用监控已停止');
    }
  }
  
  // 收集索引使用统计
  async collectIndexUsageStats() {
    try {
      const stats = await this.getIndexUsageFromDatabase();
      
      stats.forEach(stat => {
        const key = `${stat.table_schema}.${stat.table_name}.${stat.index_name}`;
        const existing = this.usageStats.get(key) || {
          schema: stat.table_schema,
          table: stat.table_name,
          index: stat.index_name,
          columns: stat.columns,
          usageHistory: []
        };
        
        existing.usageHistory.push({
          timestamp: new Date(),
          reads: stat.reads,
          writes: stat.writes,
          size: stat.size_mb
        });
        
        // 保持最近100条记录
        if (existing.usageHistory.length > 100) {
          existing.usageHistory.shift();
        }
        
        this.usageStats.set(key, existing);
      });
      
      console.log(`收集了 ${stats.length} 个索引的使用统计`);
    } catch (error) {
      console.error('收集索引使用统计失败:', error);
    }
  }
  
  // 从数据库获取索引使用统计
  async getIndexUsageFromDatabase() {
    const connection = await this.pool.getConnection();
    
    try {
      // MySQL 5.7+的性能模式查询
      const [rows] = await connection.execute(`
        SELECT 
          s.table_schema,
          s.table_name,
          s.index_name,
          GROUP_CONCAT(s.column_name ORDER BY s.seq_in_index) as columns,
          COALESCE(ius.count_read, 0) as reads,
          COALESCE(ius.count_write, 0) as writes,
          ROUND(
            (SELECT SUM(stat_value * @@innodb_page_size) / 1024 / 1024
             FROM information_schema.innodb_index_stats 
             WHERE database_name = s.table_schema 
               AND table_name = s.table_name 
               AND index_name = s.index_name 
               AND stat_name = 'size'), 2
          ) as size_mb
        FROM information_schema.statistics s
        LEFT JOIN performance_schema.table_io_waits_summary_by_index_usage ius
          ON s.table_schema = ius.object_schema
          AND s.table_name = ius.object_name
          AND s.index_name = ius.index_name
        WHERE s.table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
        GROUP BY s.table_schema, s.table_name, s.index_name
        ORDER BY reads DESC
      `);
      
      return rows;
    } finally {
      connection.release();
    }
  }
  
  // 分析索引使用效率
  analyzeIndexEfficiency() {
    const analysis = {
      totalIndexes: this.usageStats.size,
      unusedIndexes: [],
      lowUsageIndexes: [],
      highUsageIndexes: [],
      recommendations: []
    };
    
    this.usageStats.forEach((stats, key) => {
      const latestStats = stats.usageHistory[stats.usageHistory.length - 1];
      if (!latestStats) return;
      
      const usageScore = this.calculateUsageScore(stats);
      
      if (usageScore === 0) {
        analysis.unusedIndexes.push({
          key: key,
          stats: stats,
          recommendation: '考虑删除未使用的索引'
        });
      } else if (usageScore < 10) {
        analysis.lowUsageIndexes.push({
          key: key,
          stats: stats,
          usageScore: usageScore,
          recommendation: '使用率较低，评估是否需要保留'
        });
      } else if (usageScore > 80) {
        analysis.highUsageIndexes.push({
          key: key,
          stats: stats,
          usageScore: usageScore,
          recommendation: '高使用率索引，保持现状'
        });
      }
    });
    
    // 生成总体建议
    if (analysis.unusedIndexes.length > 0) {
      analysis.recommendations.push({
        type: 'cleanup',
        description: `发现 ${analysis.unusedIndexes.length} 个未使用的索引，建议清理`,
        priority: 'medium'
      });
    }
    
    if (analysis.lowUsageIndexes.length > analysis.totalIndexes * 0.3) {
      analysis.recommendations.push({
        type: 'optimization',
        description: '超过30%的索引使用率较低，建议优化索引策略',
        priority: 'high'
      });
    }
    
    return analysis;
  }
  
  // 计算使用评分
  calculateUsageScore(indexStats) {
    if (indexStats.usageHistory.length === 0) return 0;
    
    const recentStats = indexStats.usageHistory.slice(-10); // 最近10次记录
    const totalReads = recentStats.reduce((sum, stat) => sum + (stat.reads || 0), 0);
    const totalWrites = recentStats.reduce((sum, stat) => sum + (stat.writes || 0), 0);
    const totalUsage = totalReads + totalWrites;
    
    if (totalUsage === 0) return 0;
    
    // 基于使用频率计算分数
    const avgUsage = totalUsage / recentStats.length;
    
    if (avgUsage > 1000) return 100;
    if (avgUsage > 100) return 80;
    if (avgUsage > 10) return 60;
    if (avgUsage > 1) return 40;
    return 20;
  }
  
  // 获取索引使用报告
  getUsageReport() {
    const analysis = this.analyzeIndexEfficiency();
    
    return {
      summary: {
        totalIndexes: analysis.totalIndexes,
        unusedCount: analysis.unusedIndexes.length,
        lowUsageCount: analysis.lowUsageIndexes.length,
        highUsageCount: analysis.highUsageIndexes.length
      },
      unusedIndexes: analysis.unusedIndexes.map(item => ({
        table: `${item.stats.schema}.${item.stats.table}`,
        index: item.stats.index,
        columns: item.stats.columns,
        size: this.getLatestSize(item.stats),
        recommendation: item.recommendation
      })),
      recommendations: analysis.recommendations,
      topUsedIndexes: analysis.highUsageIndexes.slice(0, 10).map(item => ({
        table: `${item.stats.schema}.${item.stats.table}`,
        index: item.stats.index,
        columns: item.stats.columns,
        usageScore: item.usageScore,
        size: this.getLatestSize(item.stats)
      }))
    };
  }
  
  // 获取最新大小
  getLatestSize(indexStats) {
    if (indexStats.usageHistory.length === 0) return 0;
    const latest = indexStats.usageHistory[indexStats.usageHistory.length - 1];
    return latest.size || 0;
  }
  
  // 生成清理建议
  generateCleanupSuggestions() {
    const analysis = this.analyzeIndexEfficiency();
    const suggestions = [];
    
    // 未使用的索引
    analysis.unusedIndexes.forEach(item => {
      suggestions.push({
        type: 'drop',
        priority: 'high',
        table: `${item.stats.schema}.${item.stats.table}`,
        index: item.stats.index,
        reason: '索引从未被使用',
        sql: `DROP INDEX ${item.stats.index} ON ${item.stats.schema}.${item.stats.table}`,
        estimatedSavings: this.getLatestSize(item.stats)
      });
    });
    
    // 低使用率的索引
    analysis.lowUsageIndexes.forEach(item => {
      if (item.usageScore < 5) {
        suggestions.push({
          type: 'consider_drop',
          priority: 'medium',
          table: `${item.stats.schema}.${item.stats.table}`,
          index: item.stats.index,
          reason: `索引使用率很低 (${item.usageScore}分)`,
          sql: `-- 考虑删除: DROP INDEX ${item.stats.index} ON ${item.stats.schema}.${item.stats.table}`,
          estimatedSavings: this.getLatestSize(item.stats)
        });
      }
    });
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}
```

## 总结

索引优化是数据库性能提升的关键技术：

1. **科学设计**：基于查询模式和数据特征设计索引
2. **自动化管理**：实现索引的自动分析、创建和维护
3. **持续监控**：监控索引使用情况和效果
4. **定期优化**：清理无用索引，优化索引结构
5. **性能评估**：量化索引对查询性能的影响
6. **最佳实践**：遵循索引设计的最佳实践原则

通过系统化的索引优化策略，可以显著提升数据库查询性能，减少资源消耗。
