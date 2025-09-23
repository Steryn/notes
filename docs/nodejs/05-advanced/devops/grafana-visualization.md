# Grafana可视化

## 📋 概述

Grafana是一个开源的监控和可观测性平台，提供强大的数据可视化功能。它可以连接多种数据源，创建丰富的仪表板，并支持告警和团队协作。

## 🎯 学习目标

- 掌握Grafana的核心功能和概念
- 学会创建和配置仪表板
- 了解查询编辑器和可视化选项
- 掌握告警和通知配置

## 📚 Grafana核心概念

### 数据源（Data Sources）

Grafana支持多种数据源，包括Prometheus、InfluxDB、Elasticsearch等。

```json
{
  "name": "Prometheus",
  "type": "prometheus",
  "url": "http://localhost:9090",
  "access": "proxy",
  "basicAuth": false,
  "isDefault": true
}
```

### 仪表板（Dashboards）

包含一个或多个面板的可视化界面。

### 面板（Panels）

仪表板中的可视化组件，如图表、表格、单值显示等。

### 查询（Queries）

从数据源获取数据的表达式。

## 🛠 Node.js应用仪表板配置

### 完整的仪表板JSON配置

```json
{
  "dashboard": {
    "id": null,
    "title": "Node.js Application Dashboard",
    "tags": ["nodejs", "monitoring"],
    "timezone": "browser",
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        },
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method)",
            "legendFormat": "{{method}}",
            "refId": "A"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec",
            "min": 0
          }
        ],
        "legend": {
          "show": true,
          "values": false,
          "current": false,
          "max": false,
          "min": false,
          "avg": false
        },
        "tooltip": {
          "shared": true,
          "sort": 0,
          "value_type": "individual"
        }
      },
      {
        "id": 2,
        "title": "Response Time (95th percentile)",
        "type": "graph",
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        },
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "95th percentile",
            "refId": "A"
          },
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "50th percentile",
            "refId": "B"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds",
            "min": 0
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "singlestat",
        "gridPos": {
          "h": 4,
          "w": 6,
          "x": 0,
          "y": 8
        },
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "refId": "A"
          }
        ],
        "valueName": "current",
        "format": "percent",
        "colorBackground": true,
        "thresholds": "1,5",
        "colors": ["#299c46", "#e5ac0e", "#d44a3a"]
      },
      {
        "id": 4,
        "title": "Active Users",
        "type": "singlestat",
        "gridPos": {
          "h": 4,
          "w": 6,
          "x": 6,
          "y": 8
        },
        "targets": [
          {
            "expr": "active_users_total",
            "refId": "A"
          }
        ],
        "valueName": "current",
        "format": "short",
        "colorValue": true,
        "thresholds": "100,1000",
        "colors": ["#d44a3a", "#e5ac0e", "#299c46"]
      },
      {
        "id": 5,
        "title": "Memory Usage",
        "type": "graph",
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 8
        },
        "targets": [
          {
            "expr": "process_resident_memory_bytes / 1024 / 1024",
            "legendFormat": "RSS Memory (MB)",
            "refId": "A"
          },
          {
            "expr": "nodejs_heap_size_used_bytes / 1024 / 1024",
            "legendFormat": "Heap Used (MB)",
            "refId": "B"
          },
          {
            "expr": "nodejs_heap_size_total_bytes / 1024 / 1024",
            "legendFormat": "Heap Total (MB)",
            "refId": "C"
          }
        ],
        "yAxes": [
          {
            "label": "MB",
            "min": 0
          }
        ],
        "fill": 1,
        "linewidth": 2
      },
      {
        "id": 6,
        "title": "CPU Usage",
        "type": "graph",
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 16
        },
        "targets": [
          {
            "expr": "rate(process_cpu_seconds_total[5m]) * 100",
            "legendFormat": "CPU Usage %",
            "refId": "A"
          }
        ],
        "yAxes": [
          {
            "label": "Percent",
            "min": 0,
            "max": 100
          }
        ]
      },
      {
        "id": 7,
        "title": "Database Queries",
        "type": "graph",
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 16
        },
        "targets": [
          {
            "expr": "sum(rate(db_queries_total[5m])) by (operation)",
            "legendFormat": "{{operation}}",
            "refId": "A"
          }
        ],
        "yAxes": [
          {
            "label": "Queries/sec",
            "min": 0
          }
        ]
      },
      {
        "id": 8,
        "title": "Top Endpoints by Request Count",
        "type": "table",
        "gridPos": {
          "h": 8,
          "w": 24,
          "x": 0,
          "y": 24
        },
        "targets": [
          {
            "expr": "topk(10, sum(rate(http_requests_total[5m])) by (route))",
            "format": "table",
            "instant": true,
            "refId": "A"
          }
        ],
        "columns": [
          {
            "text": "Route",
            "value": "route"
          },
          {
            "text": "Requests/sec",
            "value": "Value"
          }
        ],
        "sort": {
          "col": 1,
          "desc": true
        }
      }
    ],
    "templating": {
      "list": [
        {
          "name": "instance",
          "type": "query",
          "query": "label_values(up, instance)",
          "refresh": 1,
          "includeAll": true,
          "multi": true
        },
        {
          "name": "method",
          "type": "query",
          "query": "label_values(http_requests_total, method)",
          "refresh": 1,
          "includeAll": true,
          "multi": true
        }
      ]
    },
    "annotations": {
      "list": [
        {
          "name": "Deployments",
          "datasource": "Prometheus",
          "expr": "changes(process_start_time_seconds[1h]) > 0",
          "titleFormat": "Deployment",
          "textFormat": "Application restarted"
        }
      ]
    }
  }
}
```

