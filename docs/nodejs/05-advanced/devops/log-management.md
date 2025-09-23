# 日志管理

## 📋 概述

日志管理是现代应用运维的重要组成部分，包括日志收集、存储、分析和监控。有效的日志管理能够帮助快速定位问题、分析性能和监控系统健康状态。

## 🎯 学习目标

- 理解日志管理的核心概念和重要性
- 掌握Node.js应用的日志记录最佳实践
- 学会配置集中化日志收集系统
- 了解日志分析和可视化工具

## 📚 日志管理基础

### 日志级别

```javascript
const LOG_LEVELS = {
  ERROR: 0,    // 错误信息
  WARN: 1,     // 警告信息
  INFO: 2,     // 一般信息
  HTTP: 3,     // HTTP请求日志
  VERBOSE: 4,  // 详细信息
  DEBUG: 5,    // 调试信息
  SILLY: 6     // 最详细信息
};
```

### 日志格式标准

```javascript
// 结构化日志格式
const logEntry = {
  timestamp: '2023-12-07T10:30:00.000Z',
  level: 'info',
  message: 'User login successful',
  service: 'auth-service',
  version: '1.2.0',
  traceId: 'abc123-def456-ghi789',
  userId: 'user_12345',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  duration: 150,
  statusCode: 200,
  method: 'POST',
  url: '/api/auth/login',
  metadata: {
    sessionId: 'sess_789xyz',
    feature: 'authentication'
  }
};
```

## 🛠 Node.js日志实现

### Winston日志库配置

```javascript
// logger.js
const winston = require('winston');
const path = require('path');

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, traceId, ...meta }) => {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: service || 'nodejs-app',
      message,
      traceId,
      ...meta
    };
    return JSON.stringify(logEntry);
  })
);

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'nodejs-app',
    version: process.env.APP_VERSION || '1.0.0',
    hostname: require('os').hostname(),
    pid: process.pid
  },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : logFormat
    }),
    
    // 文件输出 - 所有日志
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'app.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // 文件输出 - 错误日志
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // HTTP传输 - 发送到日志收集系统
    new winston.transports.Http({
      host: process.env.LOG_SERVER_HOST,
      port: process.env.LOG_SERVER_PORT,
      path: '/logs',
      ssl: process.env.LOG_SERVER_SSL === 'true'
    })
  ],
  
  // 异常处理
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'exceptions.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ],
  
  // 拒绝处理
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'rejections.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ]
});

// 生产环境不输出到控制台
if (process.env.NODE_ENV === 'production') {
  logger.remove(winston.transports.Console);
}

module.exports = logger;
```

### 请求日志中间件

```javascript
// middleware/request-logger.js
const logger = require('../logger');
const { v4: uuidv4 } = require('uuid');

function requestLogger() {
  return (req, res, next) => {
    const startTime = Date.now();
    const traceId = uuidv4();
    
    // 添加traceId到请求对象
    req.traceId = traceId;
    
    // 记录请求开始
    logger.info('Request started', {
      traceId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      headers: filterSensitiveHeaders(req.headers),
      query: req.query,
      body: filterSensitiveData(req.body)
    });
    
    // 监听响应结束
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      
      logger.log(logLevel, 'Request completed', {
        traceId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('Content-Length') || 0,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      });
    });
    
    next();
  };
}

function filterSensitiveHeaders(headers) {
  const filtered = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  
  sensitiveHeaders.forEach(header => {
    if (filtered[header]) {
      filtered[header] = '[REDACTED]';
    }
  });
  
  return filtered;
}

function filterSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const filtered = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  
  Object.keys(filtered).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      filtered[key] = '[REDACTED]';
    }
  });
  
  return filtered;
}

module.exports = requestLogger;
```

### 错误日志处理

```javascript
// middleware/error-logger.js
const logger = require('../logger');

function errorLogger() {
  return (err, req, res, next) => {
    // 记录错误详情
    logger.error('Application error', {
      traceId: req.traceId,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query
      },
      user: {
        id: req.user?.id,
        email: req.user?.email
      },
      session: {
        id: req.sessionID
      }
    });
    
    // 继续错误处理流程
    next(err);
  };
}

module.exports = errorLogger;
```

### 业务日志记录

