# 迁移策略

## 概述

数据库迁移是指将数据和应用程序从一个数据库环境转移到另一个环境的过程。这包括版本升级、平台迁移、架构变更等场景。制定合适的迁移策略对于确保数据完整性、最小化停机时间和降低业务风险至关重要。

## 迁移类型和策略

### 1. 蓝绿部署迁移
```javascript
// 蓝绿部署迁移管理器
class BlueGreenMigration {
  constructor(blueDB, greenDB, loadBalancer) {
    this.blueDB = blueDB;
    this.greenDB = greenDB;
    this.loadBalancer = loadBalancer;
    this.currentActive = 'blue';
    this.migrationStatus = 'idle';
  }
  
  // 执行蓝绿迁移
  async executeMigration(migrationPlan) {
    this.migrationStatus = 'in_progress';
    
    try {
      const targetDB = this.currentActive === 'blue' ? this.greenDB : this.blueDB;
      const targetColor = this.currentActive === 'blue' ? 'green' : 'blue';
      
      console.log(`开始迁移到${targetColor}环境`);
      
      // 1. 准备目标环境
      await this.prepareTargetEnvironment(targetDB, migrationPlan);
      
      // 2. 数据同步
      await this.syncData(this.getActiveDB(), targetDB);
      
      // 3. 验证数据完整性
      const validationResult = await this.validateData(targetDB);
      if (!validationResult.success) {
        throw new Error('数据验证失败: ' + validationResult.errors.join(', '));
      }
      
      // 4. 切换流量
      await this.switchTraffic(targetColor);
      
      // 5. 验证切换结果
      await this.verifySwitchSuccess();
      
      this.currentActive = targetColor;
      this.migrationStatus = 'completed';
      
      console.log(`迁移完成，当前活跃环境: ${targetColor}`);
      
      return {
        success: true,
        activeEnvironment: targetColor,
        migrationTime: Date.now()
      };
      
    } catch (error) {
      console.error('迁移失败:', error);
      
      // 回滚操作
      await this.rollback();
      
      this.migrationStatus = 'failed';
      
      return {
        success: false,
        error: error.message,
        activeEnvironment: this.currentActive
      };
    }
  }
  
  // 准备目标环境
  async prepareTargetEnvironment(targetDB, migrationPlan) {
    console.log('准备目标环境...');
    
    // 执行schema变更
    if (migrationPlan.schemaChanges) {
      for (const change of migrationPlan.schemaChanges) {
        await targetDB.execute(change.sql);
      }
    }
    
    // 创建索引
    if (migrationPlan.indexes) {
      for (const index of migrationPlan.indexes) {
        await targetDB.execute(index.createSQL);
      }
    }
    
    // 初始化配置
    if (migrationPlan.configurations) {
      for (const config of migrationPlan.configurations) {
        await targetDB.setConfiguration(config.key, config.value);
      }
    }
  }
  
  // 数据同步
  async syncData(sourceDB, targetDB) {
    console.log('开始数据同步...');
    
    const tables = await sourceDB.getTables();
    
    for (const table of tables) {
      await this.syncTable(sourceDB, targetDB, table);
    }
    
    console.log('数据同步完成');
  }
  
  // 同步单表数据
  async syncTable(sourceDB, targetDB, tableName) {
    const batchSize = 1000;
    let offset = 0;
    let totalRows = 0;
    
    while (true) {
      const rows = await sourceDB.query(
        `SELECT * FROM ${tableName} LIMIT ${batchSize} OFFSET ${offset}`
      );
      
      if (rows.length === 0) break;
      
      // 批量插入目标数据库
      await this.batchInsert(targetDB, tableName, rows);
      
      totalRows += rows.length;
      offset += batchSize;
      
      console.log(`${tableName}: 已同步 ${totalRows} 行`);
    }
  }
  
  // 批量插入数据
  async batchInsert(targetDB, tableName, rows) {
    if (rows.length === 0) return;
    
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    const transaction = await targetDB.beginTransaction();
    
    try {
      for (const row of rows) {
        const values = columns.map(col => row[col]);
        await transaction.execute(sql, values);
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  // 验证数据完整性
  async validateData(targetDB) {
    console.log('验证数据完整性...');
    
    const errors = [];
    const sourceDB = this.getActiveDB();
    
    try {
      // 验证表数量
      const sourceTables = await sourceDB.getTables();
      const targetTables = await targetDB.getTables();
      
      if (sourceTables.length !== targetTables.length) {
        errors.push(`表数量不匹配: 源${sourceTables.length}, 目标${targetTables.length}`);
      }
      
      // 验证每个表的行数
      for (const table of sourceTables) {
        const [sourceCount] = await sourceDB.query(`SELECT COUNT(*) as count FROM ${table}`);
        const [targetCount] = await targetDB.query(`SELECT COUNT(*) as count FROM ${table}`);
        
        if (sourceCount.count !== targetCount.count) {
          errors.push(`表${table}行数不匹配: 源${sourceCount.count}, 目标${targetCount.count}`);
        }
      }
      
      return {
        success: errors.length === 0,
        errors: errors
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }
  
  // 切换流量
  async switchTraffic(targetColor) {
    console.log(`切换流量到${targetColor}环境`);
    
    await this.loadBalancer.switchTo(targetColor);
    
    // 等待流量完全切换
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // 验证切换成功
  async verifySwitchSuccess() {
    console.log('验证流量切换结果...');
    
    // 检查应用健康状态
    const healthCheck = await this.loadBalancer.healthCheck();
    
    if (!healthCheck.healthy) {
      throw new Error('健康检查失败');
    }
    
    console.log('流量切换验证成功');
  }
  
  // 回滚操作
  async rollback() {
    console.log('执行回滚操作...');
    
    try {
      await this.loadBalancer.switchTo(this.currentActive);
      console.log('回滚完成');
    } catch (error) {
      console.error('回滚失败:', error);
    }
  }
  
  // 获取当前活跃数据库
  getActiveDB() {
    return this.currentActive === 'blue' ? this.blueDB : this.greenDB;
  }
  
  // 获取迁移状态
  getStatus() {
    return {
      currentActive: this.currentActive,
      migrationStatus: this.migrationStatus,
      timestamp: Date.now()
    };
  }
}
```