### 仪表板变量配置

```json
{
  "templating": {
    "list": [
      {
        "name": "datasource",
        "type": "datasource",
        "query": "prometheus",
        "current": {
          "value": "Prometheus",
          "text": "Prometheus"
        }
      },
      {
        "name": "instance",
        "type": "query",
        "datasource": "$datasource",
        "query": "label_values(up, instance)",
        "refresh": 1,
        "includeAll": true,
        "multi": true,
        "current": {
          "value": "$__all",
          "text": "All"
        }
      },
      {
        "name": "interval",
        "type": "interval",
        "query": "1m,5m,10m,30m,1h",
        "current": {
          "value": "5m",
          "text": "5m"
        }
      }
    ]
  }
}
```

## 🎨 可视化组件详解

### 时间序列图表

```json
{
  "type": "timeseries",
  "title": "Request Rate",
  "fieldConfig": {
    "defaults": {
      "custom": {
        "drawStyle": "line",
        "lineInterpolation": "linear",
        "barAlignment": 0,
        "lineWidth": 1,
        "fillOpacity": 10,
        "gradientMode": "none",
        "spanNulls": false,
        "insertNulls": false,
        "showPoints": "never",
        "pointSize": 5,
        "stacking": {
          "mode": "none",
          "group": "A"
        },
        "axisPlacement": "auto",
        "axisLabel": "",
        "scaleDistribution": {
          "type": "linear"
        },
        "hideFrom": {
          "legend": false,
          "tooltip": false,
          "vis": false
        },
        "thresholdsStyle": {
          "mode": "off"
        }
      },
      "color": {
        "mode": "palette-classic"
      },
      "mappings": [],
      "thresholds": {
        "mode": "absolute",
        "steps": [
          {
            "color": "green",
            "value": null
          },
          {
            "color": "red",
            "value": 80
          }
        ]
      },
      "unit": "reqps"
    }
  },
  "options": {
    "tooltip": {
      "mode": "multi",
      "sort": "desc"
    },
    "legend": {
      "displayMode": "list",
      "placement": "bottom"
    }
  },
  "targets": [
    {
      "expr": "sum(rate(http_requests_total[$interval])) by (method)",
      "legendFormat": "{{method}}",
      "refId": "A"
    }
  ]
}
```

### 单值显示

```json
{
  "type": "stat",
  "title": "Current Error Rate",
  "fieldConfig": {
    "defaults": {
      "color": {
        "mode": "thresholds"
      },
      "mappings": [],
      "thresholds": {
        "mode": "absolute",
        "steps": [
          {
            "color": "green",
            "value": null
          },
          {
            "color": "yellow",
            "value": 1
          },
          {
            "color": "red",
            "value": 5
          }
        ]
      },
      "unit": "percent"
    }
  },
  "options": {
    "reduceOptions": {
      "values": false,
      "calcs": ["lastNotNull"],
      "fields": ""
    },
    "orientation": "auto",
    "textMode": "auto",
    "colorMode": "background",
    "graphMode": "area",
    "justifyMode": "auto"
  },
  "targets": [
    {
      "expr": "sum(rate(http_requests_total{status_code=~\"5..\"}[$interval])) / sum(rate(http_requests_total[$interval])) * 100",
      "refId": "A"
    }
  ]
}
```

