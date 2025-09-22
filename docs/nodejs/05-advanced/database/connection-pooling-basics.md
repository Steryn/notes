# 连接池基础

## 概述

数据库连接池是一种资源池技术，用于管理和复用数据库连接。它预先创建一定数量的连接并维护在池中，应用程序需要时从池中获取连接，使用完毕后归还给池，避免频繁创建和销毁连接的开销。

## 连接池的必要性

### 1. 性能问题
```javascript
// ❌ 每次请求都创建新连接（性能差）
async function getUserWithoutPool(userId) {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydb'
  });
  
  const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
  await connection.end(); // 每次都要关闭连接
  
  return rows[0];
}

// ✅ 使用连接池（性能好）
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydb',
  connectionLimit: 10
});

async function getUserWithPool(userId) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
  return rows[0]; // 连接自动归还给池
}
```

### 2. 资源管理
```javascript
// 连接创建开销统计
const connectionStats = {
  createTime: 0,
  totalConnections: 0,
  activeConnections: 0,
  
  // 记录连接创建时间
  recordConnectionCreate(startTime) {
    const endTime = Date.now();
    this.createTime += (endTime - startTime);
    this.totalConnections++;
  },
  
  // 获取平均连接创建时间
  getAverageCreateTime() {
    return this.totalConnections > 0 ? this.createTime / this.totalConnections : 0;
  }
};

console.log('平均连接创建时间:', connectionStats.getAverageCreateTime(), 'ms');
```

## 连接池工作原理

### 1. 连接池生命周期
```javascript
// 连接池生命周期管理
class ConnectionPool {
  constructor(config) {
    this.config = config;
    this.connections = [];
    this.activeConnections = new Set();
    this.waitingQueue = [];
    this.isInitialized = false;
  }
  
  // 初始化连接池
  async initialize() {
    console.log('初始化连接池...');
    
    // 创建最小连接数
    for (let i = 0; i < this.config.minConnections; i++) {
      const connection = await this.createConnection();
      this.connections.push(connection);
    }
    
    this.isInitialized = true;
    console.log(`连接池初始化完成，创建了 ${this.connections.length} 个连接`);
  }
  
  // 创建新连接
  async createConnection() {
    const connection = await mysql.createConnection(this.config.database);
    
    // 监听连接事件
    connection.on('error', (err) => {
      console.error('数据库连接错误:', err);
      this.handleConnectionError(connection);
    });
    
    connection.on('end', () => {
      console.log('数据库连接已关闭');
      this.removeConnection(connection);
    });
    
    return connection;
  }
  
  // 获取连接
  async getConnection() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // 如果有空闲连接，直接返回
    if (this.connections.length > 0) {
      const connection = this.connections.pop();
      this.activeConnections.add(connection);
      return connection;
    }
    
    // 如果未达到最大连接数，创建新连接
    if (this.activeConnections.size < this.config.maxConnections) {
      const connection = await this.createConnection();
      this.activeConnections.add(connection);
      return connection;
    }
    
    // 否则等待连接释放
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('获取连接超时'));
      }, this.config.acquireTimeout || 60000);
      
      this.waitingQueue.push({ resolve, reject, timeout });
    });
  }
  
  // 释放连接
  releaseConnection(connection) {
    this.activeConnections.delete(connection);
    
    // 如果有等待的请求，直接分配给它
    if (this.waitingQueue.length > 0) {
      const { resolve, timeout } = this.waitingQueue.shift();
      clearTimeout(timeout);
      this.activeConnections.add(connection);
      resolve(connection);
      return;
    }
    
    // 否则归还到池中
    this.connections.push(connection);
  }
  
  // 处理连接错误
  handleConnectionError(connection) {
    this.activeConnections.delete(connection);
    const index = this.connections.indexOf(connection);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
  }
  
  // 移除连接
  removeConnection(connection) {
    this.activeConnections.delete(connection);
    const index = this.connections.indexOf(connection);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
  }
  
  // 关闭连接池
  async close() {
    console.log('关闭连接池...');
    
    // 关闭所有空闲连接
    for (const connection of this.connections) {
      await connection.end();
    }
    
    // 关闭所有活跃连接
    for (const connection of this.activeConnections) {
      await connection.end();
    }
    
    this.connections = [];
    this.activeConnections.clear();
    this.isInitialized = false;
    
    console.log('连接池已关闭');
  }
}
```

