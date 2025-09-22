# 性能优化

## 性能优化基础

数据库性能优化是确保应用程序高效运行的关键。通过合理的优化策略，可以显著提高查询速度、减少系统资源消耗，并提升用户体验。

## 查询优化

### 执行计划分析

使用`EXPLAIN`语句分析查询执行计划是优化查询的第一步：

```sql
-- 分析简单查询
EXPLAIN SELECT * FROM users WHERE age > 25;

-- 分析连接查询
EXPLAIN 
SELECT u.name, d.name as department_name 
FROM users u 
INNER JOIN departments d ON u.department_id = d.id 
WHERE u.age > 25;

-- 获取更详细的执行信息
EXPLAIN FORMAT=JSON SELECT * FROM users WHERE age > 25;
```

执行计划中的关键字段：

- `type`：连接类型，const > eq_ref > ref > range > index > ALL
- `key`：实际使用的索引
- `rows`：扫描的行数
- `Extra`：额外信息，如Using index、Using where等

### 索引优化

#### 选择合适的索引

```sql
-- 为经常用于WHERE子句的字段创建索引
CREATE INDEX idx_user_age ON users(age);

-- 为经常用于连接的字段创建索引
CREATE INDEX idx_user_dept_id ON users(department_id);

-- 为经常用于排序的字段创建索引
CREATE INDEX idx_user_created_at ON users(created_at);
```

#### 复合索引优化

```sql
-- 创建复合索引
CREATE INDEX idx_user_dept_status ON users(department_id, status);

-- 查询可以使用该索引
SELECT * FROM users WHERE department_id = 1 AND status = 'active';

-- 查询也可以使用该索引（只使用前缀）
SELECT * FROM users WHERE department_id = 1;

-- 查询无法使用该索引
SELECT * FROM users WHERE status = 'active';
```

#### 覆盖索引

```sql
-- 创建覆盖索引，包含查询所需的所有字段
CREATE INDEX idx_user_cover ON users(department_id, status, name);

-- 查询只需要访问索引，无需回表
SELECT name FROM users WHERE department_id = 1 AND status = 'active';
```

### 查询重写

#### 避免SELECT *

```sql
-- 不好的查询
SELECT * FROM users WHERE age > 25;

-- 好的查询
SELECT id, name, age FROM users WHERE age > 25;
```

#### 优化子查询

```sql
-- 不好的查询：使用子查询
SELECT * FROM users WHERE department_id IN 
(SELECT id FROM departments WHERE city = '北京');

-- 好的查询：使用连接
SELECT u.* FROM users u 
INNER JOIN departments d ON u.department_id = d.id 
WHERE d.city = '北京';
```

#### 使用LIMIT

```sql
-- 对于只需要少量结果的查询，使用LIMIT
SELECT * FROM users WHERE age > 25 ORDER BY created_at DESC LIMIT 10;
```

## 表结构优化

### 数据类型优化

```sql
-- 选择合适的数据类型
CREATE TABLE users (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- 使用较小的类型
  name VARCHAR(50) NOT NULL,
  age TINYINT UNSIGNED,  -- 年龄不需要大整数
  gender ENUM('male', 'female'),  -- 使用ENUM而不是字符串
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 表拆分

#### 垂直拆分

将大表拆分为多个小表：

```sql
-- 拆分前
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  email VARCHAR(100),
  profile TEXT,  -- 大字段
  settings JSON   -- 大字段
);

-- 拆分后
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  email VARCHAR(100)
);

CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY,
  profile TEXT,
  settings JSON,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 水平拆分

按某种规则将数据分布到多个表中：

```sql
-- 按用户ID范围拆分
CREATE TABLE orders_0 (
  id INT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10,2)
  -- ...
);

CREATE TABLE orders_1 (
  id INT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10,2)
  -- ...
);
```

## 配置优化

### MySQL配置参数

在`my.cnf`或`my.ini`文件中调整以下参数：

```ini
[mysqld]
# 缓冲池大小，通常设置为物理内存的50-80%
innodb_buffer_pool_size = 1G

# 查询缓存大小
query_cache_size = 128M

# 最大连接数
max_connections = 200

# 临时表大小
tmp_table_size = 64M
max_heap_table_size = 64M

# 日志文件大小
innodb_log_file_size = 256M

# 排序缓冲区大小
sort_buffer_size = 2M

# 连接缓冲区大小
join_buffer_size = 2M
```

### 系统配置

```bash
# 调整文件描述符限制
ulimit -n 65535

# 调整内核参数
echo 'net.core.somaxconn = 65535' >> /etc/sysctl.conf
```

## 存储引擎优化

### InnoDB优化

```sql
-- 为InnoDB表指定合适的缓冲池实例
SET GLOBAL innodb_buffer_pool_instances = 8;

-- 调整日志文件大小
SET GLOBAL innodb_log_file_size = 268435456;  -- 256MB

-- 启用文件每表
SET GLOBAL innodb_file_per_table = ON;
```

### 分区表

```sql
-- 按日期分区
CREATE TABLE sales (
  id INT AUTO_INCREMENT,
  sale_date DATE,
  amount DECIMAL(10,2),
  PRIMARY KEY (id, sale_date)
) PARTITION BY RANGE (YEAR(sale_date)) (
  PARTITION p2020 VALUES LESS THAN (2021),
  PARTITION p2021 VALUES LESS THAN (2022),
  PARTITION p2022 VALUES LESS THAN (2023),
  PARTITION p2023 VALUES LESS THAN (2024)
);

-- 查询时只扫描相关分区
SELECT * FROM sales WHERE sale_date >= '2022-01-01' AND sale_date < '2023-01-01';
```

## 监控与分析

### 性能监控

```sql
-- 查看当前运行的查询
SHOW PROCESSLIST;

-- 查看慢查询日志设置
SHOW VARIABLES LIKE 'slow_query_log%';
SHOW VARIABLES LIKE 'long_query_time';

-- 查看表状态
SHOW TABLE STATUS LIKE 'users';

-- 查看索引使用情况
SHOW INDEX FROM users;
```

### 慢查询日志

在`my.cnf`中配置慢查询日志：

```ini
[mysqld]
# 启用慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log

# 设置慢查询阈值（秒）
long_query_time = 2

# 记录未使用索引的查询
log_queries_not_using_indexes = 1
```

### 使用性能模式

```sql
-- 启用性能模式
UPDATE performance_schema.setup_consumers SET ENABLED = 'YES' WHERE NAME = 'events_statements_current';

-- 查看最近的查询
SELECT * FROM performance_schema.events_statements_current;

-- 查看查询等待事件
SELECT * FROM performance_schema.events_waits_current;
```

## 实践项目

在博客系统中实现性能优化：

1. 分析现有查询的执行计划，找出性能瓶颈
2. 为常用查询字段创建合适的索引
3. 优化慢查询语句
4. 配置慢查询日志并分析日志内容
5. 监控数据库性能指标
6. 对大数据量的表进行分区优化
