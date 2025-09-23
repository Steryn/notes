# 云原生监控

## 📖 概述

云原生监控是现代应用运维的核心组成部分，通过全面的可观测性（Observability）来确保系统的健康运行。它包括指标监控、日志管理、分布式追踪和告警系统，为运维团队提供完整的系统洞察。

## 🎯 学习目标

- 掌握云原生监控的核心概念
- 学习 Prometheus、Grafana 等监控工具
- 了解日志聚合和分析技术
- 掌握分布式追踪和 APM 实践

## 🏗️ 监控架构

### 1. 三大支柱

```javascript
// 可观测性三大支柱示例
class ObservabilityPillars {
  constructor() {
    this.metrics = new MetricsCollector();
    this.logs = new LogManager();
    this.traces = new TraceCollector();
  }
  
  // 指标收集
  collectMetrics() {
    return {
      // 业务指标
      business: {
        activeUsers: this.getActiveUsers(),
        ordersPerMinute: this.getOrderRate(),
        revenue: this.getRevenue()
      },
      
      // 应用指标
      application: {
        responseTime: this.getResponseTime(),
        errorRate: this.getErrorRate(),
        throughput: this.getThroughput()
      },
      
      // 基础设施指标
      infrastructure: {
        cpuUsage: this.getCPUUsage(),
        memoryUsage: this.getMemoryUsage(),
        diskIO: this.getDiskIO(),
        networkIO: this.getNetworkIO()
      }
    };
  }
  
  // 结构化日志
  generateLogs(level, message, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'nodejs-app',
      version: process.env.APP_VERSION,
      traceId: context.traceId,
      spanId: context.spanId,
      userId: context.userId,
      requestId: context.requestId,
      ...context
    };
  }
  
  // 分布式追踪
  createTrace(operationName, parentSpan = null) {
    return {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      parentSpanId: parentSpan?.spanId,
      operationName,
      startTime: Date.now(),
      tags: {},
      logs: []
    };
  }
}
```

## 📊 Prometheus 监控

### 1. 指标收集

