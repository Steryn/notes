# 查询重写

## 概述

查询重写是数据库性能优化的高级技术，通过改写SQL语句的结构和逻辑，在保持结果一致的前提下提升查询性能。本文介绍各种查询重写技术和在Node.js中的实现方法。

## 查询重写规则

### 1. 子查询优化
```javascript
// 子查询重写器
class SubqueryRewriter {
  constructor() {
    this.rewriteRules = [
      {
        name: 'exists_to_join',
        pattern: /EXISTS\s*\(\s*SELECT.*?FROM\s+(\w+).*?WHERE.*?\)/gi,
        rewriter: this.existsToJoin.bind(this)
      },
      {
        name: 'in_to_join',
        pattern: /IN\s*\(\s*SELECT.*?FROM\s+(\w+).*?\)/gi,
        rewriter: this.inToJoin.bind(this)
      },
      {
        name: 'scalar_subquery_to_join',
        pattern: /SELECT.*?\(\s*SELECT.*?FROM\s+(\w+).*?\).*?FROM/gi,
        rewriter: this.scalarSubqueryToJoin.bind(this)
      }
    ];
  }
  
  // 重写查询
  rewriteQuery(sql) {
    let rewrittenSQL = sql;
    const appliedRules = [];
    
    for (const rule of this.rewriteRules) {
      const matches = rewrittenSQL.match(rule.pattern);
      if (matches) {
        const newSQL = rule.rewriter(rewrittenSQL);
        if (newSQL && newSQL !== rewrittenSQL) {
          rewrittenSQL = newSQL;
          appliedRules.push(rule.name);
        }
      }
    }
    
    return {
      originalSQL: sql,
      rewrittenSQL: rewrittenSQL,
      appliedRules: appliedRules,
      improved: appliedRules.length > 0
    };
  }
  
  // EXISTS转JOIN
  existsToJoin(sql) {
    // 示例：将EXISTS子查询转换为INNER JOIN
    const existsPattern = /WHERE\s+EXISTS\s*\(\s*SELECT\s+.*?\s+FROM\s+(\w+)\s+(\w+)?\s+WHERE\s+(.*?)\)/gi;
    
    return sql.replace(existsPattern, (match, subTable, subAlias, whereCondition) => {
      // 提取主查询的FROM子句
      const fromMatch = sql.match(/FROM\s+(\w+)(?:\s+(\w+))?/i);
      if (!fromMatch) return match;
      
      const mainTable = fromMatch[1];
      const mainAlias = fromMatch[2] || mainTable;
      const subTableAlias = subAlias || subTable;
      
      // 构建JOIN条件
      const joinCondition = whereCondition.replace(
        new RegExp(`\\b${mainAlias}\\.`, 'g'), 
        `${mainAlias}.`
      );
      
      // 替换EXISTS为JOIN
      const joinClause = `INNER JOIN ${subTable} ${subTableAlias} ON ${joinCondition}`;
      
      // 在FROM子句后添加JOIN
      const newSQL = sql.replace(
        /FROM\s+\w+(?:\s+\w+)?/i,
        `$& ${joinClause}`
      ).replace(existsPattern, '');
      
      return newSQL;
    });
  }
  
  // IN转JOIN
  inToJoin(sql) {
    // 示例：将IN子查询转换为INNER JOIN
    const inPattern = /(\w+)\s+IN\s*\(\s*SELECT\s+(\w+)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*?))?\s*\)/gi;
    
    return sql.replace(inPattern, (match, column, subColumn, subTable, whereCondition) => {
      // 生成唯一的表别名
      const subAlias = `sub_${subTable}`;
      
      // 构建JOIN条件
      let joinCondition = `${column} = ${subAlias}.${subColumn}`;
      if (whereCondition) {
        joinCondition += ` AND ${whereCondition.replace(/(\w+)(?=\s*[=<>])/g, `${subAlias}.$1`)}`;
      }
      
      // 构建JOIN子句
      const joinClause = `INNER JOIN ${subTable} ${subAlias} ON ${joinCondition}`;
      
      // 在FROM子句后添加JOIN
      const newSQL = sql.replace(
        /FROM\s+\w+(?:\s+\w+)?/i,
        `$& ${joinClause}`
      ).replace(inPattern, 'TRUE'); // 将IN条件替换为TRUE
      
      return newSQL;
    });
  }
  
  // 标量子查询转JOIN
  scalarSubqueryToJoin(sql) {
    // 示例：将标量子查询转换为LEFT JOIN
    const scalarPattern = /\(\s*SELECT\s+(.*?)\s+FROM\s+(\w+)(?:\s+(\w+))?\s+WHERE\s+(.*?)\s*\)/gi;
    
    return sql.replace(scalarPattern, (match, selectExpr, subTable, subAlias, whereCondition) => {
      const subTableAlias = subAlias || `sub_${subTable}`;
      
      // 构建JOIN条件
      const joinCondition = whereCondition.replace(/(\w+)(?=\s*[=<>])/g, `${subTableAlias}.$1`);
      
      // 构建JOIN子句
      const joinClause = `LEFT JOIN ${subTable} ${subTableAlias} ON ${joinCondition}`;
      
      // 在FROM子句后添加JOIN
      const newSQL = sql.replace(
        /FROM\s+\w+(?:\s+\w+)?/i,
        `$& ${joinClause}`
      ).replace(scalarPattern, `${subTableAlias}.${selectExpr}`);
      
      return newSQL;
    });
  }
}
```

