# 连接管理

## 数据库连接基础

数据库连接是应用程序与数据库之间通信的通道。正确管理数据库连接对于应用程序的性能和稳定性至关重要。

## 连接池

连接池是一种数据库连接管理技术，它预先创建一定数量的数据库连接并缓存起来，当应用程序需要访问数据库时，直接从连接池中获取连接，使用完毕后再将连接归还给连接池。

### 连接池的优势

1. **减少连接创建和销毁的开销**：连接的创建和销毁是相对耗时的操作，连接池通过复用连接来减少这种开销。
2. **提高响应速度**：由于连接已经预先创建好，应用程序可以直接使用，无需等待连接建立。
3. **控制资源使用**：连接池可以限制最大连接数，防止数据库因过多连接而崩溃。
4. **统一管理连接**：连接池可以对连接进行统一管理，包括连接的创建、销毁、监控等。

### 连接池配置参数

1. **最小连接数**：连接池保持的最小连接数量。
2. **最大连接数**：连接池允许的最大连接数量。
3. **连接超时时间**：获取连接的最大等待时间。
4. **空闲连接超时时间**：连接在池中空闲的最长时间，超过这个时间连接将被销毁。
5. **连接验证查询**：用于验证连接是否有效的SQL语句。

## Node.js中的数据库连接管理

### MySQL连接管理

在Node.js中，可以使用`mysql`或`mysql2`模块来管理MySQL连接。

```javascript
const mysql = require('mysql2');

// 创建连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 使用连接池执行查询
pool.execute('SELECT * FROM users', (err, results) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(results);
});
```

### MongoDB连接管理

在Node.js中，可以使用`mongodb`或`mongoose`模块来管理MongoDB连接。

```javascript
const { MongoClient } = require('mongodb');

// 创建连接URL
const url = 'mongodb://localhost:27017';
const dbName = 'test';

// 连接到MongoDB
MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.error(err);
    return;
  }
  
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  
  // 使用数据库进行操作
  // ...
  
  // 关闭连接
  client.close();
});
```

## 连接泄漏与监控

### 连接泄漏

连接泄漏是指应用程序获取了数据库连接但没有正确释放，导致连接池中的连接逐渐耗尽。

预防措施：

1. 确保每个获取的连接都有对应的释放操作
2. 使用try-finally或async/await确保连接释放
3. 设置合理的连接超时时间

### 连接监控

监控数据库连接的使用情况可以帮助发现潜在问题：

1. 当前活跃连接数
2. 空闲连接数
3. 等待连接的请求数
4. 连接使用历史

## 实践项目

在博客系统中实现数据库连接池管理，确保所有数据库操作都通过连接池进行，并添加连接监控功能。