```javascript
// services/user-service.js
const logger = require('../logger');

class UserService {
  async createUser(userData, traceId) {
    try {
      logger.info('Creating new user', {
        traceId,
        operation: 'user_creation',
        email: userData.email,
        role: userData.role
      });
      
      // 用户创建逻辑
      const user = await User.create(userData);
      
      logger.info('User created successfully', {
        traceId,
        operation: 'user_creation',
        userId: user.id,
        email: user.email,
        duration: Date.now() - startTime
      });
      
      return user;
    } catch (error) {
      logger.error('Failed to create user', {
        traceId,
        operation: 'user_creation',
        error: {
          name: error.name,
          message: error.message,
          code: error.code
        },
        userData: {
          email: userData.email,
          role: userData.role
        }
      });
      
      throw error;
    }
  }
  
  async loginUser(email, password, traceId) {
    const startTime = Date.now();
    
    try {
      logger.info('User login attempt', {
        traceId,
        operation: 'user_login',
        email
      });
      
      const user = await User.findByEmail(email);
      if (!user) {
        logger.warn('Login failed - user not found', {
          traceId,
          operation: 'user_login',
          email,
          reason: 'user_not_found'
        });
        throw new Error('Invalid credentials');
      }
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        logger.warn('Login failed - invalid password', {
          traceId,
          operation: 'user_login',
          userId: user.id,
          email,
          reason: 'invalid_password'
        });
        throw new Error('Invalid credentials');
      }
      
      logger.info('User login successful', {
        traceId,
        operation: 'user_login',
        userId: user.id,
        email,
        duration: Date.now() - startTime
      });
      
      return user;
    } catch (error) {
      logger.error('Login error', {
        traceId,
        operation: 'user_login',
        email,
        error: {
          name: error.name,
          message: error.message
        },
        duration: Date.now() - startTime
      });
      
      throw error;
    }
  }
}

module.exports = UserService;
```

## 📊 日志收集系统

### ELK Stack配置

#### Elasticsearch配置

```yaml
# docker-compose.yml - Elasticsearch
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    container_name: elasticsearch
    environment:
      - node.name=elasticsearch
      - cluster.name=nodejs-logs
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
      - xpack.security.enabled=false
      - xpack.security.enrollment.enabled=false
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    networks:
      - elk-network

  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.0
    container_name: logstash
    volumes:
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5044:5044"
      - "5000:5000/tcp"
      - "5000:5000/udp"
      - "9600:9600"
    environment:
      LS_JAVA_OPTS: "-Xmx512m -Xms512m"
    networks:
      - elk-network
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_URL: http://elasticsearch:9200
      ELASTICSEARCH_HOSTS: '["http://elasticsearch:9200"]'
    networks:
      - elk-network
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:

networks:
  elk-network:
    driver: bridge
```

#### Logstash配置

```ruby
# logstash/pipeline/nodejs-logs.conf
input {
  # 从文件读取日志
  file {
    path => "/var/log/nodejs/*.log"
    start_position => "beginning"
    codec => "json"
    tags => ["nodejs", "file"]
  }
  
  # 从HTTP接收日志
  http {
    port => 5000
    codec => "json"
    tags => ["nodejs", "http"]
  }
  
  # 从Beats接收日志
  beats {
    port => 5044
    tags => ["nodejs", "beats"]
  }
}

filter {
  # 解析时间戳
  date {
    match => [ "timestamp", "yyyy-MM-dd HH:mm:ss.SSS" ]
    target => "@timestamp"
  }
  
  # 解析日志级别
  if [level] {
    mutate {
      uppercase => [ "level" ]
    }
  }
  
  # 解析HTTP请求日志
  if [method] and [url] {
    mutate {
      add_field => { "log_type" => "http_request" }
    }
    
    # 提取URL路径
    grok {
      match => { "url" => "(?<path>[^?]+)" }
    }
  }
  
  # 解析错误日志
  if [level] == "ERROR" {
    mutate {
      add_field => { "log_type" => "error" }
    }
  }
  
  # 地理位置解析（如果有IP）
  if [ip] {
    geoip {
      source => "ip"
      target => "geoip"
    }
  }
  
  # 用户代理解析
  if [userAgent] {
    useragent {
      source => "userAgent"
      target => "ua"
    }
  }
  
  # 添加环境标识
  mutate {
    add_field => { "environment" => "${ENVIRONMENT:unknown}" }
  }
}

output {
  # 输出到Elasticsearch
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "nodejs-logs-%{+YYYY.MM.dd}"
    template_name => "nodejs-logs"
    template => "/usr/share/logstash/templates/nodejs-logs.json"
    template_overwrite => true
  }
  
  # 调试输出（开发环境）
  if [@metadata][debug] {
    stdout {
      codec => rubydebug
    }
  }
}
```

#### Kibana仪表板配置