### 2. JOIN优化
```javascript
// JOIN优化重写器
class JoinOptimizer {
  constructor() {
    this.optimizationRules = [
      {
        name: 'implicit_to_explicit_join',
        pattern: /FROM\s+.*?,.*?\s+WHERE/gi,
        optimizer: this.implicitToExplicitJoin.bind(this)
      },
      {
        name: 'join_order_optimization',
        pattern: /FROM\s+.*?JOIN.*?JOIN/gi,
        optimizer: this.optimizeJoinOrder.bind(this)
      },
      {
        name: 'unnecessary_join_elimination',
        pattern: /JOIN.*?ON.*?=/gi,
        optimizer: this.eliminateUnnecessaryJoins.bind(this)
      }
    ];
  }
  
  // 优化JOIN查询
  optimizeJoins(sql, tableStats) {
    let optimizedSQL = sql;
    const appliedOptimizations = [];
    
    for (const rule of this.optimizationRules) {
      if (rule.pattern.test(optimizedSQL)) {
        const newSQL = rule.optimizer(optimizedSQL, tableStats);
        if (newSQL && newSQL !== optimizedSQL) {
          optimizedSQL = newSQL;
          appliedOptimizations.push(rule.name);
        }
      }
    }
    
    return {
      originalSQL: sql,
      optimizedSQL: optimizedSQL,
      appliedOptimizations: appliedOptimizations,
      improved: appliedOptimizations.length > 0
    };
  }
  
  // 隐式JOIN转显式JOIN
  implicitToExplicitJoin(sql, tableStats) {
    // 将逗号分隔的表转换为显式JOIN
    const fromMatch = sql.match(/FROM\s+(.*?)\s+WHERE\s+(.*?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (!fromMatch) return sql;
    
    const fromClause = fromMatch[1];
    const whereClause = fromMatch[2];
    
    // 检查是否是隐式JOIN
    if (!fromClause.includes(',')) return sql;
    
    const tables = fromClause.split(',').map(t => t.trim());
    if (tables.length < 2) return sql;
    
    // 提取JOIN条件
    const joinConditions = this.extractJoinConditions(whereClause, tables);
    
    // 构建显式JOIN
    let joinSQL = tables[0];
    for (let i = 1; i < tables.length; i++) {
      const table = tables[i];
      const condition = joinConditions.find(c => c.includes(table));
      
      if (condition) {
        joinSQL += ` INNER JOIN ${table} ON ${condition}`;
      } else {
        joinSQL += ` CROSS JOIN ${table}`;
      }
    }
    
    // 移除WHERE子句中的JOIN条件
    let newWhereClause = whereClause;
    joinConditions.forEach(condition => {
      newWhereClause = newWhereClause.replace(new RegExp(`\\s*AND\\s*${condition}`, 'gi'), '');
      newWhereClause = newWhereClause.replace(new RegExp(`^${condition}\\s*AND\\s*`, 'gi'), '');
      newWhereClause = newWhereClause.replace(new RegExp(`^${condition}$`, 'gi'), '');
    });
    
    // 重构SQL
    return sql.replace(
      /FROM\s+.*?\s+WHERE\s+.*?(?=\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i,
      `FROM ${joinSQL}${newWhereClause.trim() ? ` WHERE ${newWhereClause}` : ''}`
    );
  }
  
  // 提取JOIN条件
  extractJoinConditions(whereClause, tables) {
    const conditions = [];
    const tableAliases = tables.map(t => {
      const parts = t.split(/\s+/);
      return parts.length > 1 ? parts[1] : parts[0];
    });
    
    // 查找表之间的等值连接条件
    const equalityPattern = /(\w+\.\w+)\s*=\s*(\w+\.\w+)/gi;
    let match;
    
    while ((match = equalityPattern.exec(whereClause)) !== null) {
      const leftTable = match[1].split('.')[0];
      const rightTable = match[2].split('.')[0];
      
      // 检查是否是表之间的连接
      if (tableAliases.includes(leftTable) && tableAliases.includes(rightTable)) {
        conditions.push(`${match[1]} = ${match[2]}`);
      }
    }
    
    return conditions;
  }
  
  // 优化JOIN顺序
  optimizeJoinOrder(sql, tableStats) {
    if (!tableStats) return sql;
    
    // 提取JOIN信息
    const joinInfo = this.parseJoinStructure(sql);
    if (joinInfo.length < 2) return sql;
    
    // 基于表大小重新排序JOIN
    const optimizedOrder = this.calculateOptimalJoinOrder(joinInfo, tableStats);
    
    // 重构SQL
    return this.reconstructJoinSQL(sql, optimizedOrder);
  }
  
  // 解析JOIN结构
  parseJoinStructure(sql) {
    const joins = [];
    const joinPattern = /(LEFT|RIGHT|INNER|CROSS)?\s*JOIN\s+(\w+)(?:\s+(\w+))?\s+ON\s+(.*?)(?=\s+(?:LEFT|RIGHT|INNER|CROSS)?\s*JOIN|\s+WHERE|\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/gi;
    
    let match;
    while ((match = joinPattern.exec(sql)) !== null) {
      joins.push({
        type: match[1] || 'INNER',
        table: match[2],
        alias: match[3] || match[2],
        condition: match[4]
      });
    }
    
    return joins;
  }
  
  // 计算最优JOIN顺序
  calculateOptimalJoinOrder(joins, tableStats) {
    // 简单策略：小表在前，大表在后
    return joins.sort((a, b) => {
      const sizeA = tableStats[a.table]?.rowCount || 0;
      const sizeB = tableStats[b.table]?.rowCount || 0;
      return sizeA - sizeB;
    });
  }
  
  // 重构JOIN SQL
  reconstructJoinSQL(sql, optimizedJoins) {
    // 这里需要更复杂的SQL重构逻辑
    // 简化实现，实际应该使用SQL解析器
    return sql; // 暂时返回原SQL
  }
  
  // 消除不必要的JOIN
  eliminateUnnecessaryJoins(sql, tableStats) {
    // 检查是否有只用于过滤但不返回数据的JOIN
    const selectColumns = this.extractSelectColumns(sql);
    const joinTables = this.extractJoinTables(sql);
    
    // 找出SELECT中未使用的JOIN表
    const unusedJoins = joinTables.filter(table => 
      !selectColumns.some(col => col.startsWith(table))
    );
    
    if (unusedJoins.length === 0) return sql;
    
    // 将未使用的JOIN转换为EXISTS条件
    let optimizedSQL = sql;
    unusedJoins.forEach(table => {
      optimizedSQL = this.convertJoinToExists(optimizedSQL, table);
    });
    
    return optimizedSQL;
  }
  
  // 提取SELECT列
  extractSelectColumns(sql) {
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i);
    if (!selectMatch || selectMatch[1].includes('*')) return [];
    
    return selectMatch[1].split(',').map(col => col.trim());
  }
  
  // 提取JOIN表
  extractJoinTables(sql) {
    const tables = [];
    const joinPattern = /JOIN\s+(\w+)(?:\s+(\w+))?/gi;
    
    let match;
    while ((match = joinPattern.exec(sql)) !== null) {
      tables.push(match[2] || match[1]);
    }
    
    return tables;
  }
  
  // 将JOIN转换为EXISTS
  convertJoinToExists(sql, table) {
    // 简化实现
    return sql;
  }
}
```