### 2. 连接状态管理
```javascript
// 连接状态枚举
const ConnectionState = {
  IDLE: 'idle',           // 空闲
  ACTIVE: 'active',       // 活跃
  CONNECTING: 'connecting', // 连接中
  ERROR: 'error'          // 错误
};

// 连接包装器
class PooledConnection {
  constructor(connection, pool) {
    this.connection = connection;
    this.pool = pool;
    this.state = ConnectionState.IDLE;
    this.createdAt = new Date();
    this.lastUsedAt = new Date();
    this.queryCount = 0;
  }
  
  // 执行查询
  async execute(sql, params) {
    this.state = ConnectionState.ACTIVE;
    this.lastUsedAt = new Date();
    this.queryCount++;
    
    try {
      const result = await this.connection.execute(sql, params);
      this.state = ConnectionState.IDLE;
      return result;
    } catch (error) {
      this.state = ConnectionState.ERROR;
      throw error;
    }
  }
  
  // 检查连接是否健康
  async ping() {
    try {
      await this.connection.ping();
      return true;
    } catch (error) {
      this.state = ConnectionState.ERROR;
      return false;
    }
  }
  
  // 获取连接统计信息
  getStats() {
    return {
      state: this.state,
      createdAt: this.createdAt,
      lastUsedAt: this.lastUsedAt,
      queryCount: this.queryCount,
      age: Date.now() - this.createdAt.getTime()
    };
  }
}
```

## 主流数据库连接池

### 1. MySQL连接池
```javascript
const mysql = require('mysql2/promise');

// 基础连接池配置
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydb',
  
  // 连接池配置
  connectionLimit: 10,      // 最大连接数
  queueLimit: 0,           // 排队限制（0表示无限制）
  acquireTimeout: 60000,   // 获取连接超时时间
  timeout: 60000,          // 查询超时时间
  
  // 重连配置
  reconnect: true,
  idleTimeout: 900000,     // 空闲超时时间（15分钟）
  
  // SSL配置
  ssl: false
});

// 使用连接池
async function getUsers() {
  try {
    const [rows] = await pool.execute('SELECT * FROM users LIMIT 10');
    return rows;
  } catch (error) {
    console.error('查询失败:', error);
    throw error;
  }
}

// 事务支持
async function transferMoney(fromUserId, toUserId, amount) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 扣除发送方余额
    await connection.execute(
      'UPDATE accounts SET balance = balance - ? WHERE user_id = ?',
      [amount, fromUserId]
    );
    
    // 增加接收方余额
    await connection.execute(
      'UPDATE accounts SET balance = balance + ? WHERE user_id = ?',
      [amount, toUserId]
    );
    
    await connection.commit();
    console.log('转账成功');
  } catch (error) {
    await connection.rollback();
    console.error('转账失败:', error);
    throw error;
  } finally {
    connection.release(); // 释放连接回池中
  }
}
```

### 2. PostgreSQL连接池
```javascript
const { Pool } = require('pg');

// PostgreSQL连接池
const pgPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mydb',
  password: 'password',
  port: 5432,
  
  // 连接池配置
  max: 20,                 // 最大连接数
  min: 5,                  // 最小连接数
  idleTimeoutMillis: 30000, // 空闲超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
  
  // 应用名称
  application_name: 'my_app'
});

// 使用连接池
async function getPostgresUsers() {
  const client = await pgPool.connect();
  
  try {
    const result = await client.query('SELECT * FROM users LIMIT $1', [10]);
    return result.rows;
  } catch (error) {
    console.error('PostgreSQL查询失败:', error);
    throw error;
  } finally {
    client.release(); // 释放连接
  }
}

// 监听连接池事件
pgPool.on('connect', (client) => {
  console.log('新的PostgreSQL连接已建立');
});

pgPool.on('error', (err, client) => {
  console.error('PostgreSQL连接池错误:', err);
});
```

