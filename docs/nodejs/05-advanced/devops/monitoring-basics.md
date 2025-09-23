# 监控基础

## 📋 概述

应用程序监控是确保系统稳定性和性能的关键实践。通过收集、分析和可视化各种指标，我们可以及时发现问题、优化性能并提高用户体验。

## 🎯 学习目标

- 理解监控的核心概念和重要性
- 掌握Node.js应用的监控策略
- 学会设置关键指标和告警
- 了解监控工具和最佳实践

## 📚 监控基础概念

### 监控的四个黄金信号

#### 1. 延迟（Latency）

请求处理时间，包括成功和失败的请求。

```javascript
// Express中间件记录响应时间
const responseTime = require('response-time');

app.use(responseTime((req, res, time) => {
  // 记录响应时间
  console.log(`${req.method} ${req.url} - ${time}ms`);
  
  // 发送到监控系统
  metrics.histogram('http_request_duration_ms', time, {
    method: req.method,
    route: req.route?.path || req.url,
    status: res.statusCode
  });
}));
```

#### 2. 流量（Traffic）

系统处理的请求数量。

```javascript
// 记录请求数量
app.use((req, res, next) => {
  metrics.increment('http_requests_total', {
    method: req.method,
    route: req.route?.path || req.url
  });
  next();
});
```

#### 3. 错误率（Errors）

失败请求的比例。

```javascript
// 错误处理中间件
app.use((err, req, res, next) => {
  // 记录错误
  metrics.increment('http_errors_total', {
    method: req.method,
    route: req.route?.path || req.url,
    error: err.name
  });
  
  console.error('Request error:', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack
  });
  
  res.status(500).json({ error: 'Internal Server Error' });
});
```

#### 4. 饱和度（Saturation）

系统资源的使用程度。

```javascript
const os = require('os');

// 定期收集系统指标
setInterval(() => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  // 内存使用率
  metrics.gauge('memory_usage_bytes', memUsage.rss);
  metrics.gauge('memory_heap_used_bytes', memUsage.heapUsed);
  metrics.gauge('memory_heap_total_bytes', memUsage.heapTotal);
  
  // CPU使用率
  metrics.gauge('cpu_user_microseconds', cpuUsage.user);
  metrics.gauge('cpu_system_microseconds', cpuUsage.system);
  
  // 系统负载
  const loadAvg = os.loadavg();
  metrics.gauge('system_load_1m', loadAvg[0]);
  metrics.gauge('system_load_5m', loadAvg[1]);
  metrics.gauge('system_load_15m', loadAvg[2]);
}, 10000);
```

## 🛠 Node.js应用监控实现

### 基础监控设置

#### 健康检查端点

```javascript
// health.js
const express = require('express');
const router = express.Router();

let isHealthy = true;
let readinessChecks = [];

// 添加就绪检查
function addReadinessCheck(name, checkFn) {
  readinessChecks.push({ name, check: checkFn });
}

// 健康检查
router.get('/health', (req, res) => {
  if (isHealthy) {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0'
    });
  } else {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString()
    });
  }
});

// 就绪检查
router.get('/ready', async (req, res) => {
  const results = {};
  let allReady = true;

  for (const { name, check } of readinessChecks) {
    try {
      const result = await check();
      results[name] = { status: 'UP', ...result };
    } catch (error) {
      results[name] = { status: 'DOWN', error: error.message };
      allReady = false;
    }
  }

  const status = allReady ? 200 : 503;
  res.status(status).json({
    status: allReady ? 'READY' : 'NOT_READY',
    checks: results,
    timestamp: new Date().toISOString()
  });
});

// 添加数据库连接检查
addReadinessCheck('database', async () => {
  // 检查数据库连接
  const startTime = Date.now();
  await db.query('SELECT 1');
  return { responseTime: Date.now() - startTime };
});

// 添加Redis连接检查
addReadinessCheck('redis', async () => {
  const startTime = Date.now();
  await redis.ping();
  return { responseTime: Date.now() - startTime };
});

module.exports = router;
```

#### 指标收集中间件