### 2. 滚动升级迁移
```javascript
// 滚动升级迁移管理器
class RollingUpgradeMigration {
  constructor(nodeManager, options = {}) {
    this.nodeManager = nodeManager;
    this.options = {
      batchSize: options.batchSize || 1,
      waitTime: options.waitTime || 30000, // 30秒
      healthCheckInterval: options.healthCheckInterval || 5000,
      maxRetries: options.maxRetries || 3
    };
  }
  
  // 执行滚动升级
  async executeRollingUpgrade(migrationPlan) {
    const nodes = await this.nodeManager.getAllNodes();
    const batches = this.createBatches(nodes, this.options.batchSize);
    
    console.log(`开始滚动升级，共${batches.length}个批次`);
    
    const results = {
      totalNodes: nodes.length,
      upgradedNodes: 0,
      failedNodes: 0,
      errors: []
    };
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`处理第${i + 1}批次，包含${batch.length}个节点`);
      
      try {
        await this.upgradeBatch(batch, migrationPlan);
        results.upgradedNodes += batch.length;
        
        // 等待系统稳定
        if (i < batches.length - 1) {
          console.log(`等待${this.options.waitTime}ms后处理下一批次`);
          await new Promise(resolve => setTimeout(resolve, this.options.waitTime));
        }
        
      } catch (error) {
        console.error(`第${i + 1}批次升级失败:`, error);
        results.failedNodes += batch.length;
        results.errors.push({
          batch: i + 1,
          nodes: batch.map(n => n.id),
          error: error.message
        });
        
        // 决定是否继续
        if (this.shouldStopOnError(results)) {
          console.log('错误率过高，停止滚动升级');
          break;
        }
      }
    }
    
    return results;
  }
  
  // 升级单个批次
  async upgradeBatch(nodes, migrationPlan) {
    // 1. 从负载均衡器移除节点
    await this.removeNodesFromLoadBalancer(nodes);
    
    // 2. 等待现有连接完成
    await this.waitForConnectionsDrain(nodes);
    
    // 3. 停止节点服务
    await this.stopNodes(nodes);
    
    // 4. 执行数据库迁移
    await this.migrateNodes(nodes, migrationPlan);
    
    // 5. 启动节点服务
    await this.startNodes(nodes);
    
    // 6. 健康检查
    await this.healthCheckNodes(nodes);
    
    // 7. 重新加入负载均衡器
    await this.addNodesToLoadBalancer(nodes);
  }
  
  async removeNodesFromLoadBalancer(nodes) {
    for (const node of nodes) {
      await this.nodeManager.removeFromLoadBalancer(node.id);
    }
    console.log(`已从负载均衡器移除${nodes.length}个节点`);
  }
  
  async waitForConnectionsDrain(nodes) {
    console.log('等待连接排空...');
    
    const maxWaitTime = 60000; // 最大等待1分钟
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      let allDrained = true;
      
      for (const node of nodes) {
        const connectionCount = await this.nodeManager.getConnectionCount(node.id);
        if (connectionCount > 0) {
          allDrained = false;
          break;
        }
      }
      
      if (allDrained) {
        console.log('所有连接已排空');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.warn('连接排空超时，强制继续');
  }
  
  async stopNodes(nodes) {
    for (const node of nodes) {
      await this.nodeManager.stopNode(node.id);
    }
    console.log(`已停止${nodes.length}个节点`);
  }
  
  async migrateNodes(nodes, migrationPlan) {
    for (const node of nodes) {
      await this.migrateNode(node, migrationPlan);
    }
    console.log(`已迁移${nodes.length}个节点`);
  }
  
  async migrateNode(node, migrationPlan) {
    const db = await this.nodeManager.getNodeDatabase(node.id);
    
    // 执行迁移脚本
    for (const migration of migrationPlan.migrations) {
      try {
        await db.execute(migration.sql);
        console.log(`节点${node.id}: 执行迁移 ${migration.name}`);
      } catch (error) {
        console.error(`节点${node.id}: 迁移失败 ${migration.name}:`, error);
        throw error;
      }
    }
  }
  
  async startNodes(nodes) {
    for (const node of nodes) {
      await this.nodeManager.startNode(node.id);
    }
    console.log(`已启动${nodes.length}个节点`);
  }
  
  async healthCheckNodes(nodes) {
    console.log('执行健康检查...');
    
    const maxRetries = this.options.maxRetries;
    
    for (const node of nodes) {
      let retries = 0;
      let healthy = false;
      
      while (retries < maxRetries && !healthy) {
        try {
          healthy = await this.nodeManager.healthCheck(node.id);
          
          if (!healthy) {
            retries++;
            if (retries < maxRetries) {
              console.log(`节点${node.id}健康检查失败，重试${retries}/${maxRetries}`);
              await new Promise(resolve => setTimeout(resolve, this.options.healthCheckInterval));
            }
          }
        } catch (error) {
          retries++;
          console.error(`节点${node.id}健康检查错误:`, error);
        }
      }
      
      if (!healthy) {
        throw new Error(`节点${node.id}健康检查失败`);
      }
    }
    
    console.log('所有节点健康检查通过');
  }
  
  async addNodesToLoadBalancer(nodes) {
    for (const node of nodes) {
      await this.nodeManager.addToLoadBalancer(node.id);
    }
    console.log(`已将${nodes.length}个节点加入负载均衡器`);
  }
  
  createBatches(nodes, batchSize) {
    const batches = [];
    for (let i = 0; i < nodes.length; i += batchSize) {
      batches.push(nodes.slice(i, i + batchSize));
    }
    return batches;
  }
  
  shouldStopOnError(results) {
    const errorRate = results.failedNodes / results.totalNodes;
    return errorRate > 0.3; // 错误率超过30%则停止
  }
}
```