### 3. MongoDB连接池
```javascript
const { MongoClient } = require('mongodb');

// MongoDB连接池配置
const mongoClient = new MongoClient('mongodb://localhost:27017', {
  maxPoolSize: 10,         // 最大连接数
  minPoolSize: 5,          // 最小连接数
  maxIdleTimeMS: 30000,    // 最大空闲时间
  serverSelectionTimeoutMS: 5000, // 服务器选择超时
  socketTimeoutMS: 45000,  // Socket超时时间
  
  // 重试配置
  retryWrites: true,
  retryReads: true
});

// 连接到数据库
async function connectMongoDB() {
  try {
    await mongoClient.connect();
    console.log('MongoDB连接成功');
    
    const db = mongoClient.db('mydb');
    return db;
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    throw error;
  }
}

// 使用MongoDB连接池
async function getMongoUsers() {
  try {
    const db = await connectMongoDB();
    const users = await db.collection('users').find({}).limit(10).toArray();
    return users;
  } catch (error) {
    console.error('MongoDB查询失败:', error);
    throw error;
  }
}
```

## 连接池最佳实践

### 1. 配置优化
```javascript
// 根据应用负载配置连接池
function getPoolConfig(environment) {
  const baseConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };
  
  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        connectionLimit: 5,
        acquireTimeout: 30000,
        idleTimeout: 300000    // 5分钟
      };
      
    case 'production':
      return {
        ...baseConfig,
        connectionLimit: 20,
        acquireTimeout: 10000,
        idleTimeout: 900000,   // 15分钟
        reconnect: true
      };
      
    case 'test':
      return {
        ...baseConfig,
        connectionLimit: 2,
        acquireTimeout: 5000,
        idleTimeout: 60000     // 1分钟
      };
      
    default:
      return baseConfig;
  }
}

const pool = mysql.createPool(getPoolConfig(process.env.NODE_ENV));
```

### 2. 错误处理
```javascript
// 连接池错误处理
class DatabaseManager {
  constructor(poolConfig) {
    this.pool = mysql.createPool(poolConfig);
    this.setupErrorHandling();
  }
  
  setupErrorHandling() {
    this.pool.on('connection', (connection) => {
      console.log('新连接建立:', connection.threadId);
    });
    
    this.pool.on('error', (error) => {
      console.error('连接池错误:', error);
      
      // 根据错误类型采取不同处理策略
      if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('数据库连接丢失，尝试重连...');
        this.handleConnectionLost();
      } else if (error.code === 'ER_CON_COUNT_ERROR') {
        console.log('连接数过多，等待连接释放...');
        this.handleTooManyConnections();
      }
    });
  }
  
  async handleConnectionLost() {
    // 等待一段时间后尝试重新连接
    setTimeout(() => {
      this.testConnection();
    }, 5000);
  }
  
  async handleTooManyConnections() {
    // 记录警告并监控连接使用情况
    console.warn('数据库连接数接近上限，请检查连接使用情况');
    this.logConnectionStats();
  }
  
  async testConnection() {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('数据库连接测试成功');
    } catch (error) {
      console.error('数据库连接测试失败:', error);
    }
  }
  
  logConnectionStats() {
    console.log('连接池统计:', {
      totalConnections: this.pool._allConnections.length,
      freeConnections: this.pool._freeConnections.length,
      acquiringConnections: this.pool._acquiringConnections.length
    });
  }
}
```