```javascript
// prometheus-metrics.js
const promClient = require('prom-client');

// 创建指标收集器
class PrometheusMetrics {
  constructor() {
    // 启用默认指标
    promClient.collectDefaultMetrics({
      timeout: 10000,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });
    
    this.register = promClient.register;
    this.setupCustomMetrics();
  }
  
  setupCustomMetrics() {
    // HTTP 请求计数器
    this.httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });
    
    // HTTP 请求持续时间
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });
    
    // 活跃连接数
    this.activeConnections = new promClient.Gauge({
      name: 'active_connections',
      help: 'Number of active connections'
    });
    
    // 数据库连接池
    this.dbConnectionPool = new promClient.Gauge({
      name: 'db_connection_pool_size',
      help: 'Database connection pool size',
      labelNames: ['state'] // active, idle, waiting
    });
    
    // 业务指标
    this.businessMetrics = {
      ordersTotal: new promClient.Counter({
        name: 'orders_total',
        help: 'Total number of orders',
        labelNames: ['status']
      }),
      
      revenueTotal: new promClient.Counter({
        name: 'revenue_total',
        help: 'Total revenue in cents'
      }),
      
      activeUsers: new promClient.Gauge({
        name: 'active_users',
        help: 'Number of active users'
      })
    };
    
    // 自定义指标
    this.customMetrics = {
      queueSize: new promClient.Gauge({
        name: 'queue_size',
        help: 'Size of processing queue',
        labelNames: ['queue_name']
      }),
      
      cacheHitRatio: new promClient.Gauge({
        name: 'cache_hit_ratio',
        help: 'Cache hit ratio'
      }),
      
      errorsByType: new promClient.Counter({
        name: 'errors_by_type_total',
        help: 'Total errors by type',
        labelNames: ['error_type', 'service']
      })
    };
  }
  
  // Express 中间件
  createExpressMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const labels = {
          method: req.method,
          route: req.route?.path || req.path,
          status_code: res.statusCode
        };
        
        this.httpRequestsTotal.inc(labels);
        this.httpRequestDuration.observe(labels, duration);
      });
      
      next();
    };
  }
  
  // 更新数据库连接池指标
  updateDbPoolMetrics(pool) {
    this.dbConnectionPool.set({ state: 'active' }, pool.totalCount - pool.idleCount);
    this.dbConnectionPool.set({ state: 'idle' }, pool.idleCount);
    this.dbConnectionPool.set({ state: 'waiting' }, pool.waitingCount);
  }
  
  // 记录业务事件
  recordBusinessEvent(eventType, value = 1, labels = {}) {
    switch (eventType) {
      case 'order_created':
        this.businessMetrics.ordersTotal.inc({ status: 'created' }, value);
        break;
      case 'order_completed':
        this.businessMetrics.ordersTotal.inc({ status: 'completed' }, value);
        break;
      case 'revenue':
        this.businessMetrics.revenueTotal.inc(value);
        break;
      case 'user_login':
        this.businessMetrics.activeUsers.inc();
        break;
      case 'user_logout':
        this.businessMetrics.activeUsers.dec();
        break;
    }
  }
  
  // 记录错误
  recordError(errorType, service = 'nodejs-app') {
    this.customMetrics.errorsByType.inc({ error_type: errorType, service });
  }
  
  // 更新队列大小
  updateQueueSize(queueName, size) {
    this.customMetrics.queueSize.set({ queue_name: queueName }, size);
  }
  
  // 更新缓存命中率
  updateCacheHitRatio(ratio) {
    this.customMetrics.cacheHitRatio.set(ratio);
  }
  
  // 获取所有指标
  getMetrics() {
    return this.register.metrics();
  }
  
  // 清除所有指标
  clearMetrics() {
    this.register.clear();
  }
}

// 使用示例
const metrics = new PrometheusMetrics();

// Express 应用集成
const express = require('express');
const app = express();

// 添加监控中间件
app.use(metrics.createExpressMiddleware());

// 指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await metrics.getMetrics());
});

// 业务逻辑中记录指标
app.post('/orders', async (req, res) => {
  try {
    const order = await createOrder(req.body);
    
    // 记录业务指标
    metrics.recordBusinessEvent('order_created');
    metrics.recordBusinessEvent('revenue', order.amount);
    
    res.json(order);
  } catch (error) {
    metrics.recordError('order_creation_failed');
    res.status(500).json({ error: error.message });
  }
});

// 定期更新指标
setInterval(() => {
  // 更新数据库连接池指标
  if (database.pool) {
    metrics.updateDbPoolMetrics(database.pool);
  }
  
  // 更新队列大小
  metrics.updateQueueSize('processing', getQueueSize('processing'));
  metrics.updateQueueSize('notifications', getQueueSize('notifications'));
  
  // 更新缓存命中率
  metrics.updateCacheHitRatio(cache.getHitRatio());
}, 10000);
```

### 2. Prometheus 配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'production'
    region: 'us-east-1'

rule_files:
  - "alert_rules.yml"
  - "recording_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Node.js 应用
  - job_name: 'nodejs-app'
    static_configs:
      - targets: ['nodejs-app:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s
    scrape_timeout: 3s
    
  # Kubernetes 服务发现
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name

  # 基础设施监控
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

# 告警规则
# alert_rules.yml
groups:
  - name: nodejs-app-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.instance }}"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s for {{ $labels.instance }}"

      - alert: HighMemoryUsage
        expr: (process_resident_memory_bytes / 1024 / 1024) > 1000
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}MB for {{ $labels.instance }}"

      - alert: DatabaseConnectionPoolExhausted
        expr: db_connection_pool_size{state="waiting"} > 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool exhausted"
          description: "{{ $value }} connections are waiting for {{ $labels.instance }}"
```

## 📝 日志管理

### 1. 结构化日志

```javascript
// structured-logging.js
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