### 3. 金丝雀发布迁移
```javascript
// 金丝雀发布迁移管理器
class CanaryMigration {
  constructor(trafficManager, monitoringSystem) {
    this.trafficManager = trafficManager;
    this.monitoringSystem = monitoringSystem;
    this.canaryPercentages = [5, 10, 25, 50, 100]; // 逐步增加流量比例
  }
  
  // 执行金丝雀迁移
  async executeCanaryMigration(migrationPlan) {
    console.log('开始金丝雀迁移');
    
    try {
      // 1. 部署金丝雀版本
      await this.deployCanaryVersion(migrationPlan);
      
      // 2. 逐步增加流量
      for (const percentage of this.canaryPercentages) {
        console.log(`将${percentage}%流量导向金丝雀版本`);
        
        await this.adjustTrafficPercentage(percentage);
        
        // 监控指标
        const monitoringResult = await this.monitorCanaryMetrics(percentage);
        
        if (!monitoringResult.healthy) {
          console.error('金丝雀版本指标异常，执行回滚');
          await this.rollbackCanary();
          return {
            success: false,
            error: '金丝雀版本监控失败',
            failedAtPercentage: percentage,
            metrics: monitoringResult.metrics
          };
        }
        
        // 等待观察期
        await this.waitForObservationPeriod(percentage);
      }
      
      // 3. 完全切换到新版本
      await this.completeCanaryPromotion();
      
      console.log('金丝雀迁移完成');
      
      return {
        success: true,
        completedAt: new Date()
      };
      
    } catch (error) {
      console.error('金丝雀迁移失败:', error);
      await this.rollbackCanary();
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 部署金丝雀版本
  async deployCanaryVersion(migrationPlan) {
    console.log('部署金丝雀版本...');
    
    // 创建金丝雀环境
    const canaryEnvironment = await this.trafficManager.createCanaryEnvironment();
    
    // 执行数据库迁移
    await this.executeCanaryMigrations(canaryEnvironment, migrationPlan);
    
    // 部署应用代码
    await this.deployCanaryApplication(canaryEnvironment, migrationPlan);
    
    console.log('金丝雀版本部署完成');
  }
  
  async executeCanaryMigrations(environment, migrationPlan) {
    const canaryDB = environment.database;
    
    for (const migration of migrationPlan.migrations) {
      try {
        await canaryDB.execute(migration.sql);
        console.log(`金丝雀环境: 执行迁移 ${migration.name}`);
      } catch (error) {
        console.error(`金丝雀环境: 迁移失败 ${migration.name}:`, error);
        throw error;
      }
    }
  }
  
  async deployCanaryApplication(environment, migrationPlan) {
    // 部署新版本应用到金丝雀环境
    await environment.deployApplication(migrationPlan.applicationVersion);
    
    // 健康检查
    const healthy = await environment.healthCheck();
    if (!healthy) {
      throw new Error('金丝雀应用健康检查失败');
    }
  }
  
  // 调整流量比例
  async adjustTrafficPercentage(percentage) {
    await this.trafficManager.setCanaryTrafficPercentage(percentage);
    
    // 等待流量分配生效
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  // 监控金丝雀指标
  async monitorCanaryMetrics(percentage) {
    console.log(`监控${percentage}%流量下的金丝雀指标...`);
    
    const monitoringDuration = this.getMonitoringDuration(percentage);
    const startTime = Date.now();
    
    while (Date.now() - startTime < monitoringDuration) {
      const metrics = await this.collectMetrics();
      
      // 检查关键指标
      const healthCheck = this.evaluateMetrics(metrics);
      
      if (!healthCheck.healthy) {
        return {
          healthy: false,
          metrics: metrics,
          issues: healthCheck.issues
        };
      }
      
      // 等待下次检查
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30秒间隔
    }
    
    return {
      healthy: true,
      metrics: await this.collectMetrics()
    };
  }
  
  async collectMetrics() {
    const [canaryMetrics, productionMetrics] = await Promise.all([
      this.monitoringSystem.getCanaryMetrics(),
      this.monitoringSystem.getProductionMetrics()
    ]);
    
    return {
      canary: canaryMetrics,
      production: productionMetrics,
      timestamp: Date.now()
    };
  }
  
  evaluateMetrics(metrics) {
    const issues = [];
    
    // 错误率检查
    const canaryErrorRate = metrics.canary.errorRate;
    const productionErrorRate = metrics.production.errorRate;
    
    if (canaryErrorRate > productionErrorRate * 2) {
      issues.push(`金丝雀错误率过高: ${canaryErrorRate}% vs 生产环境 ${productionErrorRate}%`);
    }
    
    // 响应时间检查
    const canaryResponseTime = metrics.canary.avgResponseTime;
    const productionResponseTime = metrics.production.avgResponseTime;
    
    if (canaryResponseTime > productionResponseTime * 1.5) {
      issues.push(`金丝雀响应时间过长: ${canaryResponseTime}ms vs 生产环境 ${productionResponseTime}ms`);
    }
    
    // 吞吐量检查
    const canaryThroughput = metrics.canary.requestsPerSecond;
    const expectedThroughput = metrics.production.requestsPerSecond * 0.8; // 允许20%的差异
    
    if (canaryThroughput < expectedThroughput) {
      issues.push(`金丝雀吞吐量过低: ${canaryThroughput} req/s`);
    }
    
    return {
      healthy: issues.length === 0,
      issues: issues
    };
  }
  
  getMonitoringDuration(percentage) {
    // 根据流量比例调整监控时间
    const baseDuration = 300000; // 5分钟
    const multiplier = percentage <= 10 ? 2 : percentage <= 25 ? 1.5 : 1;
    return baseDuration * multiplier;
  }
  
  async waitForObservationPeriod(percentage) {
    const waitTime = this.getObservationPeriod(percentage);
    console.log(`观察期等待${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  getObservationPeriod(percentage) {
    // 低流量比例需要更长的观察期
    return percentage <= 10 ? 600000 : percentage <= 25 ? 300000 : 180000;
  }
  
  // 完成金丝雀推广
  async completeCanaryPromotion() {
    console.log('完成金丝雀推广...');
    
    // 将所有流量切换到金丝雀版本
    await this.trafficManager.promoteCanaryToProduction();
    
    // 清理旧版本
    await this.trafficManager.cleanupOldVersion();
    
    console.log('金丝雀推广完成');
  }
  
  // 回滚金丝雀
  async rollbackCanary() {
    console.log('执行金丝雀回滚...');
    
    try {
      // 将流量切回生产版本
      await this.trafficManager.setCanaryTrafficPercentage(0);
      
      // 清理金丝雀环境
      await this.trafficManager.cleanupCanaryEnvironment();
      
      console.log('金丝雀回滚完成');
    } catch (error) {
      console.error('金丝雀回滚失败:', error);
    }
  }
}
```

## 数据迁移工具

### 1. 数据导出导入工具
```javascript
// 数据迁移工具
class DataMigrationTool {
  constructor(sourceDB, targetDB, options = {}) {
    this.sourceDB = sourceDB;
    this.targetDB = targetDB;
    this.options = {
      batchSize: options.batchSize || 1000,
      parallel: options.parallel || 4,
      validateData: options.validateData !== false,
      skipTables: options.skipTables || [],
      onlyTables: options.onlyTables || null
    };
  }
  