### 3. 条件优化
```javascript
// 条件优化重写器
class ConditionOptimizer {
  constructor() {
    this.optimizationRules = [
      {
        name: 'constant_folding',
        optimizer: this.constantFolding.bind(this)
      },
      {
        name: 'predicate_pushdown',
        optimizer: this.predicatePushdown.bind(this)
      },
      {
        name: 'redundant_condition_elimination',
        optimizer: this.eliminateRedundantConditions.bind(this)
      },
      {
        name: 'range_optimization',
        optimizer: this.optimizeRangeConditions.bind(this)
      }
    ];
  }
  
  // 优化WHERE条件
  optimizeConditions(sql) {
    let optimizedSQL = sql;
    const appliedOptimizations = [];
    
    for (const rule of this.optimizationRules) {
      const newSQL = rule.optimizer(optimizedSQL);
      if (newSQL && newSQL !== optimizedSQL) {
        optimizedSQL = newSQL;
        appliedOptimizations.push(rule.name);
      }
    }
    
    return {
      originalSQL: sql,
      optimizedSQL: optimizedSQL,
      appliedOptimizations: appliedOptimizations,
      improved: appliedOptimizations.length > 0
    };
  }
  
  // 常量折叠
  constantFolding(sql) {
    // 计算常量表达式
    let optimizedSQL = sql;
    
    // 数学运算
    optimizedSQL = optimizedSQL.replace(/(\d+)\s*\+\s*(\d+)/g, (match, a, b) => {
      return (parseInt(a) + parseInt(b)).toString();
    });
    
    optimizedSQL = optimizedSQL.replace(/(\d+)\s*\-\s*(\d+)/g, (match, a, b) => {
      return (parseInt(a) - parseInt(b)).toString();
    });
    
    optimizedSQL = optimizedSQL.replace(/(\d+)\s*\*\s*(\d+)/g, (match, a, b) => {
      return (parseInt(a) * parseInt(b)).toString();
    });
    
    // 布尔运算
    optimizedSQL = optimizedSQL.replace(/TRUE\s+AND\s+/gi, '');
    optimizedSQL = optimizedSQL.replace(/\s+AND\s+TRUE/gi, '');
    optimizedSQL = optimizedSQL.replace(/FALSE\s+OR\s+/gi, '');
    optimizedSQL = optimizedSQL.replace(/\s+OR\s+FALSE/gi, '');
    
    return optimizedSQL;
  }
  
  // 谓词下推
  predicatePushdown(sql) {
    // 将WHERE条件尽可能推到子查询中
    const subqueryPattern = /\(\s*SELECT.*?FROM\s+(\w+).*?\)/gi;
    
    return sql.replace(subqueryPattern, (subquery) => {
      // 提取主查询的WHERE条件
      const mainWhereMatch = sql.match(/WHERE\s+(.*?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
      if (!mainWhereMatch) return subquery;
      
      const mainConditions = this.parseConditions(mainWhereMatch[1]);
      
      // 找出可以下推的条件
      const pushdownConditions = mainConditions.filter(condition => {
        return this.canPushdown(condition, subquery);
      });
      
      if (pushdownConditions.length === 0) return subquery;
      
      // 将条件添加到子查询
      const existingWhere = subquery.match(/WHERE\s+(.*?)\)/i);
      if (existingWhere) {
        const newCondition = existingWhere[1] + ' AND ' + pushdownConditions.join(' AND ');
        return subquery.replace(/WHERE\s+.*?\)/, `WHERE ${newCondition})`);
      } else {
        const insertPos = subquery.lastIndexOf(')');
        return subquery.slice(0, insertPos) + ` WHERE ${pushdownConditions.join(' AND ')}` + subquery.slice(insertPos);
      }
    });
  }
  
  // 解析条件
  parseConditions(whereClause) {
    // 简化实现：按AND分割
    return whereClause.split(/\s+AND\s+/i).map(c => c.trim());
  }
  
  // 检查是否可以下推
  canPushdown(condition, subquery) {
    // 检查条件中的列是否在子查询中存在
    const columnMatch = condition.match(/(\w+)\s*[=<>!]/);
    if (!columnMatch) return false;
    
    const column = columnMatch[1];
    return subquery.includes(column);
  }
  
  // 消除冗余条件
  eliminateRedundantConditions(sql) {
    const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (!whereMatch) return sql;
    
    const conditions = this.parseConditions(whereMatch[1]);
    const uniqueConditions = [...new Set(conditions)];
    
    if (uniqueConditions.length < conditions.length) {
      const newWhereClause = uniqueConditions.join(' AND ');
      return sql.replace(/WHERE\s+.*?(?=\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i, `WHERE ${newWhereClause}`);
    }
    
    return sql;
  }
  
  // 优化范围条件
  optimizeRangeConditions(sql) {
    // 将多个范围条件合并为BETWEEN
    let optimizedSQL = sql;
    
    // 查找 column >= value1 AND column <= value2 模式
    const rangePattern = /(\w+)\s*>=\s*(\d+)\s+AND\s+\1\s*<=\s*(\d+)/gi;
    
    optimizedSQL = optimizedSQL.replace(rangePattern, (match, column, min, max) => {
      return `${column} BETWEEN ${min} AND ${max}`;
    });
    
    // 查找 column > value1 AND column < value2 模式
    const exclusiveRangePattern = /(\w+)\s*>\s*(\d+)\s+AND\s+\1\s*<\s*(\d+)/gi;
    
    optimizedSQL = optimizedSQL.replace(exclusiveRangePattern, (match, column, min, max) => {
      const minVal = parseInt(min) + 1;
      const maxVal = parseInt(max) - 1;
      return `${column} BETWEEN ${minVal} AND ${maxVal}`;
    });
    
    return optimizedSQL;
  }
}
```

