# Prometheus监控

## 📋 概述

Prometheus是一个开源的监控和告警系统，专为云原生环境设计。它通过拉取模式收集指标，提供强大的查询语言PromQL，并与Grafana等工具集成提供可视化。

## 🎯 学习目标

- 掌握Prometheus的架构和工作原理
- 学会在Node.js应用中集成Prometheus
- 了解PromQL查询语言
- 掌握告警规则配置

## 📚 Prometheus核心概念

### 数据模型

Prometheus将所有数据存储为时间序列，每个时间序列由指标名称和标签集唯一标识。

```
指标格式：
<metric name>{<label name>=<label value>, ...} value [timestamp]

示例：
http_requests_total{method="POST", handler="/api/users"} 1027 1395066363000
```

### 指标类型

#### 1. Counter（计数器）

只能增加的累积指标。

```javascript
const client = require('prom-client');

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// 使用
httpRequestsTotal.inc({ method: 'GET', route: '/api/users', status_code: '200' });
```

#### 2. Gauge（仪表）

可增可减的瞬时值指标。

```javascript
const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const memoryUsage = new client.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type']
});

// 使用
activeConnections.set(42);
memoryUsage.set({ type: 'heap' }, process.memoryUsage().heapUsed);
```

#### 3. Histogram（直方图）

观察值的分布情况。

```javascript
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // 自定义桶
});

// 使用
const end = httpDuration.startTimer({ method: 'GET', route: '/api/users' });
// ... 处理请求
end(); // 自动记录持续时间
```

#### 4. Summary（摘要）

类似Histogram，但计算可配置的分位数。

```javascript
const httpDurationSummary = new client.Summary({
  name: 'http_request_duration_summary_seconds',
  help: 'Duration of HTTP requests in seconds (summary)',
  labelNames: ['method', 'route'],
  percentiles: [0.5, 0.9, 0.95, 0.99]
});

// 使用
httpDurationSummary.observe({ method: 'GET', route: '/api/users' }, 0.5);
```

## 🛠 Node.js集成实现

### 完整的Prometheus集成

```javascript
// prometheus.js
const client = require('prom-client');

class PrometheusMetrics {
  constructor() {
    // 创建注册表
    this.register = new client.Registry();
    
    // 收集默认指标
    client.collectDefaultMetrics({ 
      register: this.register,
      timeout: 10000,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });

    this.initializeMetrics();
  }

  initializeMetrics() {
    // HTTP请求指标
    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register]
    });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
      registers: [this.register]
    });

    // 数据库指标
    this.dbConnectionsActive = new client.Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections',
      registers: [this.register]
    });

    this.dbQueriesTotal = new client.Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table', 'status'],
      registers: [this.register]
    });

    this.dbQueryDuration = new client.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.register]
    });

    // 业务指标
    this.activeUsers = new client.Gauge({
      name: 'active_users_total',
      help: 'Number of currently active users',
      registers: [this.register]
    });

    this.ordersTotal = new client.Counter({
      name: 'orders_total',
      help: 'Total number of orders',
      labelNames: ['status', 'payment_method'],
      registers: [this.register]
    });

    this.orderValue = new client.Histogram({
      name: 'order_value_dollars',
      help: 'Value of orders in dollars',
      buckets: [10, 50, 100, 500, 1000, 5000],
      registers: [this.register]
    });

    // 错误指标
    this.errorsTotal = new client.Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'module'],
      registers: [this.register]
    });

    // 自定义业务指标
    this.cacheHitRate = new client.Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate as a percentage',
      labelNames: ['cache_name'],
      registers: [this.register]
    });

    this.queueSize = new client.Gauge({
      name: 'queue_size',
      help: 'Number of items in queue',
      labelNames: ['queue_name'],
      registers: [this.register]
    });
  }

  // HTTP监控中间件
  httpMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.url;
        const labels = {
          method: req.method,
          route,
          status_code: res.statusCode
        };

        this.httpRequestsTotal.inc(labels);
        this.httpRequestDuration.observe(labels, duration);
      });

      next();
    };
  }

  // 数据库监控装饰器
  monitorDbQuery(operation, table) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        const start = Date.now();
        let status = 'success';
        
        try {
          const result = await originalMethod.apply(this, args);
          return result;
        } catch (error) {
          status = 'error';
          throw error;
        } finally {
          const duration = (Date.now() - start) / 1000;
          
          this.dbQueriesTotal.inc({ operation, table, status });
          this.dbQueryDuration.observe({ operation, table }, duration);
        }
      };
      
      return descriptor;
    };
  }

  // 业务指标更新
  updateActiveUsers(count) {
    this.activeUsers.set(count);
  }

  recordOrder(status, paymentMethod, value) {
    this.ordersTotal.inc({ status, payment_method: paymentMethod });
    if (value) {
      this.orderValue.observe(value);
    }
  }

  recordError(type, module = 'unknown') {
    this.errorsTotal.inc({ type, module });
  }

  updateCacheHitRate(cacheName, hitRate) {
    this.cacheHitRate.set({ cache_name: cacheName }, hitRate);
  }

  updateQueueSize(queueName, size) {
    this.queueSize.set({ queue_name: queueName }, size);
  }

  // 获取指标
  async getMetrics() {
    return await this.register.metrics();
  }

  // 指标端点
  metricsEndpoint() {
    return async (req, res) => {
      try {
        res.set('Content-Type', this.register.contentType);
        res.end(await this.getMetrics());
      } catch (error) {
        res.status(500).end(error.toString());
      }
    };
  }
}

module.exports = PrometheusMetrics;
```