```json
{
  "version": "8.10.0",
  "objects": [
    {
      "id": "nodejs-logs-dashboard",
      "type": "dashboard",
      "attributes": {
        "title": "Node.js Application Logs",
        "hits": 0,
        "description": "Dashboard for Node.js application logs",
        "panelsJSON": "[{\"version\":\"8.10.0\",\"gridData\":{\"x\":0,\"y\":0,\"w\":24,\"h\":15,\"i\":\"1\"},\"panelIndex\":\"1\",\"embeddableConfig\":{},\"panelRefName\":\"panel_1\"}]",
        "optionsJSON": "{\"useMargins\":true,\"syncColors\":false,\"hidePanelTitles\":false}",
        "uiStateJSON": "{}",
        "timeRestore": false,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"query\":{\"match_all\":{}},\"filter\":[]}"
        }
      }
    },
    {
      "id": "nodejs-logs-index-pattern",
      "type": "index-pattern",
      "attributes": {
        "title": "nodejs-logs-*",
        "timeFieldName": "@timestamp",
        "fields": "[{\"name\":\"@timestamp\",\"type\":\"date\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"level\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"message\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":false},{\"name\":\"service\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"traceId\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true}]"
      }
    }
  ]
}
```

### Fluentd配置

```ruby
# fluentd.conf
<source>
  @type tail
  path /var/log/nodejs/*.log
  pos_file /var/log/fluentd/nodejs.log.pos
  tag nodejs.app
  format json
  time_key timestamp
  time_format %Y-%m-%d %H:%M:%S.%L
</source>

<source>
  @type http
  port 9880
  bind 0.0.0.0
  tag nodejs.http
</source>

<filter nodejs.**>
  @type record_transformer
  <record>
    hostname ${hostname}
    environment #{ENV['ENVIRONMENT']}
  </record>
</filter>

<filter nodejs.**>
  @type grep
  <exclude>
    key message
    pattern /health/
  </exclude>
</filter>

<match nodejs.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name nodejs-logs
  type_name _doc
  logstash_format true
  logstash_prefix nodejs-logs
  logstash_dateformat %Y.%m.%d
  include_tag_key true
  tag_key @log_name
  flush_interval 5s
</match>
```

## 🔍 日志分析和监控

### 日志分析查询

```javascript
// 日志分析API
const { Client } = require('@elastic/elasticsearch');

class LogAnalyzer {
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });
  }
  
  // 错误率分析
  async getErrorRate(timeRange = '1h') {
    const query = {
      index: 'nodejs-logs-*',
      body: {
        size: 0,
        query: {
          bool: {
            filter: [
              {
                range: {
                  '@timestamp': {
                    gte: `now-${timeRange}`
                  }
                }
              }
            ]
          }
        },
        aggs: {
          error_rate: {
            terms: {
              field: 'level.keyword'
            }
          }
        }
      }
    };
    
    const response = await this.client.search(query);
    return this.calculateErrorRate(response.body.aggregations.error_rate.buckets);
  }
  
  // 响应时间分析
  async getResponseTimeStats(timeRange = '1h') {
    const query = {
      index: 'nodejs-logs-*',
      body: {
        size: 0,
        query: {
          bool: {
            filter: [
              {
                range: {
                  '@timestamp': {
                    gte: `now-${timeRange}`
                  }
                }
              },
              {
                exists: {
                  field: 'duration'
                }
              }
            ]
          }
        },
        aggs: {
          response_time_stats: {
            stats: {
              field: 'duration'
            }
          },
          response_time_percentiles: {
            percentiles: {
              field: 'duration',
              percents: [50, 90, 95, 99]
            }
          }
        }
      }
    };
    
    const response = await this.client.search(query);
    return {
      stats: response.body.aggregations.response_time_stats,
      percentiles: response.body.aggregations.response_time_percentiles.values
    };
  }
  
  // 热门API端点
  async getTopEndpoints(timeRange = '1h', size = 10) {
    const query = {
      index: 'nodejs-logs-*',
      body: {
        size: 0,
        query: {
          bool: {
            filter: [
              {
                range: {
                  '@timestamp': {
                    gte: `now-${timeRange}`
                  }
                }
              },
              {
                exists: {
                  field: 'url'
                }
              }
            ]
          }
        },
        aggs: {
          top_endpoints: {
            terms: {
              field: 'url.keyword',
              size: size
            },
            aggs: {
              avg_response_time: {
                avg: {
                  field: 'duration'
                }
              },
              error_rate: {
                filter: {
                  range: {
                    statusCode: {
                      gte: 400
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    
    const response = await this.client.search(query);
    return response.body.aggregations.top_endpoints.buckets;
  }
  
  // 用户活动分析
  async getUserActivity(userId, timeRange = '24h') {
    const query = {
      index: 'nodejs-logs-*',
      body: {
        size: 100,
        query: {
          bool: {
            filter: [
              {
                range: {
                  '@timestamp': {
                    gte: `now-${timeRange}`
                  }
                }
              },
              {
                term: {
                  'userId.keyword': userId
                }
              }
            ]
          }
        },
        sort: [
          {
            '@timestamp': {
              order: 'desc'
            }
          }
        ]
      }
    };
    
    const response = await this.client.search(query);
    return response.body.hits.hits.map(hit => hit._source);
  }
  
  calculateErrorRate(buckets) {
    const total = buckets.reduce((sum, bucket) => sum + bucket.doc_count, 0);
    const errors = buckets
      .filter(bucket => bucket.key === 'ERROR')
      .reduce((sum, bucket) => sum + bucket.doc_count, 0);
    
    return {
      total,
      errors,
      errorRate: total > 0 ? (errors / total) * 100 : 0
    };
  }
}

module.exports = LogAnalyzer;
```

