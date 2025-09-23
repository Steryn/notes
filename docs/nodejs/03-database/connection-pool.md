# 数据库连接池

## 🎯 学习目标

- 理解数据库连接池的重要性和工作原理
- 掌握不同数据库连接池的配置和使用
- 学会连接池性能优化和监控
- 了解连接池的最佳实践和故障处理

## 📚 核心概念

### 连接池简介

```javascript
// 连接池的核心概念
const connectionPoolConcepts = {
  purpose: {
    description: '连接池的作用',
    benefits: [
      '减少连接创建/销毁开销',
      '控制并发连接数量',
      '提高应用性能',
      '优化资源利用'
    ]
  },
  components: {
    description: '连接池组件',
    parts: [
      '连接管理器',
      '连接队列',
      '健康检查',
      '监控统计'
    ]
  },
  lifecycle: {
    description: '连接生命周期',
    stages: [
      '连接创建',
      '连接获取',
      '连接使用',
      '连接释放',
      '连接销毁'
    ]
  }
};

console.log('连接池概念:', connectionPoolConcepts);
```

### 连接池工作原理

```javascript
// 连接池工作流程模拟
class ConnectionPoolSimulator {
  constructor(options = {}) {
    this.minConnections = options.minConnections || 5;
    this.maxConnections = options.maxConnections || 20;
    this.acquireTimeoutMillis = options.acquireTimeoutMillis || 30000;
    this.idleTimeoutMillis = options.idleTimeoutMillis || 300000; // 5分钟
    
    this.connections = new Set();
    this.availableConnections = [];
    this.busyConnections = new Set();
    this.waitingQueue = [];
    this.stats = {
      created: 0,
      destroyed: 0,
      acquired: 0,
      released: 0,
      timeouts: 0
    };
  }

  // 模拟连接创建
  async createConnection() {
    const connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      usageCount: 0,
      isValid: true
    };

    // 模拟连接创建延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.connections.add(connection);
    this.availableConnections.push(connection);
    this.stats.created++;
    
    console.log(`🔗 创建连接: ${connection.id}`);
    return connection;
  }

  // 获取连接
  async acquireConnection() {
    return new Promise(async (resolve, reject) => {
      // 检查是否有可用连接
      if (this.availableConnections.length > 0) {
        const connection = this.availableConnections.shift();
        this.busyConnections.add(connection);
        connection.lastUsedAt = Date.now();
        connection.usageCount++;
        this.stats.acquired++;
        
        console.log(`📤 获取连接: ${connection.id}`);
        resolve(connection);
        return;
      }

      // 如果没有可用连接且未达到最大连接数，创建新连接
      if (this.connections.size < this.maxConnections) {
        try {
          const connection = await this.createConnection();
          this.availableConnections.pop(); // 移除刚添加的
          this.busyConnections.add(connection);
          connection.lastUsedAt = Date.now();
          connection.usageCount++;
          this.stats.acquired++;
          
          console.log(`📤 获取新连接: ${connection.id}`);
          resolve(connection);
          return;
        } catch (error) {
          reject(error);
          return;
        }
      }

      // 连接池已满，加入等待队列
      const waitingRequest = {
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      this.waitingQueue.push(waitingRequest);
      console.log(`⏳ 连接请求加入等待队列，当前队列长度: ${this.waitingQueue.length}`);

      // 设置超时
      setTimeout(() => {
        const index = this.waitingQueue.indexOf(waitingRequest);
        if (index > -1) {
          this.waitingQueue.splice(index, 1);
          this.stats.timeouts++;
          reject(new Error('连接获取超时'));
        }
      }, this.acquireTimeoutMillis);
    });
  }

  // 释放连接
  releaseConnection(connection) {
    if (!this.busyConnections.has(connection)) {
      console.warn(`⚠️ 尝试释放未在使用的连接: ${connection.id}`);
      return;
    }

    this.busyConnections.delete(connection);
    connection.lastUsedAt = Date.now();
    this.stats.released++;

    // 检查连接是否仍然有效
    if (connection.isValid) {
      // 检查是否有等待的请求
      if (this.waitingQueue.length > 0) {
        const waitingRequest = this.waitingQueue.shift();
        this.busyConnections.add(connection);
        connection.usageCount++;
        this.stats.acquired++;
        
        console.log(`📤 连接直接分配给等待请求: ${connection.id}`);
        waitingRequest.resolve(connection);
      } else {
        this.availableConnections.push(connection);
        console.log(`📥 释放连接: ${connection.id}`);
      }
    } else {
      this.destroyConnection(connection);
    }
  }

  // 销毁连接
  destroyConnection(connection) {
    this.connections.delete(connection);
    this.availableConnections = this.availableConnections.filter(c => c !== connection);
    this.busyConnections.delete(connection);
    this.stats.destroyed++;
    
    console.log(`💥 销毁连接: ${connection.id}`);
  }

  // 健康检查
  async healthCheck() {
    console.log('🔍 执行连接池健康检查...');
    
    const now = Date.now();
    const connectionsToDestroy = [];

    // 检查空闲超时的连接
    for (const connection of this.availableConnections) {
      if (now - connection.lastUsedAt > this.idleTimeoutMillis) {
        connectionsToDestroy.push(connection);
      }
    }

    // 销毁超时连接
    for (const connection of connectionsToDestroy) {
      this.destroyConnection(connection);
    }

    // 确保最小连接数
    while (this.connections.size < this.minConnections) {
      await this.createConnection();
    }

    console.log(`✅ 健康检查完成，销毁 ${connectionsToDestroy.length} 个超时连接`);
  }

  // 获取连接池状态
  getStatus() {
    return {
      total: this.connections.size,
      available: this.availableConnections.length,
      busy: this.busyConnections.size,
      waiting: this.waitingQueue.length,
      config: {
        min: this.minConnections,
        max: this.maxConnections,
        acquireTimeout: this.acquireTimeoutMillis,
        idleTimeout: this.idleTimeoutMillis
      },
      stats: { ...this.stats }
    };
  }
}

// 使用示例
async function demonstrateConnectionPool() {
  console.log('🏊 连接池工作原理演示...\n');

  const pool = new ConnectionPoolSimulator({
    minConnections: 3,
    maxConnections: 8,
    acquireTimeoutMillis: 5000,
    idleTimeoutMillis: 10000
  });

  // 初始化最小连接数
  for (let i = 0; i < 3; i++) {
    await pool.createConnection();
  }

  console.log('初始状态:', pool.getStatus());

  // 模拟并发连接请求
  const tasks = [];
  for (let i = 0; i < 10; i++) {
    tasks.push(
      pool.acquireConnection().then(async (connection) => {
        console.log(`🔧 使用连接 ${connection.id} 执行任务 ${i + 1}`);
        
        // 模拟任务执行时间
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
        
        pool.releaseConnection(connection);
        console.log(`✅ 任务 ${i + 1} 完成`);
      }).catch(error => {
        console.error(`❌ 任务 ${i + 1} 失败:`, error.message);
      })
    );
  }

  await Promise.all(tasks);
  
  console.log('所有任务完成后状态:', pool.getStatus());

  // 执行健康检查
  await pool.healthCheck();
  
  console.log('健康检查后状态:', pool.getStatus());
}

// demonstrateConnectionPool();
```