### Express应用集成

```javascript
// app.js
const express = require('express');
const PrometheusMetrics = require('./monitoring/prometheus');

const app = express();
const metrics = new PrometheusMetrics();

// Prometheus中间件
app.use(metrics.httpMiddleware());

// 指标端点
app.get('/metrics', metrics.metricsEndpoint());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 业务路由
app.get('/api/users', async (req, res) => {
  try {
    // 模拟数据库查询
    const users = await getUsersFromDatabase();
    res.json(users);
  } catch (error) {
    metrics.recordError('database_error', 'users');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = await createOrder(req.body);
    
    // 记录订单指标
    metrics.recordOrder('created', req.body.paymentMethod, req.body.amount);
    
    res.status(201).json(order);
  } catch (error) {
    metrics.recordError('order_creation_error', 'orders');
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// 定期更新业务指标
setInterval(async () => {
  try {
    // 更新活跃用户数
    const activeUserCount = await getActiveUserCount();
    metrics.updateActiveUsers(activeUserCount);

    // 更新缓存命中率
    const cacheStats = await getCacheStats();
    metrics.updateCacheHitRate('redis', cacheStats.hitRate);

    // 更新队列大小
    const queueStats = await getQueueStats();
    metrics.updateQueueSize('email', queueStats.emailQueue);
    metrics.updateQueueSize('notifications', queueStats.notificationQueue);
    
  } catch (error) {
    console.error('Error updating metrics:', error);
  }
}, 30000); // 每30秒更新一次

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Metrics available at http://localhost:${port}/metrics`);
});
```

## 📊 PromQL查询语言

### 基础查询

```promql
# 即时查询
http_requests_total

# 带标签过滤
http_requests_total{method="GET"}
http_requests_total{method="GET", status_code="200"}

# 正则表达式匹配
http_requests_total{status_code=~"2.."}
http_requests_total{route!~"/health|/metrics"}

# 范围查询
http_requests_total[5m]  # 过去5分钟的数据
```

### 聚合操作

```promql
# 求和
sum(http_requests_total)

# 按标签分组求和
sum(http_requests_total) by (method)
sum(http_requests_total) by (method, status_code)

# 平均值
avg(http_request_duration_seconds)

# 最大值和最小值
max(memory_usage_bytes)
min(memory_usage_bytes)

# 计数
count(up == 1)  # 运行中的实例数量
```

### 速率和增长率

```promql
# 每秒请求数
rate(http_requests_total[5m])

# 每秒增长数（适用于可能重置的计数器）
increase(http_requests_total[5m])

# 瞬时增长率
irate(http_requests_total[5m])
```

### 分位数查询

```promql
# 95分位数响应时间
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 50分位数响应时间
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# 99分位数响应时间（按方法分组）
histogram_quantile(0.99, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, method)
)
```

### 复杂查询示例

```promql
# 错误率
rate(http_requests_total{status_code=~"5.."}[5m]) / 
rate(http_requests_total[5m]) * 100

# 可用性
avg_over_time(up[5m]) * 100

# 内存使用率
(
  process_resident_memory_bytes / 
  (1024 * 1024 * 1024)
) * 100

# 数据库连接池使用率
(
  db_connections_active / 
  db_connections_max
) * 100

# 队列处理速率
rate(queue_processed_total[5m])