## 查询重写引擎

### 1. 统一重写引擎
```javascript
// 查询重写引擎
class QueryRewriteEngine {
  constructor(pool) {
    this.pool = pool;
    this.subqueryRewriter = new SubqueryRewriter();
    this.joinOptimizer = new JoinOptimizer();
    this.conditionOptimizer = new ConditionOptimizer();
    
    this.rewriteHistory = new Map();
    this.performanceGains = new Map();
  }
  
  // 重写查询
  async rewriteQuery(sql, params, options = {}) {
    const startTime = Date.now();
    
    try {
      // 获取表统计信息
      const tableStats = await this.getTableStats(sql);
      
      // 应用重写规则
      let currentSQL = sql;
      const rewriteSteps = [];
      
      // 1. 子查询优化
      if (options.optimizeSubqueries !== false) {
        const subqueryResult = this.subqueryRewriter.rewriteQuery(currentSQL);
        if (subqueryResult.improved) {
          currentSQL = subqueryResult.rewrittenSQL;
          rewriteSteps.push({
            step: 'subquery_optimization',
            appliedRules: subqueryResult.appliedRules,
            before: subqueryResult.originalSQL,
            after: subqueryResult.rewrittenSQL
          });
        }
      }
      
      // 2. JOIN优化
      if (options.optimizeJoins !== false) {
        const joinResult = this.joinOptimizer.optimizeJoins(currentSQL, tableStats);
        if (joinResult.improved) {
          currentSQL = joinResult.optimizedSQL;
          rewriteSteps.push({
            step: 'join_optimization',
            appliedOptimizations: joinResult.appliedOptimizations,
            before: joinResult.originalSQL,
            after: joinResult.optimizedSQL
          });
        }
      }
      
      // 3. 条件优化
      if (options.optimizeConditions !== false) {
        const conditionResult = this.conditionOptimizer.optimizeConditions(currentSQL);
        if (conditionResult.improved) {
          currentSQL = conditionResult.optimizedSQL;
          rewriteSteps.push({
            step: 'condition_optimization',
            appliedOptimizations: conditionResult.appliedOptimizations,
            before: conditionResult.originalSQL,
            after: conditionResult.optimizedSQL
          });
        }
      }
      
      // 验证重写结果
      const isValid = await this.validateRewrite(sql, currentSQL, params);
      if (!isValid) {
        console.warn('查询重写验证失败，使用原查询');
        currentSQL = sql;
        rewriteSteps.length = 0;
      }
      
      const rewriteTime = Date.now() - startTime;
      
      // 记录重写历史
      const rewriteId = this.generateRewriteId(sql);
      this.rewriteHistory.set(rewriteId, {
        originalSQL: sql,
        rewrittenSQL: currentSQL,
        rewriteSteps: rewriteSteps,
        rewriteTime: rewriteTime,
        timestamp: new Date()
      });
      
      return {
        rewriteId: rewriteId,
        originalSQL: sql,
        rewrittenSQL: currentSQL,
        improved: rewriteSteps.length > 0,
        rewriteSteps: rewriteSteps,
        rewriteTime: rewriteTime
      };
      
    } catch (error) {
      console.error('查询重写失败:', error);
      return {
        originalSQL: sql,
        rewrittenSQL: sql,
        improved: false,
        error: error.message
      };
    }
  }
  
  // 获取表统计信息
  async getTableStats(sql) {
    const tables = this.extractTableNames(sql);
    const stats = {};
    
    for (const table of tables) {
      try {
        stats[table] = await this.getTableStatistics(table);
      } catch (error) {
        console.warn(`获取表 ${table} 统计信息失败:`, error.message);
      }
    }
    
    return stats;
  }
  
  // 提取表名
  extractTableNames(sql) {
    const tables = new Set();
    
    // 提取FROM子句中的表
    const fromMatches = sql.match(/FROM\s+(\w+)(?:\s+\w+)?/gi);
    if (fromMatches) {
      fromMatches.forEach(match => {
        const tableName = match.replace(/FROM\s+/i, '').split(/\s+/)[0];
        tables.add(tableName);
      });
    }
    
    // 提取JOIN子句中的表
    const joinMatches = sql.match(/JOIN\s+(\w+)(?:\s+\w+)?/gi);
    if (joinMatches) {
      joinMatches.forEach(match => {
        const tableName = match.replace(/JOIN\s+/i, '').split(/\s+/)[0];
        tables.add(tableName);
      });
    }
    
    return Array.from(tables);
  }
  
  // 获取表统计信息
  async getTableStatistics(tableName) {
    const connection = await this.pool.getConnection();
    
    try {
      // 获取表行数
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as row_count FROM ${tableName}`
      );
      
      // 获取表大小
      const [sizeResult] = await connection.execute(`
        SELECT 
          ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
        FROM information_schema.tables 
        WHERE table_name = ? AND table_schema = DATABASE()
      `, [tableName]);
      
      return {
        rowCount: countResult[0].row_count,
        sizeMB: sizeResult[0]?.size_mb || 0
      };
    } finally {
      connection.release();
    }
  }
  
  // 验证重写结果
  async validateRewrite(originalSQL, rewrittenSQL, params) {
    if (originalSQL === rewrittenSQL) {
      return true; // 没有重写，无需验证
    }
    
    try {
      const connection = await this.pool.getConnection();
      
      // 执行EXPLAIN检查语法
      await connection.execute(`EXPLAIN ${rewrittenSQL}`, params);
      
      connection.release();
      return true;
    } catch (error) {
      console.error('重写查询验证失败:', error);
      return false;
    }
  }
  
  // 生成重写ID
  generateRewriteId(sql) {
    const hash = require('crypto').createHash('md5').update(sql).digest('hex');
    return `rewrite_${hash.substring(0, 8)}_${Date.now()}`;
  }
  
  // 测试性能改进
  async testPerformanceImprovement(rewriteId) {
    const rewrite = this.rewriteHistory.get(rewriteId);
    if (!rewrite) {
      throw new Error('重写记录不存在');
    }
    
    const testResults = {
      rewriteId: rewriteId,
      originalPerformance: null,
      rewrittenPerformance: null,
      improvement: 0,
      recommendUse: false
    };
    
    try {
      // 测试原查询性能
      testResults.originalPerformance = await this.measureQueryPerformance(
        rewrite.originalSQL, []
      );
      
      // 测试重写查询性能
      testResults.rewrittenPerformance = await this.measureQueryPerformance(
        rewrite.rewrittenSQL, []
      );
      
      // 计算改进
      if (testResults.originalPerformance.executionTime > 0) {
        const timeSaved = testResults.originalPerformance.executionTime - 
                         testResults.rewrittenPerformance.executionTime;
        testResults.improvement = (timeSaved / testResults.originalPerformance.executionTime) * 100;
        testResults.recommendUse = testResults.improvement > 10; // 改进超过10%才推荐
      }
      
      // 记录性能收益
      this.performanceGains.set(rewriteId, testResults);
      
    } catch (error) {
      console.error('性能测试失败:', error);
      testResults.error = error.message;
    }
    
    return testResults;
  }
  
  // 测量查询性能
  async measureQueryPerformance(sql, params) {
    const connection = await this.pool.getConnection();
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await connection.execute(sql, params);
      const endTime = process.hrtime.bigint();
      
      const executionTime = Number(endTime - startTime) / 1000000; // 转换为毫秒
      
      return {
        executionTime: executionTime,
        rowCount: Array.isArray(result[0]) ? result[0].length : 0,
        success: true
      };
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;
      
      return {
        executionTime: executionTime,
        rowCount: 0,
        success: false,
        error: error.message
      };
    } finally {
      connection.release();
    }
  }
  
  // 获取重写统计
  getRewriteStats() {
    const totalRewrites = this.rewriteHistory.size;
    const successfulRewrites = Array.from(this.rewriteHistory.values())
      .filter(r => r.rewriteSteps.length > 0).length;
    
    const performanceTests = Array.from(this.performanceGains.values());
    const beneficialRewrites = performanceTests.filter(t => t.improvement > 10).length;
    
    const avgImprovement = performanceTests.length > 0 ?
      performanceTests.reduce((sum, t) => sum + t.improvement, 0) / performanceTests.length : 0;
    
    return {
      totalRewrites: totalRewrites,
      successfulRewrites: successfulRewrites,
      beneficialRewrites: beneficialRewrites,
      successRate: totalRewrites > 0 ? (successfulRewrites / totalRewrites) * 100 : 0,
      averageImprovement: avgImprovement,
      recentRewrites: Array.from(this.rewriteHistory.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
    };
  }
}
```

## 总结

查询重写是数据库性能优化的高级技术：

1. **子查询优化**：将子查询转换为JOIN提升性能
2. **JOIN优化**：优化JOIN顺序和类型
3. **条件优化**：简化和优化WHERE条件
4. **自动化重写**：建立自动化的查询重写流程
5. **性能验证**：验证重写效果和性能改进
6. **持续优化**：基于统计信息持续优化重写规则

通过系统化的查询重写，可以在不修改应用代码的情况下显著提升查询性能。