### 表格视图

```json
{
  "type": "table",
  "title": "Top Error Routes",
  "fieldConfig": {
    "defaults": {
      "custom": {
        "align": "auto",
        "displayMode": "auto"
      },
      "mappings": [],
      "thresholds": {
        "mode": "absolute",
        "steps": [
          {
            "color": "green",
            "value": null
          },
          {
            "color": "red",
            "value": 80
          }
        ]
      }
    },
    "overrides": [
      {
        "matcher": {
          "id": "byName",
          "options": "Error Rate"
        },
        "properties": [
          {
            "id": "unit",
            "value": "percent"
          },
          {
            "id": "custom.displayMode",
            "value": "color-background"
          },
          {
            "id": "thresholds",
            "value": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "yellow",
                  "value": 1
                },
                {
                  "color": "red",
                  "value": 5
                }
              ]
            }
          }
        ]
      }
    ]
  },
  "options": {
    "showHeader": true,
    "sortBy": [
      {
        "desc": true,
        "displayName": "Error Rate"
      }
    ]
  },
  "targets": [
    {
      "expr": "topk(10, sum(rate(http_requests_total{status_code=~\"5..\"}[$interval])) by (route) / sum(rate(http_requests_total[$interval])) by (route) * 100)",
      "format": "table",
      "instant": true,
      "refId": "A"
    }
  ],
  "transformations": [
    {
      "id": "organize",
      "options": {
        "excludeByName": {
          "Time": true,
          "__name__": true,
          "job": true
        },
        "indexByName": {},
        "renameByName": {
          "route": "Route",
          "Value": "Error Rate"
        }
      }
    }
  ]
}
```

### 热力图

```json
{
  "type": "heatmap",
  "title": "Response Time Distribution",
  "fieldConfig": {
    "defaults": {
      "custom": {
        "hideFrom": {
          "legend": false,
          "tooltip": false,
          "vis": false
        },
        "scaleDistribution": {
          "type": "linear"
        }
      }
    }
  },
  "options": {
    "calculate": false,
    "yAxis": {
      "axisPlacement": "left",
      "reverse": false,
      "unit": "s"
    },
    "cellGap": 1,
    "color": {
      "mode": "spectrum",
      "fill": "dark-orange",
      "scale": "exponential",
      "exponent": 0.5,
      "scheme": "Oranges"
    },
    "exemplars": {
      "color": "rgba(255,0,255,0.7)"
    },
    "filterValues": {
      "le": 1e-9
    },
    "legend": {
      "show": false
    },
    "rowsFrame": {
      "layout": "auto"
    },
    "tooltip": {
      "show": true,
      "yHistogram": false
    },
    "yAxis": {
      "axisPlacement": "left",
      "reverse": false,
      "unit": "s"
    }
  },
  "targets": [
    {
      "expr": "sum(increase(http_request_duration_seconds_bucket[$interval])) by (le)",
      "format": "heatmap",
      "legendFormat": "{{le}}",
      "refId": "A"
    }
  ]
}
```

## 🚨 告警配置

### 告警规则配置

```json
{
  "alert": {
    "conditions": [
      {
        "evaluator": {
          "params": [5],
          "type": "gt"
        },
        "operator": {
          "type": "and"
        },
        "query": {
          "model": {
            "expr": "sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "refId": "A"
          },
          "params": ["A", "5m", "now"]
        },
        "reducer": {
          "params": [],
          "type": "last"
        },
        "type": "query"
      }
    ],
    "executionErrorState": "alerting",
    "for": "5m",
    "frequency": "10s",
    "handler": 1,
    "name": "High Error Rate Alert",
    "noDataState": "no_data",
    "notifications": [
      {
        "uid": "slack-notifications"
      },
      {
        "uid": "email-notifications"
      }
    ]
  }
}
```

### 通知渠道配置