## 🔧 MySQL连接池实现

### 使用mysql2连接池

```javascript
// mysql-connection-pool.js
const mysql = require('mysql2/promise');

class MySQLConnectionPool {
  constructor(config) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.user || 'root',
      password: config.password || '',
      database: config.database,
      
      // 连接池配置
      connectionLimit: config.connectionLimit || 10,
      queueLimit: config.queueLimit || 0,
      acquireTimeout: config.acquireTimeout || 60000,
      timeout: config.timeout || 60000,
      
      // 重连配置
      reconnect: config.reconnect !== false,
      idleTimeout: config.idleTimeout || 600000, // 10分钟
      
      // 其他配置
      charset: config.charset || 'utf8mb4',
      timezone: config.timezone || '+00:00',
      
      // SSL配置
      ssl: config.ssl || false
    };

    this.pool = null;
    this.isInitialized = false;
    this.stats = {
      connections: {
        created: 0,
        destroyed: 0,
        acquired: 0,
        released: 0
      },
      queries: {
        total: 0,
        successful: 0,
        failed: 0
      },
      performance: {
        totalQueryTime: 0,
        avgQueryTime: 0
      }
    };
  }

  // 初始化连接池
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🚀 初始化MySQL连接池...');
      
      this.pool = mysql.createPool(this.config);
      
      // 监听连接事件
      this.pool.on('connection', (connection) => {
        this.stats.connections.created++;
        console.log(`🔗 新连接创建: ${connection.threadId}`);
      });

      this.pool.on('acquire', (connection) => {
        this.stats.connections.acquired++;
        console.log(`📤 连接获取: ${connection.threadId}`);
      });

      this.pool.on('release', (connection) => {
        this.stats.connections.released++;
        console.log(`📥 连接释放: ${connection.threadId}`);
      });

      this.pool.on('error', (error) => {
        console.error('❌ 连接池错误:', error);
      });

      // 测试连接
      await this.testConnection();
      
      this.isInitialized = true;
      console.log('✅ MySQL连接池初始化成功');

    } catch (error) {
      console.error('❌ MySQL连接池初始化失败:', error);
      throw error;
    }
  }

  // 测试连接
  async testConnection() {
    const connection = await this.pool.getConnection();
    try {
      await connection.ping();
      console.log('🏓 数据库连接测试成功');
    } finally {
      connection.release();
    }
  }

  // 执行查询
  async query(sql, params = []) {
    if (!this.isInitialized) {
      throw new Error('连接池未初始化');
    }

    const startTime = Date.now();
    
    try {
      this.stats.queries.total++;
      
      const [rows, fields] = await this.pool.execute(sql, params);
      
      const queryTime = Date.now() - startTime;
      this.stats.performance.totalQueryTime += queryTime;
      this.stats.performance.avgQueryTime = 
        this.stats.performance.totalQueryTime / this.stats.queries.total;
      this.stats.queries.successful++;
      
      console.log(`✅ 查询执行成功，耗时: ${queryTime}ms`);
      return { rows, fields };

    } catch (error) {
      this.stats.queries.failed++;
      console.error('❌ 查询执行失败:', error.message);
      throw error;
    }
  }

  // 执行事务
  async transaction(callback) {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const result = await callback(connection);
      
      await connection.commit();
      console.log('✅ 事务提交成功');
      
      return result;

    } catch (error) {
      await connection.rollback();
      console.error('❌ 事务回滚:', error.message);
      throw error;

    } finally {
      connection.release();
    }
  }

  // 批量插入
  async batchInsert(tableName, data, batchSize = 1000) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('数据必须是非空数组');
    }

    const fields = Object.keys(data[0]);
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;

    let totalInserted = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      await this.transaction(async (connection) => {
        for (const row of batch) {
          const values = fields.map(field => row[field]);
          await connection.execute(sql, values);
          totalInserted++;
        }
      });
      
      console.log(`📦 批量插入进度: ${totalInserted}/${data.length}`);
    }

    console.log(`✅ 批量插入完成，总计: ${totalInserted} 条记录`);
    return totalInserted;
  }

  // 获取连接池状态
  async getPoolStatus() {
    if (!this.pool) {
      return { status: 'not_initialized' };
    }

    // 执行状态查询
    const statusQuery = `
      SELECT 
        VARIABLE_NAME,
        VARIABLE_VALUE
      FROM 
        INFORMATION_SCHEMA.SESSION_STATUS 
      WHERE 
        VARIABLE_NAME IN (
          'Threads_connected',
          'Threads_running',
          'Max_used_connections',
          'Aborted_connects'
        )
    `;

    try {
      const { rows } = await this.query(statusQuery);
      
      const status = {};
      rows.forEach(row => {
        status[row.VARIABLE_NAME.toLowerCase()] = parseInt(row.VARIABLE_VALUE);
      });

      return {
        config: {
          connectionLimit: this.config.connectionLimit,
          queueLimit: this.config.queueLimit,
          acquireTimeout: this.config.acquireTimeout
        },
        mysql_status: status,
        pool_stats: this.stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('获取连接池状态失败:', error);
      return {
        error: error.message,
        pool_stats: this.stats
      };
    }
  }

  // 监控连接池健康状态
  startHealthMonitoring(intervalMs = 30000) {
    console.log(`🔍 启动连接池健康监控 (间隔: ${intervalMs}ms)`);
    
    this.healthMonitorInterval = setInterval(async () => {
      try {
        const status = await this.getPoolStatus();
        
        console.log('📊 连接池健康状态:');
        console.log(`  查询统计: 总计=${status.pool_stats.queries.total}, 成功=${status.pool_stats.queries.successful}, 失败=${status.pool_stats.queries.failed}`);
        console.log(`  平均查询时间: ${status.pool_stats.performance.avgQueryTime.toFixed(2)}ms`);
        
        if (status.mysql_status) {
          console.log(`  MySQL连接: 当前=${status.mysql_status.threads_connected}, 运行中=${status.mysql_status.threads_running}`);
        }

        // 检查异常情况
        const failureRate = status.pool_stats.queries.failed / status.pool_stats.queries.total;
        if (failureRate > 0.1) { // 失败率超过10%
          console.warn('⚠️ 查询失败率过高:', (failureRate * 100).toFixed(2) + '%');
        }

        if (status.pool_stats.performance.avgQueryTime > 1000) { // 平均查询时间超过1秒
          console.warn('⚠️ 平均查询时间过长:', status.pool_stats.performance.avgQueryTime.toFixed(2) + 'ms');
        }

      } catch (error) {
        console.error('❌ 健康监控检查失败:', error.message);
      }
    }, intervalMs);
  }

  // 停止健康监控
  stopHealthMonitoring() {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
      this.healthMonitorInterval = null;
      console.log('⏹️ 连接池健康监控已停止');
    }
  }

  // 关闭连接池
  async close() {
    if (this.pool) {
      this.stopHealthMonitoring();
      
      console.log('🔄 正在关闭连接池...');
      await this.pool.end();
      
      this.pool = null;
      this.isInitialized = false;
      
      console.log('✅ 连接池已关闭');
    }
  }
}

// 使用示例
async function demonstrateMySQLPool() {
  console.log('🔧 MySQL连接池演示...\n');

  const pool = new MySQLConnectionPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'test_db',
    connectionLimit: 5,
    acquireTimeout: 10000
  });

  try {
    // 初始化连接池
    await pool.initialize();
    
    // 启动健康监控
    pool.startHealthMonitoring(10000);

    // 执行一些查询
    console.log('执行基础查询...');
    
    // 创建测试表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 插入测试数据
    const testUsers = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Charlie', email: 'charlie@example.com' }
    ];

    for (const user of testUsers) {
      await pool.query(
        'INSERT INTO test_users (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
        [user.name, user.email]
      );
    }

    // 查询数据
    const { rows } = await pool.query('SELECT * FROM test_users ORDER BY id');
    console.log('查询结果:', rows);

    // 执行事务示例
    console.log('\n执行事务示例...');
    await pool.transaction(async (connection) => {
      await connection.execute(
        'INSERT INTO test_users (name, email) VALUES (?, ?)',
        ['David', 'david@example.com']
      );
      
      await connection.execute(
        'UPDATE test_users SET name = ? WHERE email = ?',
        ['David Updated', 'david@example.com']
      );
    });

    // 显示连接池状态
    console.log('\n连接池状态:');
    const status = await pool.getPoolStatus();
    console.log(JSON.stringify(status, null, 2));

    // 等待一段时间观察监控
    console.log('\n等待监控数据...');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error);
  } finally {
    await pool.close();
  }
}

module.exports = MySQLConnectionPool;
```