### 日志告警配置

```yaml
# elastalert/rules/nodejs-error-rate.yml
name: High Error Rate Alert
type: percentage_match
index: nodejs-logs-*
timeframe:
  minutes: 10
buffer_time:
  minutes: 2

query_key: service.keyword
percentage_format_string: "{:.1%}"

match_bucket_filter:
  terms:
    level.keyword: ["ERROR", "FATAL"]

min_denominator: 50
max_percentage: 5

alert:
  - "email"
  - "slack"

email:
  - "devops@company.com"

slack:
webhook_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
slack_channel_override: "#alerts"
slack_username_override: "ElastAlert"

alert_text: |
  Error rate for service {0} is {1:.1%} over the last 10 minutes.
  This exceeds the threshold of 5%.

alert_text_type: alert_text_only

include:
  - service
  - level
  - message
  - "@timestamp"
```

### 日志轮转配置

```bash
# /etc/logrotate.d/nodejs-app
/var/log/nodejs-app/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        # 通知应用重新打开日志文件
        /bin/kill -USR1 $(cat /var/run/nodejs-app.pid) 2>/dev/null || true
    endscript
}

# 手动执行日志轮转
sudo logrotate -f /etc/logrotate.d/nodejs-app
```

## 🚀 日志管理最佳实践

### 结构化日志

```javascript
// 好的日志实践
logger.info('User operation completed', {
  operation: 'user_update',
  userId: user.id,
  changes: ['email', 'profile'],
  duration: 150,
  success: true
});

// 避免的日志实践
logger.info(`User ${user.id} updated email and profile in 150ms`);
```

### 敏感信息过滤

```javascript
function sanitizeLogData(data) {
  const sensitive = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = JSON.parse(JSON.stringify(data));
  
  function recursiveSanitize(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        recursiveSanitize(obj[key]);
      } else if (sensitive.some(s => key.toLowerCase().includes(s))) {
        obj[key] = '[REDACTED]';
      }
    }
  }
  
  recursiveSanitize(sanitized);
  return sanitized;
}
```

### 性能监控

```javascript
// 日志性能监控
class PerformanceLogger {
  static startTimer(operation) {
    return {
      operation,
      startTime: process.hrtime.bigint()
    };
  }
  
  static endTimer(timer, metadata = {}) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - timer.startTime) / 1000000; // 转换为毫秒
    
    logger.info('Performance metric', {
      operation: timer.operation,
      duration,
      ...metadata
    });
    
    return duration;
  }
}

// 使用示例
const timer = PerformanceLogger.startTimer('database_query');
const results = await db.query(sql);
PerformanceLogger.endTimer(timer, { rowCount: results.length });
```

## 📝 总结

有效的日志管理应该包括：

- **结构化日志**：便于查询和分析
- **适当的日志级别**：平衡详细程度和性能
- **敏感信息保护**：避免泄露机密数据
- **集中化收集**：统一管理多个服务的日志
- **实时监控**：及时发现和响应问题
- **长期存储**：满足合规和审计要求

良好的日志管理是系统可观测性的基础，对于问题排查和性能优化至关重要。

## 🔗 相关资源

- [Winston文档](https://github.com/winstonjs/winston)
- [ELK Stack指南](https://www.elastic.co/guide/index.html)
- [Fluentd文档](https://docs.fluentd.org/)
- [日志管理最佳实践](https://www.loggly.com/ultimate-guide/node-logging-basics/)