```json
{
  "name": "Slack Notifications",
  "type": "slack",
  "settings": {
    "url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
    "channel": "#alerts",
    "username": "Grafana",
    "title": "{{ range .Alerts }}{{ .AlertName }}{{ end }}",
    "text": "{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}",
    "iconEmoji": ":exclamation:",
    "iconUrl": "",
    "mentionUsers": "",
    "mentionGroups": "",
    "mentionChannel": ""
  }
}
```

## 🔧 高级功能

### 数据链接配置

```json
{
  "dataLinks": [
    {
      "title": "View Logs",
      "url": "http://localhost:3000/explore?orgId=1&left=%5B%22now-1h%22,%22now%22,%22Loki%22,%7B%22expr%22:%22%7Binstance%3D%5C%22${__field.labels.instance}%5C%22%7D%22%7D%5D",
      "targetBlank": true
    },
    {
      "title": "View Metrics",
      "url": "http://localhost:9090/graph?g0.expr=up%7Binstance%3D%22${__field.labels.instance}%22%7D&g0.tab=1&g0.stacked=0&g0.range_input=1h",
      "targetBlank": true
    }
  ]
}
```

### 转换和计算

```json
{
  "transformations": [
    {
      "id": "reduce",
      "options": {
        "reducers": ["mean", "max", "min"]
      }
    },
    {
      "id": "calculateField",
      "options": {
        "mode": "binary",
        "reduce": {
          "reducer": "sum"
        },
        "binary": {
          "left": "Value #A",
          "operator": "/",
          "right": "Value #B"
        },
        "alias": "Success Rate"
      }
    },
    {
      "id": "organize",
      "options": {
        "excludeByName": {
          "Time": true
        },
        "indexByName": {},
        "renameByName": {
          "Value": "Success Rate %"
        }
      }
    }
  ]
}
```

### 自定义面板插件

```javascript
// custom-panel-plugin.js
import { PanelPlugin } from '@grafana/data';
import { SimplePanel } from './SimplePanel';

export const plugin = new PanelPlugin(SimplePanel).setPanelOptions(builder => {
  return builder
    .addTextInput({
      path: 'title',
      name: 'Panel Title',
      description: 'Custom title for the panel',
      defaultValue: 'My Custom Panel',
    })
    .addSelect({
      path: 'displayMode',
      name: 'Display Mode',
      description: 'How to display the data',
      defaultValue: 'table',
      settings: {
        options: [
          { value: 'table', label: 'Table' },
          { value: 'chart', label: 'Chart' },
          { value: 'stat', label: 'Stat' }
        ],
      },
    })
    .addBooleanSwitch({
      path: 'showLegend',
      name: 'Show Legend',
      defaultValue: true,
    });
});
```

## 📊 性能优化

### 查询优化

```javascript
// 优化前：高基数查询
sum(rate(http_requests_total[5m])) by (instance, method, route, status_code)

// 优化后：降低基数
sum(rate(http_requests_total[5m])) by (method, status_code)

// 使用recording rules预计算
// prometheus.yml
rule_files:
  - "recording_rules.yml"

// recording_rules.yml
groups:
- name: http_requests
  rules:
  - record: http:request_rate_5m
    expr: sum(rate(http_requests_total[5m])) by (method, status_code)
  - record: http:error_rate_5m
    expr: sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

### 仪表板优化

```json
{
  "refresh": "30s",
  "time": {
    "from": "now-1h",
    "to": "now"
  },
  "panels": [
    {
      "maxDataPoints": 100,
      "interval": "30s",
      "cacheTimeout": "60s"
    }
  ]
}
```

## 📝 总结

Grafana为Node.js应用提供了强大的可视化能力：

- **丰富的可视化组件**：图表、表格、热力图等
- **灵活的仪表板配置**：支持变量、注释、链接
- **强大的告警功能**：多种通知渠道和告警规则
- **可扩展性**：支持插件和自定义面板

通过合理的仪表板设计和查询优化，可以构建出高效的监控可视化系统。

## 🔗 相关资源

- [Grafana官方文档](https://grafana.com/docs/)
- [仪表板最佳实践](https://grafana.com/docs/grafana/latest/best-practices/)
- [插件开发指南](https://grafana.com/docs/grafana/latest/developers/)
- [社区仪表板](https://grafana.com/grafana/dashboards/)