## 🐘 PostgreSQL连接池实现

### 使用pg连接池

```javascript
// postgresql-connection-pool.js
const { Pool, Client } = require('pg');

class PostgreSQLConnectionPool {
  constructor(config) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 5432,
      user: config.user || 'postgres',
      password: config.password || '',
      database: config.database,
      
      // 连接池配置
      max: config.max || 20, // 最大连接数
      min: config.min || 5,  // 最小连接数
      idle: config.idle || 1000, // 空闲连接超时时间
      acquire: config.acquire || 30000, // 获取连接超时时间
      evict: config.evict || 1000, // 检查空闲连接的间隔
      
      // 连接配置
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
      idleTimeoutMillis: config.idleTimeoutMillis || 300000, // 5分钟
      
      // SSL配置
      ssl: config.ssl || false,
      
      // 其他配置
      application_name: config.application_name || 'nodejs_app'
    };

    this.pool = null;
    this.isInitialized = false;
    this.stats = {
      connections: {
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0
      },
      queries: {
        total: 0,
        successful: 0,
        failed: 0,
        totalTime: 0
      }
    };
  }

  // 初始化连接池
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🚀 初始化PostgreSQL连接池...');
      
      this.pool = new Pool(this.config);
      
      // 监听连接事件
      this.pool.on('connect', (client) => {
        console.log('🔗 新连接建立');
        this.updateConnectionStats();
      });

      this.pool.on('acquire', (client) => {
        console.log('📤 连接获取');
        this.updateConnectionStats();
      });

      this.pool.on('remove', (client) => {
        console.log('🗑️ 连接移除');
        this.updateConnectionStats();
      });

      this.pool.on('error', (error, client) => {
        console.error('❌ 连接池错误:', error);
      });

      // 测试连接
      await this.testConnection();
      
      this.isInitialized = true;
      console.log('✅ PostgreSQL连接池初始化成功');

    } catch (error) {
      console.error('❌ PostgreSQL连接池初始化失败:', error);
      throw error;
    }
  }

  // 更新连接统计
  updateConnectionStats() {
    if (this.pool) {
      this.stats.connections.total = this.pool.totalCount;
      this.stats.connections.active = this.pool.totalCount - this.pool.idleCount;
      this.stats.connections.idle = this.pool.idleCount;
      this.stats.connections.waiting = this.pool.waitingCount;
    }
  }

  // 测试连接
  async testConnection() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time');
      console.log('🏓 数据库连接测试成功:', result.rows[0].current_time);
    } finally {
      client.release();
    }
  }

  // 执行查询
  async query(text, params = []) {
    if (!this.isInitialized) {
      throw new Error('连接池未初始化');
    }

    const startTime = Date.now();
    
    try {
      this.stats.queries.total++;
      
      const result = await this.pool.query(text, params);
      
      const queryTime = Date.now() - startTime;
      this.stats.queries.totalTime += queryTime;
      this.stats.queries.successful++;
      
      console.log(`✅ 查询执行成功，耗时: ${queryTime}ms，返回 ${result.rows.length} 行`);
      return result;

    } catch (error) {
      this.stats.queries.failed++;
      console.error('❌ 查询执行失败:', error.message);
      throw error;
    }
  }

  // 执行事务
  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      console.log('✅ 事务提交成功');
      
      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 事务回滚:', error.message);
      throw error;

    } finally {
      client.release();
    }
  }

  // 流式查询
  async streamQuery(text, params = [], options = {}) {
    const client = await this.pool.connect();
    
    try {
      const query = client.query(text, params);
      const results = [];
      
      // 设置行处理器
      query.on('row', (row) => {
        if (options.onRow) {
          options.onRow(row);
        } else {
          results.push(row);
        }
      });

      query.on('error', (error) => {
        console.error('❌ 流式查询错误:', error);
        throw error;
      });

      await new Promise((resolve, reject) => {
        query.on('end', resolve);
        query.on('error', reject);
      });

      console.log('✅ 流式查询完成');
      return results;

    } finally {
      client.release();
    }
  }

  // 批量操作
  async batchOperation(operations, batchSize = 100) {
    let completed = 0;
    const results = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      await this.transaction(async (client) => {
        for (const operation of batch) {
          const result = await client.query(operation.text, operation.params);
          results.push(result);
          completed++;
        }
      });
      
      console.log(`📦 批量操作进度: ${completed}/${operations.length}`);
    }

    console.log(`✅ 批量操作完成，总计: ${completed} 个操作`);
    return results;
  }

  // 获取连接池状态
  async getPoolStatus() {
    this.updateConnectionStats();
    
    // 获取数据库统计信息
    let dbStats = {};
    try {
      const result = await this.query(`
        SELECT 
          numbackends as active_connections,
          xact_commit as transactions_committed,
          xact_rollback as transactions_rolled_back,
          blks_read as blocks_read,
          blks_hit as blocks_hit,
          tup_returned as tuples_returned,
          tup_fetched as tuples_fetched,
          tup_inserted as tuples_inserted,
          tup_updated as tuples_updated,
          tup_deleted as tuples_deleted
        FROM pg_stat_database 
        WHERE datname = $1
      `, [this.config.database]);
      
      if (result.rows.length > 0) {
        dbStats = result.rows[0];
      }
    } catch (error) {
      console.warn('获取数据库统计信息失败:', error.message);
    }

    return {
      pool: {
        total: this.stats.connections.total,
        active: this.stats.connections.active,
        idle: this.stats.connections.idle,
        waiting: this.stats.connections.waiting,
        config: {
          max: this.config.max,
          min: this.config.min,
          idleTimeoutMillis: this.config.idleTimeoutMillis
        }
      },
      queries: {
        ...this.stats.queries,
        avgTime: this.stats.queries.total > 0 ? 
          (this.stats.queries.totalTime / this.stats.queries.total).toFixed(2) : 0
      },
      database: dbStats,
      timestamp: new Date().toISOString()
    };
  }

  // 连接池健康检查
  async healthCheck() {
    try {
      console.log('🔍 执行连接池健康检查...');
      
      const status = await this.getPoolStatus();
      const issues = [];
      
      // 检查连接池利用率
      if (status.pool.active / status.pool.total > 0.8) {
        issues.push('连接池使用率过高 (>80%)');
      }
      
      // 检查等待队列
      if (status.pool.waiting > 0) {
        issues.push(`有 ${status.pool.waiting} 个请求在等待连接`);
      }
      
      // 检查查询失败率
      const failureRate = status.queries.failed / status.queries.total;
      if (failureRate > 0.05) { // 5%
        issues.push(`查询失败率过高: ${(failureRate * 100).toFixed(2)}%`);
      }
      
      // 检查平均查询时间
      if (parseFloat(status.queries.avgTime) > 1000) {
        issues.push(`平均查询时间过长: ${status.queries.avgTime}ms`);
      }

      if (issues.length > 0) {
        console.warn('⚠️ 健康检查发现问题:');
        issues.forEach(issue => console.warn(`  - ${issue}`));
      } else {
        console.log('✅ 连接池健康状态良好');
      }

      return {
        healthy: issues.length === 0,
        issues,
        status
      };

    } catch (error) {
      console.error('❌ 健康检查失败:', error);
      return {
        healthy: false,
        issues: ['健康检查执行失败'],
        error: error.message
      };
    }
  }

  // 启动监控
  startMonitoring(intervalMs = 30000) {
    console.log(`🔍 启动连接池监控 (间隔: ${intervalMs}ms)`);
    
    this.monitorInterval = setInterval(async () => {
      const healthResult = await this.healthCheck();
      
      if (!healthResult.healthy) {
        console.warn('⚠️ 连接池状态异常，建议检查');
      }
      
      console.log('📊 连接池状态摘要:');
      console.log(`  连接: ${healthResult.status.pool.active}/${healthResult.status.pool.total} (等待: ${healthResult.status.pool.waiting})`);
      console.log(`  查询: 成功=${healthResult.status.queries.successful}, 失败=${healthResult.status.queries.failed}, 平均时间=${healthResult.status.queries.avgTime}ms`);
      
    }, intervalMs);
  }

  // 停止监控
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log('⏹️ 连接池监控已停止');
    }
  }

  // 关闭连接池
  async close() {
    if (this.pool) {
      this.stopMonitoring();
      
      console.log('🔄 正在关闭连接池...');
      await this.pool.end();
      
      this.pool = null;
      this.isInitialized = false;
      
      console.log('✅ 连接池已关闭');
    }
  }
}

module.exports = PostgreSQLConnectionPool;
```

