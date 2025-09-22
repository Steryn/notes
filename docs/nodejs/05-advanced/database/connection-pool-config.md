# 连接池配置

## 概述

连接池配置是数据库性能优化的关键环节。正确的配置可以最大化数据库性能，避免资源浪费，防止连接泄漏和死锁。本文详细介绍各种数据库连接池的配置参数和最佳实践。

## 核心配置参数

### 1. 连接数量配置
```javascript
// 连接数量相关配置
const connectionConfig = {
  // 最小连接数
  minConnections: 5,
  
  // 最大连接数
  maxConnections: 20,
  
  // 初始连接数
  initialConnections: 10,
  
  // 连接增长步长
  incrementSize: 2,
  
  // 最大空闲连接数
  maxIdleConnections: 10,
  
  // 连接池大小计算公式
  calculatePoolSize: (cpuCores, expectedConcurrency) => {
    // 基于CPU核心数和预期并发数计算
    const baseSize = cpuCores * 2;
    const concurrencySize = Math.ceil(expectedConcurrency * 0.8);
    return Math.max(baseSize, Math.min(concurrencySize, 50));
  }
};

// 动态计算连接池大小
const optimalPoolSize = connectionConfig.calculatePoolSize(
  require('os').cpus().length,
  100 // 预期并发请求数
);

console.log('推荐连接池大小:', optimalPoolSize);
```

### 2. 超时配置
```javascript
// 超时相关配置
const timeoutConfig = {
  // 获取连接超时时间（毫秒）
  acquireTimeout: 30000,
  
  // 连接超时时间
  connectionTimeout: 60000,
  
  // 查询超时时间
  queryTimeout: 30000,
  
  // 空闲超时时间
  idleTimeout: 600000, // 10分钟
  
  // 连接生存时间
  maxLifetime: 1800000, // 30分钟
  
  // 心跳检测间隔
  heartbeatInterval: 60000, // 1分钟
  
  // 重连间隔
  reconnectInterval: 5000
};
```

### 3. 队列配置
```javascript
// 队列相关配置
const queueConfig = {
  // 等待队列最大长度
  queueLimit: 100,
  
  // 队列超时时间
  queueTimeout: 10000,
  
  // 队列处理策略
  queueStrategy: 'fifo', // fifo, lifo, priority
  
  // 优先级队列配置
  priorityLevels: 5,
  
  // 队列监控
  enableQueueMonitoring: true
};
```

## MySQL连接池配置

### 1. mysql2连接池配置
```javascript
const mysql = require('mysql2/promise');

// 生产环境MySQL连接池配置
const productionMySQLConfig = {
  // 基础连接配置
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // 连接池配置
  connectionLimit: 20,        // 最大连接数
  queueLimit: 0,             // 队列限制（0=无限制）
  acquireTimeout: 60000,     // 获取连接超时
  timeout: 60000,            // 查询超时
  
  // 重连配置
  reconnect: true,
  idleTimeout: 900000,       // 15分钟空闲超时
  
  // 字符集和时区
  charset: 'utf8mb4',
  timezone: '+00:00',
  
  // SSL配置
  ssl: {
    rejectUnauthorized: false
  },
  
  // 其他配置
  multipleStatements: false,  // 禁用多语句查询
  dateStrings: false,        // 日期返回Date对象
  supportBigNumbers: true,   // 支持大数字
  bigNumberStrings: false,   // 大数字返回字符串
  
  // 调试配置
  debug: false,
  trace: true,
  
  // 连接标识
  typeCast: function (field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      return (field.string() === '1'); // 1 = true, 0 = false
    }
    return next();
  }
};

// 创建连接池
const mysqlPool = mysql.createPool(productionMySQLConfig);

// 连接池事件监听
mysqlPool.on('connection', function (connection) {
  console.log('新MySQL连接建立:', connection.threadId);
});

mysqlPool.on('error', function(err) {
  console.error('MySQL连接池错误:', err);
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('重新连接MySQL...');
  }
});
```

### 2. 环境特定配置
```javascript
// 基于环境的MySQL配置
function getMySQLConfig(env) {
  const baseConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    timezone: '+00:00'
  };
  
  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        connectionLimit: 5,
        acquireTimeout: 30000,
        timeout: 30000,
        idleTimeout: 300000,   // 5分钟
        debug: true,
        trace: true
      };
      
    case 'test':
      return {
        ...baseConfig,
        connectionLimit: 2,
        acquireTimeout: 5000,
        timeout: 10000,
        idleTimeout: 60000,    // 1分钟
        multipleStatements: true // 测试环境允许多语句
      };
      
    case 'production':
      return {
        ...baseConfig,
        connectionLimit: 50,
        acquireTimeout: 10000,
        timeout: 30000,
        idleTimeout: 1800000,  // 30分钟
        reconnect: true,
        ssl: {
          rejectUnauthorized: true
        }
      };
      
    default:
      return baseConfig;
  }
}

const mysqlConfig = getMySQLConfig(process.env.NODE_ENV);
const pool = mysql.createPool(mysqlConfig);
```