```javascript
// metrics.js
const client = require('prom-client');

// 创建指标注册表
const register = new client.Registry();

// 默认指标
client.collectDefaultMetrics({ register });

// HTTP请求指标
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  registers: [register]
});

// 数据库查询指标
const dbQueriesTotal = new client.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table'],
  registers: [register]
});

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

// 业务指标
const activeUsers = new client.Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  registers: [register]
});

const ordersTotal = new client.Counter({
  name: 'orders_total',
  help: 'Total number of orders',
  labelNames: ['status'],
  registers: [register]
});

// 监控中间件
function monitoringMiddleware() {
  return (req, res, next) => {
    const start = Date.now();

    // 监听响应结束事件
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.url;
      
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status_code: res.statusCode
      });
      
      httpRequestDuration.observe({
        method: req.method,
        route,
        status_code: res.statusCode
      }, duration);
    });

    next();
  };
}

// 数据库监控装饰器
function monitorDbQuery(operation, table) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const start = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        
        dbQueriesTotal.inc({ operation, table });
        dbQueryDuration.observe({ operation, table }, (Date.now() - start) / 1000);
        
        return result;
      } catch (error) {
        dbQueriesTotal.inc({ operation: `${operation}_error`, table });
        throw error;
      }
    };
    
    return descriptor;
  };
}

// 导出指标端点
function metricsEndpoint() {
  return async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  };
}

module.exports = {
  register,
  monitoringMiddleware,
  monitorDbQuery,
  metricsEndpoint,
  metrics: {
    httpRequestsTotal,
    httpRequestDuration,
    dbQueriesTotal,
    dbQueryDuration,
    activeUsers,
    ordersTotal
  }
};
```

### 应用程序集成

```javascript
// app.js
const express = require('express');
const { monitoringMiddleware, metricsEndpoint } = require('./middleware/metrics');
const healthRouter = require('./routes/health');

const app = express();

// 监控中间件
app.use(monitoringMiddleware());

// 健康检查路由
app.use('/health', healthRouter);

// 指标端点
app.get('/metrics', metricsEndpoint());

// 业务路由
app.use('/api', require('./routes/api'));

// 错误处理
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // 记录错误指标
  metrics.httpRequestsTotal.inc({
    method: req.method,
    route: req.route?.path || req.url,
    status_code: 500
  });
  
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## 📊 关键指标定义

### 系统指标

```javascript
// system-metrics.js
const os = require('os');
const fs = require('fs').promises;
const { metrics } = require('./metrics');

class SystemMetrics {
  constructor() {
    this.startTime = Date.now();
    this.collectInterval = null;
  }

  start(interval = 10000) {
    this.collectInterval = setInterval(() => {
      this.collectMetrics();
    }, interval);
  }

  stop() {
    if (this.collectInterval) {
      clearInterval(this.collectInterval);
    }
  }

