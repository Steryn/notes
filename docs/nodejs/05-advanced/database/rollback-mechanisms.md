# 数据库回滚机制

## 🎯 学习目标

- 掌握数据库回滚机制的原理
- 学会设计安全的回滚策略
- 理解不同场景下的回滚方案
- 掌握自动化回滚工具的实现

## 📚 核心概念

### 什么是数据库回滚

数据库回滚是将数据库状态恢复到之前某个特定时间点的过程，用于处理错误、失败的部署或数据损坏等情况。

```javascript
// 回滚机制基本概念
const rollbackConcepts = {
  types: [
    'transaction_rollback',    // 事务回滚
    'migration_rollback',      // 迁移回滚
    'point_in_time_recovery', // 时间点恢复
    'snapshot_restore'        // 快照恢复
  ],
  triggers: [
    'deployment_failure',     // 部署失败
    'data_corruption',        // 数据损坏
    'performance_issues',     // 性能问题
    'business_requirements'   // 业务需求
  ]
};
```

### 回滚的重要性

1. **风险控制**：快速恢复系统正常状态
2. **数据保护**：防止数据丢失或损坏
3. **业务连续性**：最小化系统停机时间
4. **开发效率**：支持快速迭代和试验

## 🛠️ 回滚策略设计

### 1. 事务级回滚

```javascript
// transaction-rollback.js
const { Sequelize, DataTypes } = require('sequelize');

class TransactionRollback {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }

  async safeOperation(operations) {
    const transaction = await this.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    });

    try {
      console.log('🚀 Starting transaction...');
      
      // 执行所有操作
      const results = [];
      for (const operation of operations) {
        const result = await operation(transaction);
        results.push(result);
        
        console.log(`✅ Operation completed: ${operation.name}`);
      }

      // 提交事务
      await transaction.commit();
      console.log('✅ Transaction committed successfully');
      
      return results;
      
    } catch (error) {
      console.error('❌ Transaction failed, rolling back...', error.message);
      
      try {
        await transaction.rollback();
        console.log('↩️  Transaction rolled back successfully');
      } catch (rollbackError) {
        console.error('💥 Rollback failed:', rollbackError.message);
        throw rollbackError;
      }
      
      throw error;
    }
  }

  async batchUpdate(tableName, updates) {
    return this.safeOperation([
      async (transaction) => {
        // 备份原始数据
        const originalData = await this.sequelize.query(
          `SELECT * FROM ${tableName} WHERE id IN (:ids)`,
          {
            replacements: { ids: updates.map(u => u.id) },
            type: Sequelize.QueryTypes.SELECT,
            transaction
          }
        );

        // 执行更新
        for (const update of updates) {
          await this.sequelize.query(
            `UPDATE ${tableName} SET ${Object.keys(update.data).map(key => `${key} = :${key}`).join(', ')} WHERE id = :id`,
            {
              replacements: { ...update.data, id: update.id },
              transaction
            }
          );
        }

        return { originalData, updatedCount: updates.length };
      }
    ]);
  }
}

// 使用示例
const rollbackManager = new TransactionRollback(sequelize);

async function updateUserProfiles() {
  try {
    const updates = [
      { id: 1, data: { email: 'new1@example.com', status: 'active' } },
      { id: 2, data: { email: 'new2@example.com', status: 'inactive' } }
    ];

    const result = await rollbackManager.batchUpdate('users', updates);
    console.log('Batch update completed:', result);
    
  } catch (error) {
    console.error('Batch update failed:', error.message);
  }
}
```

### 2. 迁移回滚

