# 数据库版本控制

## 🎯 学习目标

- 掌握数据库版本控制的重要性
- 学会使用迁移工具管理数据库版本
- 理解数据库版本控制的最佳实践
- 掌握版本回滚和升级策略

## 📚 核心概念

### 什么是数据库版本控制

数据库版本控制是对数据库结构变更的系统化管理，确保数据库在不同环境中的一致性。

```javascript
// 版本控制基本概念
const databaseVersion = {
  current: '1.2.3',
  migrations: [
    '001_create_users_table.js',
    '002_add_email_index.js',
    '003_create_orders_table.js'
  ],
  status: 'up-to-date'
};
```

### 版本控制的重要性

1. **一致性保证**：确保不同环境数据库结构一致
2. **变更追踪**：记录所有数据库结构变更
3. **团队协作**：多人开发时避免冲突
4. **部署安全**：可控的数据库升级过程

## 🛠️ 实现方式

### 1. 使用Sequelize迁移

```javascript
// config/config.json
{
  "development": {
    "username": "root",
    "password": null,
    "database": "myapp_dev",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "root",
    "password": process.env.DB_PASSWORD,
    "database": "myapp_prod",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

```javascript
// migrations/001-create-user.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 添加索引
    await queryInterface.addIndex('Users', ['email']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
```

### 2. 使用Knex.js迁移

```javascript
// knexfile.js
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      database: 'myapp_dev',
      user: 'username',
      password: 'password'
    },
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations'
    }
  }
};
```

```javascript
// migrations/20231201120000_create_users_table.js
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('email').notNullable().unique();
    table.timestamps(true, true);
    
    // 添加索引
    table.index(['email']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
```

### 3. 使用TypeORM迁移

```typescript
// src/migrations/1640995200000-CreateUser.ts
import { MigrationInterface, QueryRunner, Table, Index } from "typeorm";

export class CreateUser1640995200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "user",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "firstName",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "lastName",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        // 创建索引
        await queryRunner.createIndex("user", new Index({
            name: "IDX_USER_EMAIL",
            columnNames: ["email"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex("user", "IDX_USER_EMAIL");
        await queryRunner.dropTable("user");
    }
}
```

### 4. 使用Prisma迁移

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  firstName String
  lastName  String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}
```

```bash
# 生成迁移文件
npx prisma migrate dev --name create_users_table

# 应用迁移
npx prisma migrate deploy
```

## 📋 版本管理策略

### 1. 命名约定

```javascript
// 时间戳 + 描述性名称
const migrationNaming = {
  pattern: 'YYYYMMDDHHMMSS_description',
  examples: [
    '20231201120000_create_users_table',
    '20231201130000_add_email_index',
    '20231201140000_add_user_roles'
  ]
};
```

### 2. 迁移脚本管理

```javascript
// scripts/migrate.js
const { exec } = require('child_process');
const path = require('path');

class MigrationManager {
  constructor(environment = 'development') {
    this.env = environment;
    this.migrationsPath = path.join(__dirname, '../migrations');
  }

  async runMigrations() {
    try {
      console.log(`Running migrations for ${this.env} environment...`);
      
      const command = `npx sequelize-cli db:migrate --env ${this.env}`;
      await this.executeCommand(command);
      
      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error.message);
      throw error;
    }
  }

  async rollbackMigration(steps = 1) {
    try {
      console.log(`Rolling back ${steps} migration(s)...`);
      
      const command = `npx sequelize-cli db:migrate:undo:all --to ${steps}`;
      await this.executeCommand(command);
      
      console.log('Rollback completed successfully');
    } catch (error) {
      console.error('Rollback failed:', error.message);
      throw error;
    }
  }

  async getMigrationStatus() {
    try {
      const command = `npx sequelize-cli db:migrate:status --env ${this.env}`;
      const result = await this.executeCommand(command);
      return this.parseMigrationStatus(result);
    } catch (error) {
      console.error('Failed to get migration status:', error.message);
      throw error;
    }
  }

  executeCommand(command) {
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

  parseMigrationStatus(output) {
    const lines = output.split('\n').filter(line => line.trim());
    const status = {
      pending: [],
      executed: []
    };

    lines.forEach(line => {
      if (line.includes('down')) {
        status.pending.push(line.trim());
      } else if (line.includes('up')) {
        status.executed.push(line.trim());
      }
    });

    return status;
  }
}

module.exports = MigrationManager;
```

### 3. 版本控制工作流

```javascript
// scripts/db-workflow.js
const MigrationManager = require('./migrate');

class DatabaseWorkflow {
  constructor() {
    this.migrationManager = new MigrationManager();
  }

  async deployToStaging() {
    console.log('🚀 Deploying to staging environment...');
    
    try {
      // 1. 备份当前数据库
      await this.backupDatabase('staging');
      
      // 2. 运行迁移
      this.migrationManager.env = 'staging';
      await this.migrationManager.runMigrations();
      
      // 3. 验证迁移结果
      await this.validateMigrations();
      
      console.log('✅ Staging deployment completed');
    } catch (error) {
      console.error('❌ Staging deployment failed:', error.message);
      await this.rollbackOnError();
    }
  }

  async deployToProduction() {
    console.log('🚀 Deploying to production environment...');
    
    try {
      // 1. 最终确认
      await this.confirmProductionDeployment();
      
      // 2. 创建生产备份
      await this.backupDatabase('production');
      
      // 3. 运行迁移
      this.migrationManager.env = 'production';
      await this.migrationManager.runMigrations();
      
      // 4. 验证生产环境
      await this.validateProduction();
      
      console.log('✅ Production deployment completed');
    } catch (error) {
      console.error('❌ Production deployment failed:', error.message);
      await this.emergencyRollback();
    }
  }

  async backupDatabase(environment) {
    console.log(`📦 Creating backup for ${environment}...`);
    // 实现数据库备份逻辑
  }

  async validateMigrations() {
    console.log('🔍 Validating migrations...');
    const status = await this.migrationManager.getMigrationStatus();
    
    if (status.pending.length > 0) {
      throw new Error(`Pending migrations found: ${status.pending.join(', ')}`);
    }
  }

  async rollbackOnError() {
    console.log('⏪ Rolling back due to error...');
    await this.migrationManager.rollbackMigration();
  }
}

module.exports = DatabaseWorkflow;
```

## 🔄 版本回滚策略

### 1. 自动回滚

```javascript
// utils/auto-rollback.js
class AutoRollback {
  constructor(migrationManager) {
    this.migrationManager = migrationManager;
    this.rollbackPoints = [];
  }

  async createRollbackPoint(name) {
    const status = await this.migrationManager.getMigrationStatus();
    const rollbackPoint = {
      name,
      timestamp: new Date().toISOString(),
      executedMigrations: [...status.executed],
      pendingMigrations: [...status.pending]
    };

    this.rollbackPoints.push(rollbackPoint);
    console.log(`📍 Rollback point created: ${name}`);
    
    return rollbackPoint;
  }

  async rollbackToPoint(pointName) {
    const rollbackPoint = this.rollbackPoints.find(point => point.name === pointName);
    
    if (!rollbackPoint) {
      throw new Error(`Rollback point not found: ${pointName}`);
    }

    console.log(`⏪ Rolling back to point: ${pointName}`);
    
    const currentStatus = await this.migrationManager.getMigrationStatus();
    const migrationsToRollback = currentStatus.executed.filter(
      migration => !rollbackPoint.executedMigrations.includes(migration)
    );

    for (const migration of migrationsToRollback.reverse()) {
      await this.migrationManager.rollbackMigration(1);
      console.log(`↩️  Rolled back: ${migration}`);
    }

    console.log(`✅ Successfully rolled back to: ${pointName}`);
  }

  async safeDeployment(deploymentFunction) {
    const rollbackPoint = await this.createRollbackPoint('pre-deployment');
    
    try {
      await deploymentFunction();
      console.log('✅ Deployment completed successfully');
    } catch (error) {
      console.error('❌ Deployment failed, initiating rollback...');
      await this.rollbackToPoint('pre-deployment');
      throw error;
    }
  }
}

module.exports = AutoRollback;
```

### 2. 手动回滚工具

```javascript
// cli/rollback-cli.js
const inquirer = require('inquirer');
const MigrationManager = require('../scripts/migrate');

class RollbackCLI {
  constructor() {
    this.migrationManager = new MigrationManager();
  }

  async start() {
    console.log('🔄 Database Rollback Tool');
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'View migration status',
          'Rollback specific number of migrations',
          'Rollback to specific migration',
          'Create rollback script',
          'Exit'
        ]
      }
    ]);

    switch (action) {
      case 'View migration status':
        await this.showMigrationStatus();
        break;
      case 'Rollback specific number of migrations':
        await this.rollbackBySteps();
        break;
      case 'Rollback to specific migration':
        await this.rollbackToMigration();
        break;
      case 'Create rollback script':
        await this.createRollbackScript();
        break;
      default:
        console.log('👋 Goodbye!');
        return;
    }

    await this.start(); // 继续显示菜单
  }

  async showMigrationStatus() {
    try {
      const status = await this.migrationManager.getMigrationStatus();
      
      console.log('\n📊 Migration Status:');
      console.log(`✅ Executed: ${status.executed.length}`);
      console.log(`⏳ Pending: ${status.pending.length}`);
      
      if (status.executed.length > 0) {
        console.log('\nExecuted migrations:');
        status.executed.forEach(migration => {
          console.log(`  ✓ ${migration}`);
        });
      }
      
      if (status.pending.length > 0) {
        console.log('\nPending migrations:');
        status.pending.forEach(migration => {
          console.log(`  ⏳ ${migration}`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to get migration status:', error.message);
    }
  }

  async rollbackBySteps() {
    const { steps } = await inquirer.prompt([
      {
        type: 'number',
        name: 'steps',
        message: 'How many migrations would you like to rollback?',
        default: 1,
        validate: (value) => value > 0 || 'Please enter a positive number'
      }
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to rollback ${steps} migration(s)?`,
        default: false
      }
    ]);

    if (confirm) {
      try {
        await this.migrationManager.rollbackMigration(steps);
        console.log(`✅ Successfully rolled back ${steps} migration(s)`);
      } catch (error) {
        console.error('❌ Rollback failed:', error.message);
      }
    }
  }
}