## PostgreSQL连接池配置

### 1. pg连接池配置
```javascript
const { Pool } = require('pg');

// PostgreSQL连接池配置
const pgConfig = {
  // 基础连接配置
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT || 5432,
  
  // 连接池配置
  max: 20,                    // 最大连接数
  min: 5,                     // 最小连接数
  idleTimeoutMillis: 30000,   // 空闲超时
  connectionTimeoutMillis: 2000, // 连接超时
  maxUses: 7500,              // 连接最大使用次数
  
  // SSL配置
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // 应用配置
  application_name: 'my_node_app',
  
  // 查询配置
  statement_timeout: 30000,   // 语句超时
  query_timeout: 30000,       // 查询超时
  
  // 连接配置
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // 解析配置
  parseInputDatesAsUTC: true,
  
  // 类型解析器
  types: {
    getTypeParser: require('pg-types').getTypeParser
  }
};

// 创建PostgreSQL连接池
const pgPool = new Pool(pgConfig);

// 连接池事件监听
pgPool.on('connect', (client) => {
  console.log('新PostgreSQL连接建立');
  
  // 设置连接级别的配置
  client.query('SET timezone TO "UTC"');
});

pgPool.on('error', (err, client) => {
  console.error('PostgreSQL连接池错误:', err);
});

pgPool.on('acquire', (client) => {
  console.log('PostgreSQL连接被获取');
});

pgPool.on('remove', (client) => {
  console.log('PostgreSQL连接被移除');
});
```

### 2. 高级PostgreSQL配置
```javascript
// 高级PostgreSQL连接池配置
class AdvancedPGPool {
  constructor(config) {
    this.config = {
      ...config,
      // 连接验证查询
      validateQuery: 'SELECT 1',
      
      // 连接初始化查询
      initQueries: [
        'SET timezone TO "UTC"',
        'SET statement_timeout TO 30000',
        'SET lock_timeout TO 10000'
      ],
      
      // 连接清理查询
      resetQueries: [
        'RESET ALL',
        'CLOSE ALL',
        'UNLISTEN *'
      ]
    };
    
    this.pool = new Pool(this.config);
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.pool.on('connect', async (client) => {
      console.log('初始化新的PostgreSQL连接');
      
      // 执行初始化查询
      for (const query of this.config.initQueries) {
        try {
          await client.query(query);
        } catch (error) {
          console.error('连接初始化失败:', error);
        }
      }
    });
    
    this.pool.on('error', (err, client) => {
      console.error('PostgreSQL连接错误:', err);
      this.handleConnectionError(err, client);
    });
  }
  
  async getConnection() {
    const client = await this.pool.connect();
    
    // 验证连接健康状态
    try {
      await client.query(this.config.validateQuery);
    } catch (error) {
      client.release(true); // 强制移除不健康的连接
      throw new Error('连接验证失败');
    }
    
    return client;
  }
  
  async resetConnection(client) {
    // 重置连接状态
    for (const query of this.config.resetQueries) {
      try {
        await client.query(query);
      } catch (error) {
        console.warn('连接重置警告:', error);
      }
    }
  }
  
  handleConnectionError(err, client) {
    if (err.code === 'ECONNRESET') {
      console.log('连接被重置，尝试重连...');
    } else if (err.code === '57P01') {
      console.log('管理员关闭了连接');
    }
  }
  
  async close() {
    await this.pool.end();
    console.log('PostgreSQL连接池已关闭');
  }
}
```

## MongoDB连接池配置

### 1. MongoDB驱动配置
```javascript
const { MongoClient } = require('mongodb');

// MongoDB连接池配置
const mongoConfig = {
  // 连接池配置
  maxPoolSize: 10,            // 最大连接数
  minPoolSize: 5,             // 最小连接数
  maxIdleTimeMS: 30000,       // 最大空闲时间
  waitQueueTimeoutMS: 10000,  // 等待队列超时
  
  // 服务器选择配置
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  
  // 心跳配置
  heartbeatFrequencyMS: 10000,
  
  // 重试配置
  retryWrites: true,
  retryReads: true,
  maxRetriesPerRequest: 3,
  
  // 压缩配置
  compressors: ['zlib'],
  zlibCompressionLevel: 6,
  
  // 读写配置
  readPreference: 'secondaryPreferred',
  readConcern: { level: 'majority' },
  writeConcern: { 
    w: 'majority',
    j: true,
    wtimeout: 10000
  },
  
  // 监控配置
  monitorCommands: true,
  
  // 应用名称
  appName: 'my_node_app',
  
  // 日志配置
  loggerLevel: 'info'
};

// 创建MongoDB客户端
const mongoClient = new MongoClient(process.env.MONGODB_URI, mongoConfig);

// 连接事件监听
mongoClient.on('connectionPoolCreated', (event) => {
  console.log('MongoDB连接池已创建:', event);
});

mongoClient.on('connectionCreated', (event) => {
  console.log('新MongoDB连接已创建:', event.connectionId);
});

mongoClient.on('connectionClosed', (event) => {
  console.log('MongoDB连接已关闭:', event.connectionId);
});

mongoClient.on('commandStarted', (event) => {
  console.log('MongoDB命令开始:', event.commandName);
});

mongoClient.on('commandFailed', (event) => {
  console.error('MongoDB命令失败:', event.commandName, event.failure);
});
```