```javascript
// migration-rollback.js
const fs = require('fs').promises;
const path = require('path');

class MigrationRollback {
  constructor(migrationPath, sequelize) {
    this.migrationPath = migrationPath;
    this.sequelize = sequelize;
    this.rollbackHistory = [];
  }

  async getMigrationFiles() {
    const files = await fs.readdir(this.migrationPath);
    return files
      .filter(file => file.endsWith('.js'))
      .sort()
      .reverse(); // 按时间倒序
  }

  async rollbackMigration(steps = 1) {
    console.log(`🔄 Rolling back ${steps} migration(s)...`);
    
    const migrationFiles = await this.getMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();
    
    // 找到需要回滚的迁移
    const migrationsToRollback = executedMigrations
      .slice(0, steps)
      .reverse();

    for (const migration of migrationsToRollback) {
      await this.rollbackSingleMigration(migration);
    }

    console.log(`✅ Successfully rolled back ${steps} migration(s)`);
  }

  async rollbackSingleMigration(migrationName) {
    const transaction = await this.sequelize.transaction();
    
    try {
      console.log(`↩️  Rolling back: ${migrationName}`);
      
      // 加载迁移文件
      const migrationFile = path.join(this.migrationPath, migrationName);
      const migration = require(migrationFile);
      
      // 创建回滚点
      const rollbackPoint = await this.createRollbackPoint(migrationName);
      
      // 执行down方法
      if (migration.down) {
        await migration.down(this.sequelize.getQueryInterface(), this.sequelize.constructor, { transaction });
      } else {
        throw new Error(`No down method found for migration: ${migrationName}`);
      }

      // 更新迁移状态
      await this.updateMigrationStatus(migrationName, 'down', transaction);
      
      await transaction.commit();
      
      this.rollbackHistory.push({
        migration: migrationName,
        rolledBackAt: new Date().toISOString(),
        rollbackPoint
      });
      
      console.log(`✅ Successfully rolled back: ${migrationName}`);
      
    } catch (error) {
      await transaction.rollback();
      console.error(`❌ Failed to rollback ${migrationName}:`, error.message);
      throw error;
    }
  }

  async createRollbackPoint(migrationName) {
    // 创建数据库快照或备份点
    const rollbackPoint = {
      id: `rollback_${Date.now()}`,
      migration: migrationName,
      timestamp: new Date().toISOString(),
      databaseState: await this.captureDatabaseState()
    };

    // 保存回滚点信息
    await this.saveRollbackPoint(rollbackPoint);
    
    return rollbackPoint;
  }

  async captureDatabaseState() {
    // 捕获当前数据库状态
    const [tables] = await this.sequelize.query("SHOW TABLES");
    const state = {};

    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [structure] = await this.sequelize.query(`DESCRIBE ${tableName}`);
      const [rowCount] = await this.sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      
      state[tableName] = {
        structure,
        rowCount: rowCount[0].count
      };
    }

    return state;
  }

  async rollbackToPoint(rollbackPointId) {
    const rollbackPoint = await this.getRollbackPoint(rollbackPointId);
    
    if (!rollbackPoint) {
      throw new Error(`Rollback point not found: ${rollbackPointId}`);
    }

    console.log(`🔄 Rolling back to point: ${rollbackPointId}`);
    
    // 找到需要回滚的所有迁移
    const currentMigrations = await this.getExecutedMigrations();
    const targetIndex = this.rollbackHistory.findIndex(
      h => h.rollbackPoint.id === rollbackPointId
    );

    if (targetIndex === -1) {
      throw new Error(`Cannot determine rollback path to: ${rollbackPointId}`);
    }

    // 执行回滚
    const migrationsToRollback = currentMigrations.slice(0, targetIndex + 1);
    for (const migration of migrationsToRollback.reverse()) {
      await this.rollbackSingleMigration(migration);
    }

    console.log(`✅ Successfully rolled back to point: ${rollbackPointId}`);
  }

  async getExecutedMigrations() {
    try {
      const [results] = await this.sequelize.query(
        "SELECT name FROM SequelizeMeta ORDER BY name DESC"
      );
      return results.map(r => r.name);
    } catch (error) {
      console.warn('Migration table not found, assuming no migrations executed');
      return [];
    }
  }

  async updateMigrationStatus(migrationName, status, transaction) {
    if (status === 'down') {
      await this.sequelize.query(
        "DELETE FROM SequelizeMeta WHERE name = :name",
        {
          replacements: { name: migrationName },
          transaction
        }
      );
    }
  }

  async saveRollbackPoint(rollbackPoint) {
    const filePath = path.join(this.migrationPath, '../rollback-points', `${rollbackPoint.id}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(rollbackPoint, null, 2));
  }

  async getRollbackPoint(rollbackPointId) {
    try {
      const filePath = path.join(this.migrationPath, '../rollback-points', `${rollbackPointId}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  getRollbackHistory() {
    return this.rollbackHistory;
  }
}

module.exports = MigrationRollback;
```

### 3. 数据备份与恢复

```javascript
// backup-restore.js
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class BackupRestore {
  constructor(config) {
    this.config = config;
    this.backupPath = config.backupPath || './backups';
  }

  async createBackup(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${name}_${timestamp}`;
    const backupFile = path.join(this.backupPath, `${backupName}.sql`);

    await fs.mkdir(this.backupPath, { recursive: true });

    console.log(`📦 Creating backup: ${backupName}`);

    try {
      // MySQL备份
      if (this.config.dialect === 'mysql') {
        await this.createMySQLBackup(backupFile);
      }
      // PostgreSQL备份
      else if (this.config.dialect === 'postgres') {
        await this.createPostgreSQLBackup(backupFile);
      }

      // 创建备份元数据
      const metadata = {
        name: backupName,
        file: backupFile,
        createdAt: new Date().toISOString(),
        database: this.config.database,
        size: (await fs.stat(backupFile)).size,
        checksum: await this.calculateChecksum(backupFile)
      };

      await this.saveBackupMetadata(backupName, metadata);
      
      console.log(`✅ Backup created: ${backupFile}`);
      return metadata;

    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      throw error;
    }
  }

  async createMySQLBackup(backupFile) {
    const command = `mysqldump -h ${this.config.host} -u ${this.config.username} -p${this.config.password} ${this.config.database} > ${backupFile}`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async createPostgreSQLBackup(backupFile) {
    const command = `pg_dump -h ${this.config.host} -U ${this.config.username} -d ${this.config.database} -f ${backupFile}`;
    
    return new Promise((resolve, reject) => {
      const child = exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });

      // 设置密码环境变量
      child.env.PGPASSWORD = this.config.password;
    });
  }

  async restoreBackup(backupName) {
    console.log(`🔄 Restoring backup: ${backupName}`);

    try {
      const metadata = await this.getBackupMetadata(backupName);
      if (!metadata) {
        throw new Error(`Backup metadata not found: ${backupName}`);
      }

      // 验证备份文件
      await this.verifyBackup(metadata);

      // 创建恢复前备份
      const preRestoreBackup = await this.createBackup('pre-restore');
      
      // 执行恢复
      if (this.config.dialect === 'mysql') {
        await this.restoreMySQLBackup(metadata.file);
      } else if (this.config.dialect === 'postgres') {
        await this.restorePostgreSQLBackup(metadata.file);
      }

      console.log(`✅ Backup restored successfully: ${backupName}`);
      
      return {
        restored: metadata,
        preRestoreBackup
      };

    } catch (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      throw error;
    }
  }

  async restoreMySQLBackup(backupFile) {
    const command = `mysql -h ${this.config.host} -u ${this.config.username} -p${this.config.password} ${this.config.database} < ${backupFile}`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async restorePostgreSQLBackup(backupFile) {
    // 先删除现有数据库（可选）
    // const dropCommand = `dropdb -h ${this.config.host} -U ${this.config.username} ${this.config.database}`;
    // const createCommand = `createdb -h ${this.config.host} -U ${this.config.username} ${this.config.database}`;
    
    const restoreCommand = `psql -h ${this.config.host} -U ${this.config.username} -d ${this.config.database} -f ${backupFile}`;
    
    return new Promise((resolve, reject) => {
      const child = exec(restoreCommand, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });

      child.env.PGPASSWORD = this.config.password;
    });
  }

  async verifyBackup(metadata) {
    // 检查文件是否存在
    try {
      await fs.access(metadata.file);
    } catch (error) {
      throw new Error(`Backup file not found: ${metadata.file}`);
    }

    // 验证文件完整性
    const currentChecksum = await this.calculateChecksum(metadata.file);
    if (currentChecksum !== metadata.checksum) {
      throw new Error(`Backup file corrupted: checksum mismatch`);
    }

    console.log(`✅ Backup verified: ${metadata.name}`);
  }

  async calculateChecksum(filePath) {
    const crypto = require('crypto');
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  async saveBackupMetadata(backupName, metadata) {
    const metadataFile = path.join(this.backupPath, `${backupName}.metadata.json`);
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
  }

  async getBackupMetadata(backupName) {
    try {
      const metadataFile = path.join(this.backupPath, `${backupName}.metadata.json`);
      const content = await fs.readFile(metadataFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupPath);
      const metadataFiles = files.filter(file => file.endsWith('.metadata.json'));
      
      const backups = [];
      for (const file of metadataFiles) {
        const content = await fs.readFile(path.join(this.backupPath, file), 'utf-8');
        backups.push(JSON.parse(content));
      }

      return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Failed to list backups:', error.message);
      return [];
    }
  }

  async cleanupOldBackups(retentionDays = 30) {
    const backups = await this.listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const backupsToDelete = backups.filter(backup => 
      new Date(backup.createdAt) < cutoffDate
    );

    console.log(`🧹 Cleaning up ${backupsToDelete.length} old backups...`);

    for (const backup of backupsToDelete) {
      try {
        await fs.unlink(backup.file);
        await fs.unlink(backup.file.replace('.sql', '.metadata.json'));
        console.log(`🗑️  Deleted: ${backup.name}`);
      } catch (error) {
        console.error(`Failed to delete backup ${backup.name}:`, error.message);
      }
    }

    console.log(`✅ Cleanup completed`);
  }
}

module.exports = BackupRestore;
```

## 🚀 自动化回滚系统

### 智能回滚决策

```javascript
// intelligent-rollback.js
class IntelligentRollback {
  constructor(config) {
    this.config = config;
    this.healthChecks = [];
    this.rollbackTriggers = [];
    this.rollbackStrategies = new Map();
  }

  addHealthCheck(name, checkFunction, weight = 1) {
    this.healthChecks.push({
      name,
      check: checkFunction,
      weight,
      enabled: true
    });
  }

  addRollbackTrigger(name, condition, strategy) {
    this.rollbackTriggers.push({
      name,
      condition,
      strategy,
      enabled: true
    });
  }

  async evaluateSystemHealth() {
    console.log('🔍 Evaluating system health...');
    
    const results = [];
    let totalScore = 0;
    let maxScore = 0;

    for (const healthCheck of this.healthChecks) {
      if (!healthCheck.enabled) continue;

      try {
        const result = await healthCheck.check();
        const score = result.healthy ? healthCheck.weight : 0;
        
        results.push({
          name: healthCheck.name,
          healthy: result.healthy,
          score,
          weight: healthCheck.weight,
          details: result.details || {}
        });

        totalScore += score;
        maxScore += healthCheck.weight;

      } catch (error) {
        results.push({
          name: healthCheck.name,
          healthy: false,
          score: 0,
          weight: healthCheck.weight,
          error: error.message
        });
        
        maxScore += healthCheck.weight;
      }
    }

    const healthPercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    return {
      healthy: healthPercentage >= this.config.healthThreshold,
      percentage: healthPercentage,
      details: results,
      timestamp: new Date().toISOString()
    };
  }

  async shouldTriggerRollback(context = {}) {
    const healthStatus = await this.evaluateSystemHealth();
    
    // 检查健康状态触发器
    if (!healthStatus.healthy) {
      return {
        shouldRollback: true,
        reason: 'System health below threshold',
        strategy: 'immediate',
        healthStatus
      };
    }

    // 检查自定义触发器
    for (const trigger of this.rollbackTriggers) {
      if (!trigger.enabled) continue;

      try {
        const shouldTrigger = await trigger.condition(context, healthStatus);
        
        if (shouldTrigger) {
          return {
            shouldRollback: true,
            reason: `Trigger activated: ${trigger.name}`,
            strategy: trigger.strategy,
            healthStatus
          };
        }
      } catch (error) {
        console.error(`Trigger evaluation failed: ${trigger.name}`, error.message);
      }
    }

    return {
      shouldRollback: false,
      healthStatus
    };
  }

  async executeRollback(strategy, context = {}) {
    console.log(`🔄 Executing rollback strategy: ${strategy}`);
    
    const rollbackFunction = this.rollbackStrategies.get(strategy);
    if (!rollbackFunction) {
      throw new Error(`Unknown rollback strategy: ${strategy}`);
    }

    const startTime = Date.now();
    
    try {
      // 创建回滚前快照
      const preRollbackSnapshot = await this.createSnapshot('pre-rollback');
      
      // 执行回滚
      const result = await rollbackFunction(context);
      
      const duration = Date.now() - startTime;
      
      // 验证回滚结果
      const postRollbackHealth = await this.evaluateSystemHealth();
      
      const rollbackResult = {
        success: true,
        strategy,
        duration,
        preRollbackSnapshot,
        result,
        postRollbackHealth,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Rollback completed successfully in ${duration}ms`);
      
      // 记录回滚历史
      await this.recordRollback(rollbackResult);
      
      return rollbackResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`❌ Rollback failed after ${duration}ms:`, error.message);
      
      const rollbackResult = {
        success: false,
        strategy,
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      await this.recordRollback(rollbackResult);
      throw error;
    }
  }

  registerRollbackStrategy(name, rollbackFunction) {
    this.rollbackStrategies.set(name, rollbackFunction);
    console.log(`📝 Registered rollback strategy: ${name}`);
  }

  async createSnapshot(name) {
    // 创建系统快照
    return {
      id: `snapshot_${Date.now()}`,
      name,
      timestamp: new Date().toISOString(),
      databaseState: await this.captureDatabaseState(),
      applicationState: await this.captureApplicationState()
    };
  }

  async captureDatabaseState() {
    // 实现数据库状态捕获
    return {
      migrations: await this.getExecutedMigrations(),
      tableCount: await this.getTableCount(),
      recordCounts: await this.getRecordCounts()
    };
  }

  async captureApplicationState() {
    // 实现应用状态捕获
    return {
      version: process.env.APP_VERSION,
      environment: process.env.NODE_ENV,
      uptime: process.uptime()
    };
  }

  async recordRollback(rollbackResult) {
    // 记录回滚历史到数据库或文件
    console.log('📝 Recording rollback:', rollbackResult);
  }

  // 预定义健康检查
  getDatabaseHealthCheck() {
    return async () => {
      try {
        // 检查数据库连接
        await this.sequelize.authenticate();
        
        // 检查关键表
        const criticalTables = ['users', 'orders', 'products'];
        for (const table of criticalTables) {
          await this.sequelize.query(`SELECT 1 FROM ${table} LIMIT 1`);
        }

        return {
          healthy: true,
          details: {
            connection: 'ok',
            tables: 'accessible'
          }
        };
      } catch (error) {
        return {
          healthy: false,
          details: {
            error: error.message
          }
        };
      }
    };
  }

  getPerformanceHealthCheck() {
    return async () => {
      try {
        const startTime = Date.now();
        
        // 执行性能测试查询
        await this.sequelize.query('SELECT COUNT(*) FROM users');
        
        const queryTime = Date.now() - startTime;
        const healthy = queryTime < this.config.maxQueryTime;

        return {
          healthy,
          details: {
            queryTime,
            threshold: this.config.maxQueryTime
          }
        };
      } catch (error) {
        return {
          healthy: false,
          details: {
            error: error.message
          }
        };
      }
    };
  }
}

// 使用示例
const intelligentRollback = new IntelligentRollback({
  healthThreshold: 80,
  maxQueryTime: 1000
});

// 注册健康检查
intelligentRollback.addHealthCheck(
  'database',
  intelligentRollback.getDatabaseHealthCheck(),
  3
);

intelligentRollback.addHealthCheck(
  'performance',
  intelligentRollback.getPerformanceHealthCheck(),
  2
);

// 注册回滚策略
intelligentRollback.registerRollbackStrategy('immediate', async (context) => {
  // 立即回滚到上一个版本
  const migrationRollback = new MigrationRollback('./migrations', sequelize);
  return await migrationRollback.rollbackMigration(1);
});

intelligentRollback.registerRollbackStrategy('gradual', async (context) => {
  // 逐步回滚
  const migrationRollback = new MigrationRollback('./migrations', sequelize);
  return await migrationRollback.rollbackMigration(3);
});

module.exports = IntelligentRollback;
```

## 🎯 最佳实践

### 1. 回滚测试

```javascript
// rollback-testing.js
class RollbackTesting {
  constructor(testEnvironment) {
    this.testEnvironment = testEnvironment;
    this.testResults = [];
  }

  async runRollbackTests() {
    console.log('🧪 Running rollback tests...');
    
    const tests = [
      this.testMigrationRollback,
      this.testDataIntegrityAfterRollback,
      this.testPerformanceAfterRollback,
      this.testApplicationFunctionalityAfterRollback
    ];

    for (const test of tests) {
      try {
        const result = await test.call(this);
        this.testResults.push(result);
        console.log(`✅ Test passed: ${result.name}`);
      } catch (error) {
        this.testResults.push({
          name: test.name,
          success: false,
          error: error.message
        });
        console.error(`❌ Test failed: ${test.name}`, error.message);
      }
    }

    return this.generateTestReport();
  }

  async testMigrationRollback() {
    // 测试迁移回滚功能
    const migrationRollback = new MigrationRollback('./migrations', this.testEnvironment.sequelize);
    
    // 执行一个迁移
    await this.testEnvironment.runMigration('test_migration');
    
    // 回滚迁移
    await migrationRollback.rollbackMigration(1);
    
    // 验证回滚结果
    const migrations = await migrationRollback.getExecutedMigrations();
    const migrationExists = migrations.includes('test_migration');
    
    if (migrationExists) {
      throw new Error('Migration was not properly rolled back');
    }

    return {
      name: 'Migration Rollback',
      success: true,
      details: 'Migration successfully rolled back'
    };
  }

  async testDataIntegrityAfterRollback() {
    // 测试回滚后数据完整性
    const backupRestore = new BackupRestore(this.testEnvironment.config);
    
    // 创建测试数据
    await this.createTestData();
    
    // 创建备份
    const backup = await backupRestore.createBackup('integrity-test');
    
    // 修改数据
    await this.modifyTestData();
    
    // 恢复备份
    await backupRestore.restoreBackup(backup.name);
    
    // 验证数据完整性
    const dataIntact = await this.verifyTestData();
    
    if (!dataIntact) {
      throw new Error('Data integrity compromised after rollback');
    }

    return {
      name: 'Data Integrity',
      success: true,
      details: 'Data integrity maintained after rollback'
    };
  }

  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: (passedTests / totalTests) * 100
      },
      details: this.testResults,
      timestamp: new Date().toISOString()
    };
  }
}
```

### 2. 监控和告警

```javascript
// rollback-monitoring.js
class RollbackMonitoring {
  constructor(alertingService) {
    this.alertingService = alertingService;
    this.metrics = {
      rollbacksExecuted: 0,
      rollbacksSuccessful: 0,
      rollbacksFailed: 0,
      averageRollbackTime: 0,
      lastRollback: null
    };
  }

  async monitorRollback(rollbackFunction, context) {
    const rollbackId = `rollback_${Date.now()}`;
    const startTime = Date.now();

    try {
      console.log(`📊 Monitoring rollback: ${rollbackId}`);
      
      // 发送开始告警
      await this.sendAlert('rollback_started', {
        rollbackId,
        context,
        timestamp: new Date().toISOString()
      });

      // 执行回滚
      const result = await rollbackFunction();
      
      const duration = Date.now() - startTime;
      
      // 更新指标
      this.updateMetrics(true, duration);
      
      // 发送成功告警
      await this.sendAlert('rollback_success', {
        rollbackId,
        duration,
        result,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 更新指标
      this.updateMetrics(false, duration);
      
      // 发送失败告警
      await this.sendAlert('rollback_failure', {
        rollbackId,
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  updateMetrics(success, duration) {
    this.metrics.rollbacksExecuted++;
    
    if (success) {
      this.metrics.rollbacksSuccessful++;
    } else {
      this.metrics.rollbacksFailed++;
    }

    // 更新平均时间
    const totalTime = this.metrics.averageRollbackTime * (this.metrics.rollbacksExecuted - 1);
    this.metrics.averageRollbackTime = (totalTime + duration) / this.metrics.rollbacksExecuted;
    
    this.metrics.lastRollback = new Date().toISOString();
  }

  async sendAlert(type, data) {
    const alertConfig = this.getAlertConfig(type);
    
    if (alertConfig.enabled) {
      await this.alertingService.send({
        type,
        severity: alertConfig.severity,
        title: alertConfig.title,
        message: this.formatAlertMessage(type, data),
        data
      });
    }
  }

  getAlertConfig(type) {
    const configs = {
      rollback_started: {
        enabled: true,
        severity: 'warning',
        title: 'Database Rollback Started'
      },
      rollback_success: {
        enabled: true,
        severity: 'info',
        title: 'Database Rollback Completed Successfully'
      },
      rollback_failure: {
        enabled: true,
        severity: 'critical',
        title: 'Database Rollback Failed'
      }
    };

    return configs[type] || { enabled: false };
  }

  formatAlertMessage(type, data) {
    switch (type) {
      case 'rollback_started':
        return `Database rollback ${data.rollbackId} has been initiated.`;
      
      case 'rollback_success':
        return `Database rollback ${data.rollbackId} completed successfully in ${data.duration}ms.`;
      
      case 'rollback_failure':
        return `Database rollback ${data.rollbackId} failed after ${data.duration}ms: ${data.error}`;
      
      default:
        return `Database rollback event: ${type}`;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.rollbacksExecuted > 0 
        ? (this.metrics.rollbacksSuccessful / this.metrics.rollbacksExecuted) * 100 
        : 0
    };
  }
}

module.exports = RollbackMonitoring;
```

数据库回滚机制是确保系统稳定性和数据安全的重要保障，通过合理的设计和自动化工具可以大大降低系统风险！