# 缓存命中率
(
  rate(cache_hits_total[5m]) / 
  (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
) * 100
```

## 🚨 告警规则配置

### 告警规则文件

```yaml
# alert-rules.yml
groups:
- name: nodejs-app-alerts
  rules:
  
  # 服务可用性告警
  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service {{ $labels.instance }} is down"
      description: "Service {{ $labels.instance }} has been down for more than 1 minute."

  # 高错误率告警
  - alert: HighErrorRate
    expr: |
      (
        rate(http_requests_total{status_code=~"5.."}[5m]) / 
        rate(http_requests_total[5m])
      ) * 100 > 5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }}% for more than 5 minutes."

  # 高响应时间告警
  - alert: HighResponseTime
    expr: |
      histogram_quantile(0.95, 
        rate(http_request_duration_seconds_bucket[5m])
      ) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }}s for more than 5 minutes."

  # 内存使用率告警
  - alert: HighMemoryUsage
    expr: |
      (
        process_resident_memory_bytes / 
        (1024 * 1024 * 1024)
      ) > 1
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
      description: "Memory usage is {{ $value }}GB for more than 10 minutes."

  # CPU使用率告警
  - alert: HighCPUUsage
    expr: |
      (
        rate(process_cpu_seconds_total[5m]) * 100
      ) > 80
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      description: "CPU usage is {{ $value }}% for more than 10 minutes."

  # 数据库连接池告警
  - alert: DatabaseConnectionPoolExhaustion
    expr: |
      (
        db_connections_active / 
        db_connections_max
      ) * 100 > 90
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Database connection pool near exhaustion"
      description: "Connection pool usage is {{ $value }}% for more than 5 minutes."

  # 队列积压告警
  - alert: QueueBacklog
    expr: queue_size > 1000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Queue backlog detected"
      description: "Queue {{ $labels.queue_name }} has {{ $value }} items for more than 5 minutes."

  # 磁盘空间告警
  - alert: DiskSpaceRunningOut
    expr: |
      (
        (node_filesystem_size_bytes - node_filesystem_avail_bytes) / 
        node_filesystem_size_bytes
      ) * 100 > 90
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Disk space running out"
      description: "Disk usage is {{ $value }}% on {{ $labels.mountpoint }}."
```

### Prometheus配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert-rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'nodejs-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
```

## 🔧 高级配置

### 自定义收集器

```javascript
// custom-collector.js
const client = require('prom-client');

class CustomCollector {
  constructor() {
    this.metrics = {
      customMetric: new client.Gauge({
        name: 'custom_business_metric',
        help: 'Custom business metric',
        labelNames: ['type', 'status'],
        collect: this.collect.bind(this)
      })
    };
  }

  async collect() {
    // 自定义收集逻辑
    const businessData = await this.getBusinessData();
    
    businessData.forEach(item => {
      this.metrics.customMetric.set(
        { type: item.type, status: item.status },
        item.value
      );
    });
  }

  async getBusinessData() {
    // 实现业务数据获取逻辑
    return [
      { type: 'orders', status: 'pending', value: 42 },
      { type: 'orders', status: 'completed', value: 158 },
      { type: 'users', status: 'active', value: 1234 }
    ];
  }
}

module.exports = CustomCollector;
```

### 指标标签最佳实践

```javascript
// 好的标签设计
const goodMetric = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'status', 'endpoint'] // 有限的标签值
});

// 避免高基数标签
const badMetric = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'status', 'user_id'] // user_id会产生大量标签值
});

// 使用标签规范化
function normalizeRoute(route) {
  // 将 /users/123 规范化为 /users/:id
  return route.replace(/\/\d+/g, '/:id')
              .replace(/\/[a-f0-9-]{36}/g, '/:uuid');
}
```

## 📝 总结

Prometheus为Node.js应用提供了强大的监控能力：

- **灵活的数据模型**：基于标签的多维数据模型
- **强大的查询语言**：PromQL支持复杂的数据分析
- **可靠的告警系统**：基于规则的智能告警
- **生态系统丰富**：与Grafana、Alertmanager等工具无缝集成

通过合理的指标设计和查询优化，可以构建出高效的监控系统。

## 🔗 相关资源

- [Prometheus官方文档](https://prometheus.io/docs/)
- [PromQL查询语言](https://prometheus.io/docs/prometheus/latest/querying/)
- [Node.js客户端库](https://github.com/siimon/prom-client)
- [监控最佳实践](https://prometheus.io/docs/practices/)