### 2. Mongoose连接配置
```javascript
const mongoose = require('mongoose');

// Mongoose连接配置
const mongooseConfig = {
  // 缓冲配置
  bufferCommands: false,
  bufferMaxEntries: 0,
  
  // 连接池配置
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  
  // 自动索引
  autoIndex: process.env.NODE_ENV !== 'production',
  autoCreate: process.env.NODE_ENV !== 'production',
  
  // 严格模式
  strict: true,
  strictQuery: false,
  
  // 用户新URL解析器
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI, mongooseConfig);

// 连接事件监听
mongoose.connection.on('connected', () => {
  console.log('Mongoose连接成功');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose连接断开');
});

// 优雅关闭
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose连接已关闭');
  process.exit(0);
});
```

## 连接池配置优化

### 1. 性能调优
```javascript
// 连接池性能调优配置
class PoolOptimizer {
  constructor() {
    this.metrics = {
      connectionCreationTime: [],
      queryExecutionTime: [],
      poolUtilization: [],
      errorCount: 0
    };
  }
  
  // 基于负载动态调整连接池大小
  optimizePoolSize(currentLoad, avgResponseTime) {
    let recommendedSize = 10; // 默认大小
    
    // 基于负载调整
    if (currentLoad > 80) {
      recommendedSize = Math.min(recommendedSize * 1.5, 50);
    } else if (currentLoad < 30) {
      recommendedSize = Math.max(recommendedSize * 0.8, 5);
    }
    
    // 基于响应时间调整
    if (avgResponseTime > 1000) { // 超过1秒
      recommendedSize = Math.min(recommendedSize * 1.2, 50);
    }
    
    return Math.floor(recommendedSize);
  }
  
  // 基于CPU和内存使用情况调整
  optimizeForResources() {
    const os = require('os');
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpuCount = os.cpus().length;
    
    const memUsage = (totalMem - freeMem) / totalMem;
    const recommendedConnections = Math.floor(cpuCount * 2 * (1 - memUsage));
    
    return Math.max(5, Math.min(recommendedConnections, 50));
  }
  
  // 获取优化建议
  getOptimizationSuggestions(poolStats) {
    const suggestions = [];
    
    if (poolStats.averageAcquireTime > 100) {
      suggestions.push('连接获取时间过长，建议增加连接池大小');
    }
    
    if (poolStats.poolUtilization > 90) {
      suggestions.push('连接池利用率过高，建议增加最大连接数');
    }
    
    if (poolStats.idleConnections > poolStats.maxConnections * 0.5) {
      suggestions.push('空闲连接过多，建议减少最小连接数');
    }
    
    return suggestions;
  }
}
```

### 2. 配置验证
```javascript
// 连接池配置验证器
class PoolConfigValidator {
  static validate(config) {
    const errors = [];
    const warnings = [];
    
    // 验证必需参数
    if (!config.host) {
      errors.push('缺少数据库主机配置');
    }
    
    if (!config.user) {
      errors.push('缺少数据库用户配置');
    }
    
    // 验证连接数配置
    if (config.connectionLimit && config.connectionLimit < 1) {
      errors.push('连接池大小必须大于0');
    }
    
    if (config.connectionLimit && config.connectionLimit > 100) {
      warnings.push('连接池大小过大，可能导致数据库压力过大');
    }
    
    // 验证超时配置
    if (config.acquireTimeout && config.acquireTimeout < 1000) {
      warnings.push('连接获取超时时间过短，可能导致频繁超时');
    }
    
    if (config.idleTimeout && config.idleTimeout < 60000) {
      warnings.push('空闲超时时间过短，可能导致连接频繁重建');
    }
    
    // 验证环境特定配置
    if (process.env.NODE_ENV === 'production') {
      if (!config.ssl && !config.host.includes('localhost')) {
        warnings.push('生产环境建议启用SSL连接');
      }
      
      if (config.debug) {
        warnings.push('生产环境不建议启用调试模式');
      }
    }
    
    return { errors, warnings };
  }
  
  static validateAndApply(config) {
    const { errors, warnings } = this.validate(config);
    
    if (errors.length > 0) {
      throw new Error('配置验证失败: ' + errors.join(', '));
    }
    
    if (warnings.length > 0) {
      console.warn('配置警告:', warnings.join(', '));
    }
    
    return config;
  }
}

// 使用配置验证
const validatedConfig = PoolConfigValidator.validateAndApply(mysqlConfig);
const pool = mysql.createPool(validatedConfig);
```