### 3. 资源管理
```javascript
// 连接资源管理
class ConnectionManager {
  constructor(pool) {
    this.pool = pool;
    this.activeConnections = new Map();
  }
  
  // 获取连接并跟踪使用情况
  async getConnection(requestId) {
    const connection = await this.pool.getConnection();
    
    this.activeConnections.set(requestId, {
      connection,
      acquiredAt: new Date(),
      stack: new Error().stack // 记录获取连接的调用栈
    });
    
    return connection;
  }
  
  // 释放连接
  releaseConnection(requestId) {
    const connectionInfo = this.activeConnections.get(requestId);
    if (connectionInfo) {
      const { connection, acquiredAt } = connectionInfo;
      const holdTime = Date.now() - acquiredAt.getTime();
      
      // 记录连接持有时间
      if (holdTime > 10000) { // 超过10秒
        console.warn(`连接持有时间过长: ${holdTime}ms`, connectionInfo.stack);
      }
      
      connection.release();
      this.activeConnections.delete(requestId);
    }
  }
  
  // 检查长时间持有的连接
  checkLongRunningConnections() {
    const now = Date.now();
    const longRunningThreshold = 30000; // 30秒
    
    for (const [requestId, info] of this.activeConnections) {
      const holdTime = now - info.acquiredAt.getTime();
      if (holdTime > longRunningThreshold) {
        console.warn(`发现长时间持有的连接: ${requestId}, 持有时间: ${holdTime}ms`);
      }
    }
  }
}

// 定期检查长时间持有的连接
const connectionManager = new ConnectionManager(pool);
setInterval(() => {
  connectionManager.checkLongRunningConnections();
}, 60000); // 每分钟检查一次
```

## 性能监控

### 1. 连接池指标
```javascript
// 连接池性能监控
class PoolMonitor {
  constructor(pool) {
    this.pool = pool;
    this.metrics = {
      connectionsCreated: 0,
      connectionsDestroyed: 0,
      connectionsAcquired: 0,
      connectionsReleased: 0,
      acquireTime: [],
      queryTime: []
    };
  }
  
  // 记录连接获取时间
  recordAcquireTime(time) {
    this.metrics.acquireTime.push(time);
    this.metrics.connectionsAcquired++;
    
    // 只保留最近1000次记录
    if (this.metrics.acquireTime.length > 1000) {
      this.metrics.acquireTime.shift();
    }
  }
  
  // 获取平均获取时间
  getAverageAcquireTime() {
    const times = this.metrics.acquireTime;
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
  
  // 获取连接池状态
  getPoolStatus() {
    return {
      totalConnections: this.pool._allConnections?.length || 0,
      freeConnections: this.pool._freeConnections?.length || 0,
      acquiringConnections: this.pool._acquiringConnections?.length || 0,
      metrics: {
        ...this.metrics,
        averageAcquireTime: this.getAverageAcquireTime()
      }
    };
  }
}
```

### 2. 健康检查
```javascript
// 连接池健康检查
async function healthCheck(pool) {
  const startTime = Date.now();
  
  try {
    // 测试连接获取
    const connection = await pool.getConnection();
    const acquireTime = Date.now() - startTime;
    
    // 测试查询执行
    const queryStartTime = Date.now();
    await connection.execute('SELECT 1 as test');
    const queryTime = Date.now() - queryStartTime;
    
    connection.release();
    
    return {
      status: 'healthy',
      acquireTime,
      queryTime,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    };
  }
}

// 定期健康检查
setInterval(async () => {
  const health = await healthCheck(pool);
  console.log('连接池健康状态:', health);
}, 30000); // 每30秒检查一次
```

## 总结

连接池是数据库应用的重要基础设施：

1. **性能提升**：避免频繁创建/销毁连接的开销
2. **资源管理**：控制数据库连接数量，防止资源耗尽
3. **错误处理**：提供连接错误恢复机制
4. **监控告警**：实时监控连接池状态和性能指标
5. **配置优化**：根据不同环境和负载调整连接池参数

正确使用连接池可以显著提升数据库应用的性能和稳定性。