// 启动CLI
if (require.main === module) {
  const cli = new RollbackCLI();
  cli.start().catch(console.error);
}

module.exports = RollbackCLI;
```

## 🎯 最佳实践

### 1. 迁移文件规范

```javascript
// 良好的迁移文件示例
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. 创建表
      await queryInterface.createTable('users', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        }
      }, { transaction });

      // 2. 添加索引
      await queryInterface.addIndex('users', ['email'], {
        name: 'idx_users_email',
        transaction
      });

      // 3. 插入初始数据（如果需要）
      await queryInterface.bulkInsert('users', [
        {
          email: 'admin@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 按相反顺序回滚
      await queryInterface.removeIndex('users', 'idx_users_email', { transaction });
      await queryInterface.dropTable('users', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
```

### 2. 版本控制策略

```yaml
# .github/workflows/database-migration.yml
name: Database Migration

on:
  push:
    branches: [ main, develop ]
    paths: [ 'migrations/**' ]

jobs:
  migrate-staging:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run migrations on staging
        run: npm run migrate:staging
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

  migrate-production:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    needs: migrate-staging
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Manual approval
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ github.TOKEN }}
          approvers: admin-team
          
      - name: Backup production database
        run: npm run db:backup:production
        
      - name: Run migrations on production
        run: npm run migrate:production
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
```

## 🔍 监控和日志

### 版本控制监控

```javascript
// monitoring/migration-monitor.js
class MigrationMonitor {
  constructor() {
    this.metrics = {
      migrationsRun: 0,
      rollbacksPerformed: 0,
      failures: 0,
      avgMigrationTime: 0
    };
  }

  async trackMigration(migrationName, operation) {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting ${operation}: ${migrationName}`);
      
      const result = await operation();
      
      const duration = Date.now() - startTime;
      this.recordSuccess(migrationName, duration);
      
      console.log(`✅ Completed ${migrationName} in ${duration}ms`);
      return result;
      
    } catch (error) {
      this.recordFailure(migrationName, error);
      console.error(`❌ Failed ${migrationName}:`, error.message);
      throw error;
    }
  }

  recordSuccess(migrationName, duration) {
    this.metrics.migrationsRun++;
    this.updateAverageTime(duration);
    
    // 发送监控数据到监控系统
    this.sendMetrics({
      type: 'migration_success',
      migration: migrationName,
      duration
    });
  }

  recordFailure(migrationName, error) {
    this.metrics.failures++;
    
    // 发送告警
    this.sendAlert({
      type: 'migration_failure',
      migration: migrationName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  updateAverageTime(duration) {
    const total = this.metrics.avgMigrationTime * (this.metrics.migrationsRun - 1);
    this.metrics.avgMigrationTime = (total + duration) / this.metrics.migrationsRun;
  }

  sendMetrics(data) {
    // 发送到监控系统（如 Prometheus, DataDog 等）
    console.log('📊 Metrics:', data);
  }

  sendAlert(data) {
    // 发送告警（如 Slack, PagerDuty 等）
    console.log('🚨 Alert:', data);
  }

  getHealthStatus() {
    return {
      healthy: this.metrics.failures === 0,
      metrics: this.metrics,
      lastCheck: new Date().toISOString()
    };
  }
}

module.exports = MigrationMonitor;
```

数据库版本控制是确保数据库结构一致性和可维护性的关键技术，通过合适的工具和流程可以大大提高开发和部署的效率！