## 🎯 最佳实践

### 连接池优化策略

```javascript
// connection-pool-optimizer.js
class ConnectionPoolOptimizer {
  constructor() {
    this.recommendations = [];
    this.metrics = new Map();
  }

  // 分析连接池配置
  analyzeConfiguration(config, workloadPattern) {
    console.log('🔍 分析连接池配置...');
    
    const recommendations = [];
    
    // 基于工作负载模式的建议
    switch (workloadPattern.type) {
      case 'high_concurrency':
        if (config.max < 50) {
          recommendations.push({
            type: 'configuration',
            priority: 'high',
            message: '高并发场景建议增加最大连接数到50+',
            suggestion: { max: Math.max(50, config.max * 2) }
          });
        }
        break;
        
      case 'batch_processing':
        if (config.min > 5) {
          recommendations.push({
            type: 'configuration',
            priority: 'medium',
            message: '批处理场景可以减少最小连接数以节省资源',
            suggestion: { min: Math.min(5, config.min) }
          });
        }
        break;
        
      case 'low_latency':
        if (config.acquireTimeout > 5000) {
          recommendations.push({
            type: 'configuration',
            priority: 'high',
            message: '低延迟场景建议减少连接获取超时时间',
            suggestion: { acquireTimeout: 5000 }
          });
        }
        break;
    }
    
    // 通用配置检查
    if (config.max / config.min > 10) {
      recommendations.push({
        type: 'configuration',
        priority: 'medium',
        message: '最大最小连接数比例过大，可能导致连接数波动',
        suggestion: { min: Math.ceil(config.max / 5) }
      });
    }
    
    return recommendations;
  }

  // 性能基准测试
  async performanceBenchmark(pool, testCases) {
    console.log('🏃 执行性能基准测试...');
    
    const results = [];
    
    for (const testCase of testCases) {
      console.log(`测试案例: ${testCase.name}`);
      
      const startTime = Date.now();
      const promises = [];
      
      // 并发执行测试
      for (let i = 0; i < testCase.concurrency; i++) {
        promises.push(this.executeTestQuery(pool, testCase.query));
      }
      
      try {
        await Promise.all(promises);
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        const result = {
          name: testCase.name,
          concurrency: testCase.concurrency,
          totalTime,
          avgTime: totalTime / testCase.concurrency,
          throughput: (testCase.concurrency / totalTime * 1000).toFixed(2)
        };
        
        results.push(result);
        console.log(`  结果: 总时间=${totalTime}ms, 平均=${result.avgTime.toFixed(2)}ms, 吞吐量=${result.throughput} ops/sec`);
        
      } catch (error) {
        console.error(`  测试失败: ${error.message}`);
        results.push({
          name: testCase.name,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async executeTestQuery(pool, query) {
    const startTime = Date.now();
    
    try {
      await pool.query(query.sql, query.params);
      return Date.now() - startTime;
    } catch (error) {
      throw error;
    }
  }

  // 连接泄漏检测
  detectConnectionLeaks(poolStats, timeWindow = 300000) { // 5分钟
    console.log('🔍 检测连接泄漏...');
    
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    // 获取时间窗口内的统计数据
    const recentStats = Array.from(this.metrics.entries())
      .filter(([timestamp]) => timestamp >= windowStart)
      .map(([timestamp, stats]) => ({ timestamp, ...stats }));
    
    if (recentStats.length < 2) {
      return { detected: false, message: '数据不足，无法检测' };
    }
    
    // 分析连接数趋势
    const connectionTrends = recentStats.map(stat => stat.connections?.active || 0);
    const avgConnections = connectionTrends.reduce((a, b) => a + b, 0) / connectionTrends.length;
    const maxConnections = Math.max(...connectionTrends);
    const minConnections = Math.min(...connectionTrends);
    
    // 检测异常模式
    const issues = [];
    
    // 连接数持续增长
    if (maxConnections > avgConnections * 1.5) {
      issues.push('连接数出现异常峰值');
    }
    
    // 连接数不释放
    const recentConnections = connectionTrends.slice(-5);
    const isIncreasing = recentConnections.every((val, i) => 
      i === 0 || val >= recentConnections[i - 1]
    );
    
    if (isIncreasing && recentConnections.length >= 5) {
      issues.push('连接数持续增长，可能存在连接泄漏');
    }
    
    // 空闲连接过多
    const idleConnections = recentStats[recentStats.length - 1].connections?.idle || 0;
    const activeConnections = recentStats[recentStats.length - 1].connections?.active || 0;
    
    if (idleConnections > activeConnections * 2) {
      issues.push('空闲连接数过多，建议调整连接池配置');
    }
    
    return {
      detected: issues.length > 0,
      issues,
      stats: {
        avgConnections: avgConnections.toFixed(2),
        maxConnections,
        minConnections,
        currentActive: activeConnections,
        currentIdle: idleConnections
      }
    };
  }

  // 记录指标
  recordMetrics(stats) {
    const timestamp = Date.now();
    this.metrics.set(timestamp, stats);
    
    // 保持最近1小时的数据
    const oneHourAgo = timestamp - 3600000;
    for (const [time] of this.metrics) {
      if (time < oneHourAgo) {
        this.metrics.delete(time);
      } else {
        break;
      }
    }
  }

  // 生成优化报告
  generateOptimizationReport(poolStats, workloadPattern) {
    const report = {
      timestamp: new Date().toISOString(),
      poolStatus: poolStats,
      workloadPattern,
      recommendations: [],
      metrics: {
        connectionUtilization: poolStats.pool.active / poolStats.pool.total,
        queryPerformance: poolStats.queries.avgTime,
        errorRate: poolStats.queries.failed / poolStats.queries.total
      }
    };
    
    // 连接利用率分析
    if (report.metrics.connectionUtilization > 0.9) {
      report.recommendations.push({
        category: 'capacity',
        priority: 'high',
        message: '连接利用率过高，建议增加最大连接数',
        action: 'increase_max_connections'
      });
    } else if (report.metrics.connectionUtilization < 0.3) {
      report.recommendations.push({
        category: 'efficiency',
        priority: 'medium',
        message: '连接利用率较低，可以减少连接数以节省资源',
        action: 'decrease_connections'
      });
    }
    
    // 查询性能分析
    if (report.metrics.queryPerformance > 1000) {
      report.recommendations.push({
        category: 'performance',
        priority: 'high',
        message: '平均查询时间过长，检查查询优化和索引',
        action: 'optimize_queries'
      });
    }
    
    // 错误率分析
    if (report.metrics.errorRate > 0.05) {
      report.recommendations.push({
        category: 'reliability',
        priority: 'high',
        message: '查询错误率过高，检查数据库连接和查询逻辑',
        action: 'investigate_errors'
      });
    }
    
    return report;
  }
}

// 使用示例
async function demonstrateOptimization() {
  console.log('🎯 连接池优化演示...\n');
  
  const optimizer = new ConnectionPoolOptimizer();
  
  // 模拟不同工作负载模式的配置分析
  const workloadPatterns = [
    {
      type: 'high_concurrency',
      description: '高并发Web应用',
      characteristics: {
        peakConcurrency: 200,
        avgQueryTime: 50,
        readWriteRatio: '80:20'
      }
    },
    {
      type: 'batch_processing',
      description: '批处理任务',
      characteristics: {
        batchSize: 1000,
        avgQueryTime: 200,
        readWriteRatio: '20:80'
      }
    },
    {
      type: 'low_latency',
      description: '低延迟实时系统',
      characteristics: {
        maxLatency: 10,
        avgQueryTime: 5,
        readWriteRatio: '90:10'
      }
    }
  ];
  
  const baseConfig = {
    min: 5,
    max: 20,
    acquireTimeout: 30000,
    idleTimeout: 300000
  };
  
  for (const pattern of workloadPatterns) {
    console.log(`分析工作负载: ${pattern.description}`);
    
    const recommendations = optimizer.analyzeConfiguration(baseConfig, pattern);
    
    if (recommendations.length > 0) {
      console.log('  优化建议:');
      recommendations.forEach(rec => {
        console.log(`    - [${rec.priority.toUpperCase()}] ${rec.message}`);
        if (rec.suggestion) {
          console.log(`      建议配置: ${JSON.stringify(rec.suggestion)}`);
        }
      });
    } else {
      console.log('  ✅ 当前配置适合此工作负载');
    }
    
    console.log('');
  }
  
  // 模拟连接泄漏检测
  console.log('模拟连接泄漏检测...');
  
  // 记录一些模拟指标
  const baseTime = Date.now() - 300000; // 5分钟前
  for (let i = 0; i < 10; i++) {
    optimizer.recordMetrics({
      connections: {
        active: 5 + i * 2, // 模拟连接数增长
        idle: 3,
        total: 20
      },
      queries: {
        total: 100 + i * 50,
        successful: 95 + i * 48,
        failed: 5 + i * 2
      }
    });
  }
  
  const leakDetection = optimizer.detectConnectionLeaks();
  console.log('连接泄漏检测结果:', leakDetection);
  
  console.log('\n✅ 连接池优化演示完成');
}

module.exports = { ConnectionPoolOptimizer, demonstrateOptimization };
```

数据库连接池是高性能Node.js应用的基础设施，合理的配置和监控能显著提升应用性能和稳定性！