  // 执行完整迁移
  async executeFullMigration() {
    console.log('开始完整数据迁移');
    const startTime = Date.now();
    
    try {
      // 1. 获取源数据库结构
      const schema = await this.exportSchema();
      
      // 2. 在目标数据库创建结构
      await this.importSchema(schema);
      
      // 3. 迁移数据
      const migrationResult = await this.migrateData();
      
      // 4. 验证数据
      if (this.options.validateData) {
        const validationResult = await this.validateMigration();
        if (!validationResult.success) {
          throw new Error('数据验证失败: ' + validationResult.errors.join(', '));
        }
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        duration: duration,
        tablesProcessed: migrationResult.tablesProcessed,
        totalRows: migrationResult.totalRows,
        errors: migrationResult.errors
      };
      
    } catch (error) {
      console.error('迁移失败:', error);
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  // 导出数据库结构
  async exportSchema() {
    console.log('导出数据库结构...');
    
    const schema = {
      tables: [],
      indexes: [],
      constraints: []
    };
    
    // 获取所有表
    const tables = await this.sourceDB.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    
    for (const table of tables) {
      // 获取表结构
      const tableSchema = await this.getTableSchema(table.table_name);
      schema.tables.push(tableSchema);
      
      // 获取表索引
      const indexes = await this.getTableIndexes(table.table_name);
      schema.indexes.push(...indexes);
      
      // 获取表约束
      const constraints = await this.getTableConstraints(table.table_name);
      schema.constraints.push(...constraints);
    }
    
    return schema;
  }
  
  async getTableSchema(tableName) {
    const [createTableResult] = await this.sourceDB.query(
      `SHOW CREATE TABLE ${tableName}`
    );
    
    return {
      name: tableName,
      createSQL: createTableResult['Create Table']
    };
  }
  
  async getTableIndexes(tableName) {
    const indexes = await this.sourceDB.query(
      `SHOW INDEX FROM ${tableName}`
    );
    
    const indexMap = new Map();
    
    indexes.forEach(index => {
      if (!indexMap.has(index.Key_name)) {
        indexMap.set(index.Key_name, {
          name: index.Key_name,
          table: tableName,
          unique: !index.Non_unique,
          columns: []
        });
      }
      
      indexMap.get(index.Key_name).columns.push({
        name: index.Column_name,
        order: index.Seq_in_index
      });
    });
    
    return Array.from(indexMap.values())
      .filter(index => index.name !== 'PRIMARY')
      .map(index => ({
        ...index,
        createSQL: this.generateIndexSQL(index)
      }));
  }
  
  generateIndexSQL(index) {
    const uniqueKeyword = index.unique ? 'UNIQUE ' : '';
    const columns = index.columns
      .sort((a, b) => a.order - b.order)
      .map(col => col.name)
      .join(', ');
    
    return `CREATE ${uniqueKeyword}INDEX ${index.name} ON ${index.table} (${columns})`;
  }
  
  async getTableConstraints(tableName) {
    // 获取外键约束
    const constraints = await this.sourceDB.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [tableName]);
    
    return constraints.map(constraint => ({
      name: constraint.CONSTRAINT_NAME,
      table: tableName,
      column: constraint.COLUMN_NAME,
      referencedTable: constraint.REFERENCED_TABLE_NAME,
      referencedColumn: constraint.REFERENCED_COLUMN_NAME,
      createSQL: `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraint.CONSTRAINT_NAME} FOREIGN KEY (${constraint.COLUMN_NAME}) REFERENCES ${constraint.REFERENCED_TABLE_NAME}(${constraint.REFERENCED_COLUMN_NAME})`
    }));
  }
  
  // 导入数据库结构
  async importSchema(schema) {
    console.log('导入数据库结构...');
    
    // 1. 创建表
    for (const table of schema.tables) {
      try {
        await this.targetDB.query(table.createSQL);
        console.log(`创建表: ${table.name}`);
      } catch (error) {
        console.error(`创建表失败 ${table.name}:`, error);
        throw error;
      }
    }
    
    // 2. 创建索引
    for (const index of schema.indexes) {
      try {
        await this.targetDB.query(index.createSQL);
        console.log(`创建索引: ${index.name}`);
      } catch (error) {
        console.warn(`创建索引失败 ${index.name}:`, error.message);
      }
    }
    
    // 3. 创建约束
    for (const constraint of schema.constraints) {
      try {
        await this.targetDB.query(constraint.createSQL);
        console.log(`创建约束: ${constraint.name}`);
      } catch (error) {
        console.warn(`创建约束失败 ${constraint.name}:`, error.message);
      }
    }
  }
  
  // 迁移数据
  async migrateData() {
    console.log('开始数据迁移...');
    
    const tables = await this.getTableList();
    const results = {
      tablesProcessed: 0,
      totalRows: 0,
      errors: []
    };
    
    // 并行处理多个表
    const chunks = this.chunkArray(tables, this.options.parallel);
    
    for (const chunk of chunks) {
      const promises = chunk.map(table => this.migrateTable(table));
      const chunkResults = await Promise.allSettled(promises);
      
      chunkResults.forEach((result, index) => {
        const tableName = chunk[index];
        
        if (result.status === 'fulfilled') {
          results.tablesProcessed++;
          results.totalRows += result.value.rowCount;
          console.log(`表${tableName}迁移完成: ${result.value.rowCount}行`);
        } else {
          results.errors.push({
            table: tableName,
            error: result.reason.message
          });
          console.error(`表${tableName}迁移失败:`, result.reason);
        }
      });
    }
    
    return results;
  }
  
  async getTableList() {
    const tables = await this.sourceDB.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
    `);
    
    let tableList = tables.map(t => t.table_name);
    
    // 过滤表
    if (this.options.onlyTables) {
      tableList = tableList.filter(table => this.options.onlyTables.includes(table));
    }
    
    if (this.options.skipTables.length > 0) {
      tableList = tableList.filter(table => !this.options.skipTables.includes(table));
    }
    
    return tableList;
  }
  
  async migrateTable(tableName) {
    let totalRows = 0;
    let offset = 0;
    
    while (true) {
      const rows = await this.sourceDB.query(
        `SELECT * FROM ${tableName} LIMIT ${this.options.batchSize} OFFSET ${offset}`
      );
      
      if (rows.length === 0) break;
      
      await this.insertBatch(tableName, rows);
      
      totalRows += rows.length;
      offset += this.options.batchSize;
      
      if (totalRows % 10000 === 0) {
        console.log(`${tableName}: 已迁移 ${totalRows} 行`);
      }
    }
    
    return { rowCount: totalRows };
  }
  
  async insertBatch(tableName, rows) {
    if (rows.length === 0) return;
    
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    const transaction = await this.targetDB.beginTransaction();
    
    try {
      for (const row of rows) {
        const values = columns.map(col => row[col]);
        await transaction.execute(sql, values);
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  // 验证迁移结果
  async validateMigration() {
    console.log('验证迁移结果...');
    
    const errors = [];
    const tables = await this.getTableList();
    
    for (const tableName of tables) {
      try {
        // 验证行数
        const [sourceCount] = await this.sourceDB.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const [targetCount] = await this.targetDB.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        
        if (sourceCount.count !== targetCount.count) {
          errors.push(`表${tableName}行数不匹配: 源${sourceCount.count}, 目标${targetCount.count}`);
        }
        
        // 可以添加更多验证逻辑，如数据完整性检查、校验和比较等
        
      } catch (error) {
        errors.push(`验证表${tableName}失败: ${error.message}`);
      }
    }
    
    return {
      success: errors.length === 0,
      errors: errors
    };
  }
  
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
```

## 总结

数据库迁移策略的选择要点：

1. **蓝绿部署**：零停机时间，但需要双倍资源
2. **滚动升级**：逐步迁移，风险可控，适用于集群环境
3. **金丝雀发布**：风险最小，可快速回滚，适用于关键系统
4. **数据迁移工具**：自动化处理数据和结构迁移
5. **监控验证**：全程监控迁移过程，确保数据完整性
6. **回滚机制**：制定完善的回滚策略和应急预案

选择合适的迁移策略需要考虑业务影响、技术复杂度、资源成本和风险承受能力。