class StructuredLogger {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(this.customFormat)
      ),
      defaultMeta: this.getDefaultMeta(),
      transports: this.createTransports()
    });
    
    this.setupErrorHandling();
  }
  
  getDefaultMeta() {
    return {
      service: process.env.SERVICE_NAME || 'nodejs-app',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      hostname: require('os').hostname(),
      pid: process.pid
    };
  }
  
  createTransports() {
    const transports = [
      // 控制台输出
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ];
    
    // 生产环境添加文件日志
    if (process.env.NODE_ENV === 'production') {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 10
        })
      );
      
      // Elasticsearch 集成
      if (process.env.ELASTICSEARCH_URL) {
        transports.push(
          new ElasticsearchTransport({
            level: 'info',
            clientOpts: {
              node: process.env.ELASTICSEARCH_URL,
              auth: {
                username: process.env.ELASTICSEARCH_USER,
                password: process.env.ELASTICSEARCH_PASSWORD
              }
            },
            index: `logs-${process.env.SERVICE_NAME}-${new Date().toISOString().slice(0, 7)}`
          })
        );
      }
    }
    
    return transports;
  }
  
  customFormat(info) {
    const { timestamp, level, message, service, ...meta } = info;
    
    return JSON.stringify({
      '@timestamp': timestamp,
      level: level.toUpperCase(),
      message,
      service,
      ...meta
    });
  }
  
  setupErrorHandling() {
    this.logger.on('error', (error) => {
      console.error('Logger error:', error);
    });
  }
  
  // 创建子日志器
  child(meta) {
    return this.logger.child(meta);
  }
  
  // 日志方法
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }
  
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }
  
  error(message, error = null, meta = {}) {
    this.logger.error(message, {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
  
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
  
  // HTTP 请求日志
  logRequest(req, res, duration) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      requestId: req.requestId
    });
  }
  
  // 业务事件日志
  logBusinessEvent(event, data = {}) {
    this.info('Business Event', {
      eventType: event,
      ...data
    });
  }
  
  // 数据库操作日志
  logDatabaseOperation(operation, table, duration, error = null) {
    if (error) {
      this.error('Database Operation Failed', error, {
        operation,
        table,
        duration
      });
    } else {
      this.debug('Database Operation', {
        operation,
        table,
        duration
      });
    }
  }
  
  // 外部API调用日志
  logExternalApiCall(service, endpoint, method, statusCode, duration, error = null) {
    const logData = {
      externalService: service,
      endpoint,
      method,
      statusCode,
      duration
    };
    
    if (error) {
      this.error('External API Call Failed', error, logData);
    } else {
      this.info('External API Call', logData);
    }
  }
}

// Express 中间件
function createLoggingMiddleware(logger) {
  return (req, res, next) => {
    const start = Date.now();
    
    // 生成请求ID
    req.requestId = require('uuid').v4();
    
    // 创建请求专用日志器
    req.logger = logger.child({
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl
    });
    
    // 记录请求开始
    req.logger.info('Request started');
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.logRequest(req, res, duration);
    });
    
    next();
  };
}

// 全局错误日志
function setupGlobalErrorLogging(logger) {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error, {
      fatal: true
    });
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', reason, {
      promise: promise.toString()
    });
  });
}

// 使用示例
const logger = new StructuredLogger();

// 设置全局错误日志
setupGlobalErrorLogging(logger);

// Express 应用
const app = express();
app.use(createLoggingMiddleware(logger));