  async collectMetrics() {
    try {
      // 内存指标
      const memUsage = process.memoryUsage();
      metrics.memoryUsage.set(memUsage.rss);
      metrics.heapUsed.set(memUsage.heapUsed);
      metrics.heapTotal.set(memUsage.heapTotal);
      metrics.external.set(memUsage.external);

      // CPU指标
      const cpuUsage = process.cpuUsage();
      metrics.cpuUser.set(cpuUsage.user);
      metrics.cpuSystem.set(cpuUsage.system);

      // 系统负载
      const loadAvg = os.loadavg();
      metrics.systemLoad1.set(loadAvg[0]);
      metrics.systemLoad5.set(loadAvg[1]);
      metrics.systemLoad15.set(loadAvg[2]);

      // 运行时间
      metrics.uptime.set(Date.now() - this.startTime);

      // 文件描述符
      try {
        const fdCount = await this.getFileDescriptorCount();
        metrics.openFileDescriptors.set(fdCount);
      } catch (error) {
        console.warn('Failed to get file descriptor count:', error.message);
      }

      // 事件循环延迟
      const start = process.hrtime();
      setImmediate(() => {
        const delta = process.hrtime(start);
        const nanosec = delta[0] * 1e9 + delta[1];
        const millisec = nanosec / 1e6;
        metrics.eventLoopLag.set(millisec);
      });

    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  async getFileDescriptorCount() {
    try {
      const fdDir = await fs.readdir(`/proc/${process.pid}/fd`);
      return fdDir.length;
    } catch (error) {
      // Fallback for non-Linux systems
      return -1;
    }
  }
}

module.exports = SystemMetrics;
```

### 业务指标

```javascript
// business-metrics.js
const { metrics } = require('./metrics');

class BusinessMetrics {
  constructor() {
    this.userSessions = new Map();
  }

  // 用户登录
  userLogin(userId) {
    this.userSessions.set(userId, Date.now());
    metrics.activeUsers.set(this.userSessions.size);
    metrics.userLogins.inc();
  }

  // 用户登出
  userLogout(userId) {
    if (this.userSessions.has(userId)) {
      const loginTime = this.userSessions.get(userId);
      const sessionDuration = (Date.now() - loginTime) / 1000;
      
      metrics.sessionDuration.observe(sessionDuration);
      this.userSessions.delete(userId);
      metrics.activeUsers.set(this.userSessions.size);
    }
  }

  // 订单创建
  orderCreated(orderId, amount, userId) {
    metrics.ordersTotal.inc({ status: 'created' });
    metrics.orderValue.observe(amount);
    
    console.log(`Order created: ${orderId}, Amount: ${amount}, User: ${userId}`);
  }

  // 订单完成
  orderCompleted(orderId, amount) {
    metrics.ordersTotal.inc({ status: 'completed' });
    metrics.revenue.inc(amount);
    
    console.log(`Order completed: ${orderId}, Revenue: ${amount}`);
  }

  // 订单取消
  orderCancelled(orderId, reason) {
    metrics.ordersTotal.inc({ status: 'cancelled' });
    metrics.orderCancellations.inc({ reason });
    
    console.log(`Order cancelled: ${orderId}, Reason: ${reason}`);
  }

  // API调用
  apiCall(endpoint, method, duration, statusCode) {
    metrics.apiCalls.inc({
      endpoint,
      method,
      status: statusCode
    });
    
    metrics.apiDuration.observe({
      endpoint,
      method
    }, duration);
  }

  // 错误追踪
  trackError(error, context = {}) {
    metrics.errors.inc({
      type: error.name,
      module: context.module || 'unknown'
    });
    
    console.error('Error tracked:', {
      error: error.message,
      stack: error.stack,
      context
    });
  }

  // 清理过期会话
  cleanupSessions(maxAge = 24 * 60 * 60 * 1000) { // 24小时
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [userId, loginTime] of this.userSessions.entries()) {
      if (now - loginTime > maxAge) {
        this.userSessions.delete(userId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      metrics.activeUsers.set(this.userSessions.size);
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
    }
  }
}

module.exports = BusinessMetrics;
```

## 🚨 告警配置

### 告警规则定义

```javascript
// alerting.js
const nodemailer = require('nodemailer');
const { Webhook } = require('discord-webhook-node');

class AlertManager {
  constructor(config) {
    this.config = config;
    this.alerts = new Map();
    this.emailTransporter = this.setupEmail();
    this.discordWebhook = new Webhook(config.discord?.webhookUrl);
  }

  setupEmail() {
    if (!this.config.email) return null;
    
    return nodemailer.createTransporter({
      host: this.config.email.host,
      port: this.config.email.port,
      secure: this.config.email.secure,
      auth: {
        user: this.config.email.user,
        pass: this.config.email.password
      }
    });
  }

  // 定义告警规则
  defineAlerts() {
    return [
      {
        name: 'high_error_rate',
        condition: (metrics) => {
          const errorRate = this.calculateErrorRate(metrics);
          return errorRate > 0.05; // 5%错误率
        },
        severity: 'warning',
        message: 'High error rate detected',
        cooldown: 5 * 60 * 1000 // 5分钟冷却
      },
      {
        name: 'high_response_time',
        condition: (metrics) => {
          const avgResponseTime = this.getAverageResponseTime(metrics);
          return avgResponseTime > 1000; // 1秒
        },
        severity: 'warning',
        message: 'High response time detected',
        cooldown: 5 * 60 * 1000
      },
      {
        name: 'high_memory_usage',
        condition: () => {
          const memUsage = process.memoryUsage();
          const usagePercent = memUsage.rss / (1024 * 1024 * 1024); // GB
          return usagePercent > 1; // 1GB
        },
        severity: 'critical',
        message: 'High memory usage detected',
        cooldown: 10 * 60 * 1000 // 10分钟冷却
      },
      {
        name: 'service_down',
        condition: () => {
          // 检查关键服务是否可用
          return !this.isServiceHealthy();
        },
        severity: 'critical',
        message: 'Service is down',
        cooldown: 1 * 60 * 1000 // 1分钟冷却
      }
    ];
  }

  async checkAlerts(metrics) {
    const alerts = this.defineAlerts();
    const now = Date.now();

    for (const alert of alerts) {
      const lastTriggered = this.alerts.get(alert.name) || 0;
      
      // 检查冷却时间
      if (now - lastTriggered < alert.cooldown) {
        continue;
      }

      try {
        if (alert.condition(metrics)) {
          await this.triggerAlert(alert);
          this.alerts.set(alert.name, now);
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.name}:`, error);
      }
    }
  }

  async triggerAlert(alert) {
    console.warn(`🚨 ALERT: ${alert.name} - ${alert.message}`);

    const alertData = {
      name: alert.name,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date().toISOString(),
      hostname: require('os').hostname(),
      environment: process.env.NODE_ENV || 'development'
    };

    // 发送邮件告警
    if (this.emailTransporter && this.config.email?.recipients) {
      await this.sendEmailAlert(alertData);
    }

    // 发送Discord告警
    if (this.config.discord?.enabled) {
      await this.sendDiscordAlert(alertData);
    }

    // 发送Slack告警
    if (this.config.slack?.enabled) {
      await this.sendSlackAlert(alertData);
    }
  }

  async sendEmailAlert(alert) {
    try {
      const subject = `🚨 Alert: ${alert.name} [${alert.severity.toUpperCase()}]`;
      const html = `
        <h2>Alert Triggered</h2>
        <p><strong>Name:</strong> ${alert.name}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${alert.timestamp}</p>
        <p><strong>Host:</strong> ${alert.hostname}</p>
        <p><strong>Environment:</strong> ${alert.environment}</p>
      `;

      await this.emailTransporter.sendMail({
        from: this.config.email.from,
        to: this.config.email.recipients,
        subject,
        html
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  async sendDiscordAlert(alert) {
    try {
      const color = alert.severity === 'critical' ? 0xFF0000 : 0xFFA500;
      
      await this.discordWebhook.send({
        embeds: [{
          title: `🚨 Alert: ${alert.name}`,
          description: alert.message,
          color,
          fields: [
            { name: 'Severity', value: alert.severity, inline: true },
            { name: 'Host', value: alert.hostname, inline: true },
            { name: 'Environment', value: alert.environment, inline: true }
          ],
          timestamp: alert.timestamp
        }]
      });
    } catch (error) {
      console.error('Failed to send Discord alert:', error);
    }
  }

  calculateErrorRate(metrics) {
    // 计算错误率逻辑
    const totalRequests = metrics.httpRequestsTotal || 0;
    const errorRequests = metrics.httpErrorsTotal || 0;
    return totalRequests > 0 ? errorRequests / totalRequests : 0;
  }

  getAverageResponseTime(metrics) {
    // 获取平均响应时间
    return metrics.avgResponseTime || 0;
  }

  isServiceHealthy() {
    // 检查服务健康状态
    return true; // 实际实现中应该检查各种依赖服务
  }
}

module.exports = AlertManager;
```

## 🔧 监控工具集成

### Prometheus集成

```javascript
// prometheus-config.js
const client = require('prom-client');

// 创建自定义指标
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// 导出配置
module.exports = {
  register: client.register,
  httpRequestsTotal,
  httpRequestDuration,
  activeConnections
};
```

### Grafana仪表板配置

```json
{
  "dashboard": {
    "title": "Node.js Application Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes",
            "legendFormat": "RSS Memory"
          },
          {
            "expr": "nodejs_heap_size_used_bytes",
            "legendFormat": "Heap Used"
          }
        ]
      }
    ]
  }
}
```

## 📝 总结

有效的监控系统应该包括：

- **全面的指标收集**：系统、应用和业务指标
- **智能的告警机制**：基于阈值和趋势的告警
- **可视化仪表板**：直观的数据展示
- **日志聚合**：结构化的日志收集和分析
- **性能追踪**：请求链路追踪

监控不仅仅是收集数据，更重要的是从数据中获得洞察，持续改进系统的稳定性和性能。

## 🔗 相关资源

- [Prometheus文档](https://prometheus.io/docs/)
- [Grafana文档](https://grafana.com/docs/)
- [Node.js性能监控](https://nodejs.org/en/docs/guides/simple-profiling/)
- [SRE监控最佳实践](https://sre.google/sre-book/monitoring-distributed-systems/)