### 3. 配置模板
```javascript
// 连接池配置模板
const poolConfigTemplates = {
  // 小型应用
  small: {
    connectionLimit: 5,
    acquireTimeout: 30000,
    timeout: 30000,
    idleTimeout: 300000
  },
  
  // 中型应用
  medium: {
    connectionLimit: 15,
    acquireTimeout: 10000,
    timeout: 30000,
    idleTimeout: 600000
  },
  
  // 大型应用
  large: {
    connectionLimit: 30,
    acquireTimeout: 5000,
    timeout: 30000,
    idleTimeout: 900000
  },
  
  // 高并发应用
  highConcurrency: {
    connectionLimit: 50,
    acquireTimeout: 3000,
    timeout: 15000,
    idleTimeout: 1200000
  }
};

// 根据应用规模选择配置模板
function getPoolConfig(appScale = 'medium') {
  const template = poolConfigTemplates[appScale];
  
  return {
    ...template,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    timezone: '+00:00',
    reconnect: true
  };
}

const poolConfig = getPoolConfig(process.env.APP_SCALE || 'medium');
const pool = mysql.createPool(poolConfig);
```

## 监控和调试

### 1. 配置监控
```javascript
// 连接池配置监控
class PoolConfigMonitor {
  constructor(pool, config) {
    this.pool = pool;
    this.config = config;
    this.startMonitoring();
  }
  
  startMonitoring() {
    setInterval(() => {
      this.checkPoolHealth();
    }, 30000); // 每30秒检查一次
  }
  
  checkPoolHealth() {
    const stats = this.getPoolStats();
    
    // 检查连接池利用率
    if (stats.utilization > 90) {
      console.warn('连接池利用率过高:', stats.utilization + '%');
    }
    
    // 检查等待队列
    if (stats.queueLength > 10) {
      console.warn('等待队列过长:', stats.queueLength);
    }
    
    // 检查连接获取时间
    if (stats.avgAcquireTime > 1000) {
      console.warn('连接获取时间过长:', stats.avgAcquireTime + 'ms');
    }
  }
  
  getPoolStats() {
    const allConnections = this.pool._allConnections?.length || 0;
    const freeConnections = this.pool._freeConnections?.length || 0;
    const acquiringConnections = this.pool._acquiringConnections?.length || 0;
    
    return {
      totalConnections: allConnections,
      freeConnections: freeConnections,
      activeConnections: allConnections - freeConnections,
      acquiringConnections: acquiringConnections,
      utilization: allConnections > 0 ? ((allConnections - freeConnections) / allConnections) * 100 : 0,
      queueLength: this.pool._connectionQueue?.length || 0
    };
  }
}
```

### 2. 配置调试
```javascript
// 连接池配置调试工具
function debugPoolConfig(pool, config) {
  console.log('=== 连接池配置调试信息 ===');
  console.log('配置参数:', JSON.stringify(config, null, 2));
  
  // 显示连接池状态
  const stats = {
    totalConnections: pool._allConnections?.length || 0,
    freeConnections: pool._freeConnections?.length || 0,
    acquiringConnections: pool._acquiringConnections?.length || 0
  };
  
  console.log('当前状态:', stats);
  
  // 测试连接获取性能
  testConnectionPerformance(pool);
}

async function testConnectionPerformance(pool) {
  const startTime = Date.now();
  
  try {
    const connection = await pool.getConnection();
    const acquireTime = Date.now() - startTime;
    
    console.log('连接获取时间:', acquireTime + 'ms');
    
    const queryStartTime = Date.now();
    await connection.execute('SELECT 1');
    const queryTime = Date.now() - queryStartTime;
    
    console.log('查询执行时间:', queryTime + 'ms');
    
    connection.release();
  } catch (error) {
    console.error('性能测试失败:', error);
  }
}
```

## 总结

连接池配置的关键要点：

1. **合理设置连接数**：基于应用负载和数据库能力
2. **优化超时参数**：平衡响应速度和资源利用率
3. **环境特定配置**：开发、测试、生产环境使用不同配置
4. **监控和调优**：持续监控连接池状态并动态调整
5. **错误处理**：完善的错误处理和恢复机制
6. **安全配置**：生产环境启用SSL和其他安全措施

正确的连接池配置是高性能数据库应用的基础，需要根据具体场景进行调优。