// 业务逻辑中使用日志
app.post('/orders', async (req, res) => {
  try {
    req.logger.info('Creating order', { orderData: req.body });
    
    const order = await createOrder(req.body);
    
    req.logger.logBusinessEvent('order_created', {
      orderId: order.id,
      amount: order.amount,
      userId: req.user.id
    });
    
    res.json(order);
  } catch (error) {
    req.logger.error('Order creation failed', error, {
      orderData: req.body,
      userId: req.user?.id
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2. 日志聚合配置

```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/nodejs-app/*.log
  fields:
    service: nodejs-app
    environment: production
  fields_under_root: true
  json.keys_under_root: true
  json.add_error_key: true

- type: docker
  containers.ids:
    - "*"
  containers.path: "/var/lib/docker/containers"
  containers.stream: "stdout"
  processors:
    - add_docker_metadata:
        host: "unix:///var/run/docker.sock"

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  username: "${ELASTICSEARCH_USERNAME}"
  password: "${ELASTICSEARCH_PASSWORD}"
  index: "logs-%{[service]}-%{+yyyy.MM.dd}"

setup.template.settings:
  index.number_of_shards: 1
  index.codec: best_compression

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_kubernetes_metadata:
      host: ${NODE_NAME}
      matchers:
      - logs_path:
          logs_path: "/var/log/containers/"

# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [service] == "nodejs-app" {
    json {
      source => "message"
    }
    
    date {
      match => [ "@timestamp", "ISO8601" ]
    }
    
    if [level] == "ERROR" {
      mutate {
        add_tag => ["error"]
      }
    }
    
    if [error] {
      mutate {
        add_field => { "error_message" => "%{[error][message]}" }
        add_field => { "error_stack" => "%{[error][stack]}" }
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{service}-%{+YYYY.MM.dd}"
  }
  
  if "error" in [tags] {
    slack {
      url => "${SLACK_WEBHOOK_URL}"
      channel => "#alerts"
      username => "LogAlert"
      icon_emoji => ":warning:"
      format => "Error in %{service}: %{message}"
    }
  }
}
```

## 🔍 分布式追踪

### 1. OpenTelemetry 集成

```javascript
// tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

class DistributedTracing {
  constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'nodejs-app';
    this.serviceVersion = process.env.APP_VERSION || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
    
    this.setupTracing();
  }
  
  setupTracing() {
    // 创建 Jaeger 导出器
    const jaegerExporter = new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
    });
    
    // 配置 SDK
    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: this.serviceVersion,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.environment,
      }),
      traceExporter: jaegerExporter,
      instrumentations: [getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // 禁用文件系统追踪
        },
      })],
    });
    
    // 启动 SDK
    sdk.start();
    
    console.log('分布式追踪已初始化');
  }
  
  // 手动创建 span
  createSpan(name, operation, parentSpan = null) {
    const tracer = require('@opentelemetry/api').trace.getTracer(this.serviceName);
    
    const span = tracer.startSpan(name, {
      parent: parentSpan,
      kind: require('@opentelemetry/api').SpanKind.INTERNAL,
      attributes: {
        'operation.name': operation,
        'service.name': this.serviceName,
      }
    });
    
    return span;
  }
  
  // 装饰器模式添加追踪
  traceMethod(operationName) {
    return function(target, propertyName, descriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        const tracer = require('@opentelemetry/api').trace.getTracer('nodejs-app');
        const span = tracer.startSpan(`${target.constructor.name}.${propertyName}`);
        
        try {
          span.setAttributes({
            'operation.name': operationName,
            'method.name': propertyName,
            'class.name': target.constructor.name
          });
          
          const result = await originalMethod.apply(this, args);
          
          span.setStatus({ code: require('@opentelemetry/api').SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.recordException(error);
          span.setStatus({
            code: require('@opentelemetry/api').SpanStatusCode.ERROR,
            message: error.message
          });
          throw error;
        } finally {
          span.end();
        }
      };
      
      return descriptor;
    };
  }
}

// 业务服务追踪
class UserService {
  constructor() {
    this.tracing = new DistributedTracing();
  }
  
  @tracing.traceMethod('user.create')
  async createUser(userData) {
    const span = require('@opentelemetry/api').trace.getActiveSpan();
    
    span?.setAttributes({
      'user.email': userData.email,
      'user.role': userData.role
    });
    
    // 数据库操作会自动被追踪
    const user = await database.users.create(userData);
    
    // 外部API调用
    await this.sendWelcomeEmail(user.email);
    
    return user;
  }
  
  async sendWelcomeEmail(email) {
    const tracer = require('@opentelemetry/api').trace.getTracer('nodejs-app');
    const span = tracer.startSpan('email.send_welcome');
    
    try {
      span.setAttributes({
        'email.recipient': email,
        'email.type': 'welcome'
      });
      
      // 外部服务调用
      const response = await fetch('https://email-service.com/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, template: 'welcome' })
      });
      
      span.setAttributes({
        'http.status_code': response.status,
        'email.sent': response.ok
      });
      
      if (!response.ok) {
        throw new Error(`Email service error: ${response.status}`);
      }
      
    } catch (error) {
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }
}

// Express 中间件追踪
function createTracingMiddleware() {
  return (req, res, next) => {
    const tracer = require('@opentelemetry/api').trace.getTracer('nodejs-app');
    const span = tracer.startSpan(`${req.method} ${req.route?.path || req.path}`);
    
    span.setAttributes({
      'http.method': req.method,
      'http.url': req.url,
      'http.route': req.route?.path,
      'user.id': req.user?.id,
      'request.id': req.requestId
    });
    
    // 将 span 添加到请求对象
    req.span = span;
    
    res.on('finish', () => {
      span.setAttributes({
        'http.status_code': res.statusCode,
        'http.response.size': res.get('content-length') || 0
      });
      
      if (res.statusCode >= 400) {
        span.setStatus({
          code: require('@opentelemetry/api').SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`
        });
      }
      
      span.end();
    });
    
    next();
  };
}
```

### 2. 自定义追踪

```javascript
// custom-tracing.js
class CustomTracing {
  constructor() {
    this.activeSpans = new Map();
  }
  
