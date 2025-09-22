# MySQL基础

## 什么是MySQL

MySQL是世界上最流行的开源关系型数据库管理系统之一。它由瑞典MySQL AB公司开发，目前属于Oracle公司。MySQL以其高性能、稳定性和易用性而闻名，广泛应用于Web应用开发中。

## MySQL的特点

### 关系型数据库

MySQL是关系型数据库管理系统（RDBMS），数据存储在表中，表之间可以通过关系连接。

### 开源免费

MySQL是开源软件，可以免费使用，拥有庞大的社区支持。

### 跨平台

MySQL支持多种操作系统，包括Windows、Linux、macOS等。

### 高性能

MySQL具有良好的性能表现，支持多种存储引擎，可以根据需求选择合适的引擎。

### 可靠性

MySQL支持事务处理、数据备份和恢复等功能，确保数据的安全性和一致性。

## MySQL安装与配置

### Windows安装

1. 下载MySQL安装包（MySQL Community Server）
2. 运行安装程序，选择合适的安装类型（Server only、Client only、Full等）
3. 配置root用户密码
4. 启动MySQL服务

### macOS安装

使用Homebrew安装：

```bash
brew install mysql
```

启动MySQL服务：

```bash
brew services start mysql
```

### Linux安装（Ubuntu）

```bash
# 更新包列表
sudo apt update

# 安装MySQL服务器
sudo apt install mysql-server

# 启动MySQL服务
sudo systemctl start mysql

# 设置开机自启
sudo systemctl enable mysql
```

### 初始配置

运行安全配置脚本：

```bash
sudo mysql_secure_installation
```

## MySQL基本操作

### 连接MySQL

```bash
# 使用root用户连接
mysql -u root -p

# 连接到指定数据库
mysql -u root -p -D database_name
```

### 数据库操作

```sql
-- 查看所有数据库
SHOW DATABASES;

-- 创建数据库
CREATE DATABASE my_database;

-- 使用数据库
USE my_database;

-- 删除数据库
DROP DATABASE my_database;
```

### 表操作

```sql
-- 查看所有表
SHOW TABLES;

-- 创建表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  age INT,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 查看表结构
DESCRIBE users;
-- 或者
DESC users;

-- 删除表
DROP TABLE users;
```

### 数据操作

```sql
-- 插入数据
INSERT INTO users (name, age, email) VALUES 
('张三', 25, 'zhangsan@example.com'),
('李四', 30, 'lisi@example.com');

-- 查询数据
SELECT * FROM users;
SELECT name, age FROM users WHERE age > 25;

-- 更新数据
UPDATE users SET age = 26 WHERE name = '张三';

-- 删除数据
DELETE FROM users WHERE name = '张三';
```

## MySQL存储引擎

MySQL支持多种存储引擎，每种引擎都有其特点和适用场景。

### InnoDB

InnoDB是MySQL的默认存储引擎，支持事务处理和外键约束。

特点：

- 支持事务（ACID特性）
- 支持行级锁定
- 支持外键约束
- 支持崩溃恢复
- 支持MVCC（多版本并发控制）

### MyISAM

MyISAM是MySQL早期的默认存储引擎，不支持事务。

特点：

- 不支持事务
- 支持表级锁定
- 查询性能较好
- 不支持外键约束
- 不支持崩溃恢复

### Memory

Memory存储引擎将数据存储在内存中，访问速度极快。

特点：

- 数据存储在内存中
- 访问速度极快
- 不支持事务
- 服务器重启后数据丢失

### 选择存储引擎

```sql
-- 创建表时指定存储引擎
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
) ENGINE=InnoDB;
```

## MySQL数据类型

### 数值类型

```sql
-- 整数类型
TINYINT    -- 1字节，范围-128到127
SMALLINT   -- 2字节，范围-32768到32767
MEDIUMINT  -- 3字节，范围-8388608到8388607
INT        -- 4字节，范围-2147483648到2147483647
BIGINT     -- 8字节，范围-2^63到2^63-1

-- 浮点数类型
FLOAT      -- 4字节单精度浮点数
DOUBLE     -- 8字节双精度浮点数
DECIMAL    -- 精确的小数类型
```

### 字符串类型

```sql
-- 定长字符串
CHAR(n)    -- 固定长度字符串，最大255字符

-- 变长字符串
VARCHAR(n) -- 可变长度字符串，最大65535字符

-- 文本类型
TINYTEXT   -- 最大255字符
TEXT       -- 最大65535字符
MEDIUMTEXT -- 最大16777215字符
LONGTEXT   -- 最大4294967295字符

-- 二进制类型
BINARY(n)  -- 固定长度二进制数据
VARBINARY(n) -- 可变长度二进制数据
```

### 日期时间类型

```sql
DATE       -- 日期，格式YYYY-MM-DD
TIME       -- 时间，格式HH:MM:SS
DATETIME   -- 日期时间，格式YYYY-MM-DD HH:MM:SS
TIMESTAMP  -- 时间戳，范围1970-2038年
YEAR       -- 年份，格式YYYY
```

## MySQL与Node.js集成

### 安装驱动

```bash
npm install mysql2
```

### 连接MySQL

```javascript
const mysql = require('mysql2');

// 创建连接
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'my_database'
});

// 连接数据库
connection.connect((err) => {
  if (err) {
    console.error('连接失败: ' + err.stack);
    return;
  }
  console.log('连接成功，连接ID: ' + connection.threadId);
});

// 执行查询
connection.query('SELECT * FROM users', (error, results, fields) => {
  if (error) throw error;
  console.log('查询结果: ', results);
});

// 关闭连接
connection.end();
```

### 使用连接池

```javascript
const mysql = require('mysql2');

// 创建连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'my_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 使用连接池执行查询
pool.execute('SELECT * FROM users WHERE id = ?', [1], (err, results) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(results);
});
```

## 实践项目

搭建MySQL开发环境，并创建一个简单的用户管理系统数据库，包含用户表、角色表和用户角色关联表，实现基本的CRUD操作。