  // 开始业务操作追踪
  startBusinessOperation(operationName, context = {}) {
    const tracer = require('@opentelemetry/api').trace.getTracer('nodejs-app');
    const span = tracer.startSpan(operationName);
    
    span.setAttributes({
      'business.operation': operationName,
      ...context
    });
    
    const operationId = require('uuid').v4();
    this.activeSpans.set(operationId, span);
    
    return operationId;
  }
  
  // 添加业务事件
  addBusinessEvent(operationId, eventName, data = {}) {
    const span = this.activeSpans.get(operationId);
    if (span) {
      span.addEvent(eventName, {
        timestamp: Date.now(),
        ...data
      });
    }
  }
  
  // 结束业务操作
  endBusinessOperation(operationId, success = true, error = null) {
    const span = this.activeSpans.get(operationId);
    if (span) {
      if (success) {
        span.setStatus({ code: require('@opentelemetry/api').SpanStatusCode.OK });
      } else {
        span.setStatus({
          code: require('@opentelemetry/api').SpanStatusCode.ERROR,
          message: error?.message || 'Operation failed'
        });
        
        if (error) {
          span.recordException(error);
        }
      }
      
      span.end();
      this.activeSpans.delete(operationId);
    }
  }
  
  // 数据库操作追踪
  async traceDbOperation(operation, table, query, params = []) {
    const tracer = require('@opentelemetry/api').trace.getTracer('nodejs-app');
    const span = tracer.startSpan(`db.${operation}`);
    
    span.setAttributes({
      'db.system': 'postgresql',
      'db.operation': operation,
      'db.table': table,
      'db.statement': query
    });
    
    const startTime = Date.now();
    
    try {
      const result = await database.query(query, params);
      
      span.setAttributes({
        'db.rows_affected': result.rowCount || 0,
        'db.duration': Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({
        code: require('@opentelemetry/api').SpanStatusCode.ERROR,
        message: error.message
      });
      throw error;
    } finally {
      span.end();
    }
  }
  
  // 缓存操作追踪
  async traceCacheOperation(operation, key, value = null) {
    const tracer = require('@opentelemetry/api').trace.getTracer('nodejs-app');
    const span = tracer.startSpan(`cache.${operation}`);
    
    span.setAttributes({
      'cache.operation': operation,
      'cache.key': key,
      'cache.system': 'redis'
    });
    
    try {
      let result;
      switch (operation) {
        case 'get':
          result = await redis.get(key);
          span.setAttributes({
            'cache.hit': result !== null
          });
          break;
        case 'set':
          result = await redis.set(key, value);
          break;
        case 'del':
          result = await redis.del(key);
          break;
      }
      
      return result;
    } catch (error) {
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }
}

// 使用示例
const customTracing = new CustomTracing();

app.post('/orders', async (req, res) => {
  const operationId = customTracing.startBusinessOperation('create_order', {
    'user.id': req.user.id,
    'order.type': req.body.type
  });
  
  try {
    // 验证订单数据
    customTracing.addBusinessEvent(operationId, 'validation_started');
    const validatedData = await validateOrderData(req.body);
    customTracing.addBusinessEvent(operationId, 'validation_completed');
    
    // 检查库存
    customTracing.addBusinessEvent(operationId, 'inventory_check_started');
    const inventoryCheck = await customTracing.traceDbOperation(
      'select', 'inventory', 
      'SELECT quantity FROM inventory WHERE product_id = $1',
      [validatedData.productId]
    );
    customTracing.addBusinessEvent(operationId, 'inventory_check_completed');
    
    // 创建订单
    customTracing.addBusinessEvent(operationId, 'order_creation_started');
    const order = await customTracing.traceDbOperation(
      'insert', 'orders',
      'INSERT INTO orders (user_id, product_id, quantity, amount) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, validatedData.productId, validatedData.quantity, validatedData.amount]
    );
    customTracing.addBusinessEvent(operationId, 'order_creation_completed');
    
    // 更新缓存
    await customTracing.traceCacheOperation('set', `order:${order.id}`, JSON.stringify(order));
    
    customTracing.endBusinessOperation(operationId, true);
    res.json(order);
    
  } catch (error) {
    customTracing.endBusinessOperation(operationId, false, error);
    res.status(500).json({ error: error.message });
  }
});
```

## 🚨 告警系统

### 1. Alertmanager 配置

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@company.com'
  smtp_auth_username: 'alerts@company.com'
  smtp_auth_password: 'password'

route:
  group_by: ['alertname', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 10s
      repeat_interval: 1h
    
    - match:
        severity: warning
      receiver: 'warning-alerts'
      repeat_interval: 6h

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@company.com'
        subject: '{{ .GroupLabels.alertname }} - {{ .Status }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Service: {{ .Labels.service }}
          Instance: {{ .Labels.instance }}
          {{ end }}

  - name: 'critical-alerts'
    email_configs:
      - to: 'oncall@company.com'
        subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#critical-alerts'
        title: 'Critical Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    webhook_configs:
      - url: 'https://api.pagerduty.com/integration/...'

  - name: 'warning-alerts'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#alerts'
        title: 'Warning Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'service', 'instance']
```

### 2. 自定义告警

```javascript
// alerting.js
class AlertingSystem {
  constructor() {
    this.alertChannels = {
      slack: this.createSlackChannel(),
      email: this.createEmailChannel(),
      webhook: this.createWebhookChannel()
    };
    
    this.alertRules = new Map();
    this.setupAlertRules();
  }
  
  setupAlertRules() {
    // 错误率告警
    this.alertRules.set('high_error_rate', {
      condition: (metrics) => metrics.errorRate > 0.05,
      severity: 'critical',
      message: (metrics) => `错误率过高: ${(metrics.errorRate * 100).toFixed(2)}%`,
      cooldown: 300000 // 5分钟冷却
    });
    
    // 响应时间告警
    this.alertRules.set('high_response_time', {
      condition: (metrics) => metrics.avgResponseTime > 2000,
      severity: 'warning',
      message: (metrics) => `平均响应时间过高: ${metrics.avgResponseTime}ms`,
      cooldown: 600000 // 10分钟冷却
    });
    
    // 内存使用告警
    this.alertRules.set('high_memory_usage', {
      condition: (metrics) => metrics.memoryUsage > 0.9,
      severity: 'warning',
      message: (metrics) => `内存使用率过高: ${(metrics.memoryUsage * 100).toFixed(2)}%`,
      cooldown: 900000 // 15分钟冷却
    });
    
    // 数据库连接池告警
    this.alertRules.set('db_pool_exhausted', {
      condition: (metrics) => metrics.dbPoolWaiting > 0,
      severity: 'critical',
      message: (metrics) => `数据库连接池耗尽: ${metrics.dbPoolWaiting} 个连接等待`,
      cooldown: 60000 // 1分钟冷却
    });
  }
  
  createSlackChannel() {
    const { WebClient } = require('@slack/web-api');
    return new WebClient(process.env.SLACK_TOKEN);
  }
  
  createEmailChannel() {
    const nodemailer = require('nodemailer');
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  createWebhookChannel() {
    return {
      send: async (url, data) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return response.ok;
      }
    };
  }
  
  async checkAlerts(metrics) {
    const currentTime = Date.now();
    
    for (const [ruleName, rule] of this.alertRules) {
      const lastAlert = this.getLastAlertTime(ruleName);
      
      // 检查冷却时间
      if (lastAlert && (currentTime - lastAlert) < rule.cooldown) {
        continue;
      }
      
      // 检查告警条件
      if (rule.condition(metrics)) {
        await this.triggerAlert(ruleName, rule, metrics);
        this.setLastAlertTime(ruleName, currentTime);
      }
    }
  }
  
  async triggerAlert(ruleName, rule, metrics) {
    const alert = {
      name: ruleName,
      severity: rule.severity,
      message: rule.message(metrics),
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME || 'nodejs-app',
      instance: require('os').hostname(),
      metrics: metrics
    };
    
    console.log(`触发告警: ${alert.name} - ${alert.message}`);
    
    // 发送到不同渠道
    await Promise.all([
      this.sendSlackAlert(alert),
      this.sendEmailAlert(alert),
      this.sendWebhookAlert(alert)
    ]);
  }
  
  async sendSlackAlert(alert) {
    if (!this.alertChannels.slack) return;
    
    const color = alert.severity === 'critical' ? 'danger' : 'warning';
    const channel = alert.severity === 'critical' ? '#critical-alerts' : '#alerts';
    
    try {
      await this.alertChannels.slack.chat.postMessage({
        channel: channel,
        attachments: [{
          color: color,
          title: `${alert.severity.toUpperCase()}: ${alert.name}`,
          text: alert.message,
          fields: [
            { title: 'Service', value: alert.service, short: true },
            { title: 'Instance', value: alert.instance, short: true },
            { title: 'Time', value: alert.timestamp, short: true }
          ]
        }]
      });
    } catch (error) {
      console.error('Slack 告警发送失败:', error);
    }
  }
  
  async sendEmailAlert(alert) {
    if (!this.alertChannels.email) return;
    
    const recipients = alert.severity === 'critical' 
      ? process.env.CRITICAL_ALERT_EMAILS?.split(',')
      : process.env.ALERT_EMAILS?.split(',');
    
    if (!recipients) return;
    
    try {
      await this.alertChannels.email.sendMail({
        from: process.env.EMAIL_FROM,
        to: recipients.join(','),
        subject: `${alert.severity.toUpperCase()}: ${alert.name}`,
        html: `
          <h2>${alert.message}</h2>
          <p><strong>Service:</strong> ${alert.service}</p>
          <p><strong>Instance:</strong> ${alert.instance}</p>
          <p><strong>Time:</strong> ${alert.timestamp}</p>
          <p><strong>Metrics:</strong></p>
          <pre>${JSON.stringify(alert.metrics, null, 2)}</pre>
        `
      });
    } catch (error) {
      console.error('邮件告警发送失败:', error);
    }
  }
  
  async sendWebhookAlert(alert) {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) return;
    
    try {
      await this.alertChannels.webhook.send(webhookUrl, alert);
    } catch (error) {
      console.error('Webhook 告警发送失败:', error);
    }
  }
  
  getLastAlertTime(ruleName) {
    // 实际应用中应该使用持久化存储
    return this.lastAlertTimes?.get(ruleName);
  }
  
  setLastAlertTime(ruleName, time) {
    if (!this.lastAlertTimes) {
      this.lastAlertTimes = new Map();
    }
    this.lastAlertTimes.set(ruleName, time);
  }
}

// 使用示例
const alerting = new AlertingSystem();

// 定期检查告警
setInterval(async () => {
  const metrics = await collectMetrics();
  await alerting.checkAlerts(metrics);
}, 30000); // 每30秒检查一次

async function collectMetrics() {
  return {
    errorRate: await calculateErrorRate(),
    avgResponseTime: await calculateAvgResponseTime(),
    memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
    dbPoolWaiting: await getDbPoolWaitingCount(),
    activeConnections: getActiveConnectionCount()
  };
}
```

## 📚 最佳实践总结

1. **全面覆盖**：实现指标、日志、追踪的完整监控
2. **标准化**：使用标准格式和命名规范
3. **自动化**：自动化告警和响应流程
4. **可视化**：构建直观的监控仪表板
5. **性能考虑**：监控系统本身不应影响应用性能
6. **数据保留**：合理设置数据保留策略
7. **安全性**：保护监控数据的安全性
8. **文档化**：维护监控系统的文档和运维手册

通过掌握这些云原生监控技术，您将能够构建完整的可观测性体系，确保系统的稳定运行。
