export default [
  // {
  // "text": "高级主题", "link": "05-advanced/README", 
  // items: [
  { "text": "性能优化与监控", "link": "05-advanced/performance/README" },
  { "text": "微服务架构", "link": "05-advanced/microservices/README" },
  {
    "text": "数据库高级应用", "link": "05-advanced/database/README", items: [
      {
        "text": "连接池管理", "link": "05-advanced/database/connection-pooling-basics", items: [
          { "text": "连接池基础", "link": "05-advanced/database/connection-pooling-basics" },
          { "text": "连接池配置", "link": "05-advanced/database/connection-pool-config" },
          { "text": "连接池监控", "link": "05-advanced/database/connection-pool-monitoring" },
          { "text": "连接池优化", "link": "05-advanced/database/connection-pool-optimization" },
        ]
      },
      {
        "text": "查询优化", "link": "05-advanced/database/query-analysis", items: [
          { "text": "查询分析", "link": "05-advanced/database/query-analysis" },
          { "text": "索引优化", "link": "05-advanced/database/index-optimization" },
          { "text": "查询重写", "link": "05-advanced/database/query-rewriting" },
          { "text": "性能调优", "link": "05-advanced/database/performance-tuning" },
        ]
      },
      {
        "text": "缓存策略", "link": "05-advanced/database/caching-basics", items: [
          { "text": "缓存基础", "link": "05-advanced/database/caching-basics" },
          { "text": "Redis使用", "link": "05-advanced/database/redis-usage" },
          { "text": "缓存模式", "link": "05-advanced/database/caching-patterns" },
          { "text": "缓存一致性", "link": "05-advanced/database/cache-consistency" },
        ]
      },
      {
        "text": "数据迁移", "link": "05-advanced/database/migration-strategies", items: [
          { "text": "迁移策略", "link": "05-advanced/database/migration-strategies" },
          { "text": "数据同步", "link": "05-advanced/database/data-synchronization" },
          { "text": "版本控制", "link": "05-advanced/database/version-control" },
          { "text": "回滚机制", "link": "05-advanced/database/rollback-mechanisms" },
        ]
      },
    ]
  },
  { "text": "安全与认证", "link": "05-advanced/security/README" },
  { "text": "测试与质量保证", "link": "05-advanced/testing/README" },
  {
    "text": "DevOps与CI/CD", "link": "05-advanced/devops/README", items: [
      {
        text: 'CI/CD流水线', link: '05-advanced/devops/cicd-basics', items: [
          { text: 'CI/CD基础', link: '05-advanced/devops/cicd-basics' },
          { text: 'GitHub Actions', link: '05-advanced/devops/github-actions' },
          { text: 'Jenkins流水线', link: '05-advanced/devops/jenkins-pipeline' },
          { text: 'GitLab CI/CD', link: '05-advanced/devops/gitlab-cicd' },
        ]
      },
      {
        text: '容器化部署', link: '05-advanced/devops/docker-basics', items: [
          { text: 'Docker基础', link: '05-advanced/devops/docker-basics' },
          { text: 'Dockerfile编写', link: '05-advanced/devops/dockerfile-writing' },
          { text: 'Docker Compose', link: '05-advanced/devops/docker-compose' },
          { text: 'Kubernetes部署', link: '05-advanced/devops/kubernetes-deployment' },
        ]
      },
      {
        text: '监控与告警', link: '05-advanced/devops/monitoring-basics', items: [
          { text: '监控基础', link: '05-advanced/devops/monitoring-basics' },
          { text: 'Prometheus监控', link: '05-advanced/devops/prometheus-monitoring' },
          { text: 'Grafana可视化', link: '05-advanced/devops/grafana-visualization' },
          { text: '告警配置', link: '05-advanced/devops/alert-configuration' },
        ]
      },
      {
        text: '基础设施即代码', link: '05-advanced/devops/iac-basics', items: [
          { text: 'IaC基础', link: '05-advanced/devops/iac-basics' },
          { text: 'Terraform使用', link: '05-advanced/devops/terraform-usage' },
          { text: 'Ansible自动化', link: '05-advanced/devops/ansible-automation' },
          { text: 'CloudFormation', link: '05-advanced/devops/cloudformation' },
        ]
      },
      {
        text: '自动化运维', link: '05-advanced/devops/ops-automation', items: [
          { text: '运维自动化', link: '05-advanced/devops/ops-automation' },
          { text: '配置管理', link: '05-advanced/devops/configuration-management' },
          { text: '日志管理', link: '05-advanced/devops/log-management' },
          { text: '备份策略', link: '05-advanced/devops/backup-strategies' },
        ]
      },

      // ### 基础设施即代码

      // 13. [IaC基础](./iac-basics.md)
      // 14. [Terraform使用](./terraform-usage.md)
      // 15. [Ansible自动化](./ansible-automation.md)
      // 16. [CloudFormation](./cloudformation.md)

      // ### 自动化运维

      // 17. [运维自动化](./ops-automation.md)
      // 18. [配置管理](./configuration-management.md)
      // 19. [日志管理](./log-management.md)
      // 20. [备份策略](./backup-strategies.md)
    ]
  },
  {
    "text": "高级Node.js特性", "link": "05-advanced/advanced/README", items: [
      {
        "text": "V8引擎深入", "link": "05-advanced/advanced/v8-engine-basics", items: [
          { "text": "V8引擎基础", "link": "05-advanced/advanced/v8-engine-basics" },
          { "text": "内存管理", "link": "05-advanced/advanced/memory-management" },
          { "text": "垃圾回收", "link": "05-advanced/advanced/garbage-collection" },
          { "text": "性能优化", "link": "05-advanced/advanced/performance-optimization" },
        ]
      },
      {
        "text": "原生模块开发", "link": "05-advanced/advanced/cpp-addons", items: [
          { "text": "C++ Addons", "link": "05-advanced/advanced/cpp-addons" },
          { "text": "N-API使用", "link": "05-advanced/advanced/n-api-usage" },
          { "text": "WebAssembly集成", "link": "05-advanced/advanced/webassembly-integration" },
          { "text": "性能关键模块", "link": "05-advanced/advanced/performance-critical-modules" },
        ]
      },
      {
        "text": "Streams高级应用", "link": "05-advanced/advanced/streams-basics", items: [
          { "text": "Streams基础", "link": "05-advanced/advanced/streams-basics" },
          { "text": "可读流", "link": "05-advanced/advanced/readable-streams" },
          { "text": "可写流", "link": "05-advanced/advanced/writable-streams" },
          { "text": "转换流", "link": "05-advanced/advanced/transform-streams" },
        ]
      },
      {
        "text": "事件驱动架构", "link": "05-advanced/advanced/event-driven-basics", items: [
          { "text": "事件驱动基础", "link": "05-advanced/advanced/event-driven-basics" },
          { "text": "EventEmitter使用", "link": "05-advanced/advanced/eventemitter-usage" },
          { "text": "异步模式", "link": "05-advanced/advanced/async-patterns" },
          { "text": "响应式编程", "link": "05-advanced/advanced/reactive-programming" },
        ]
      },
      {
        "text": "高级特性", "link": "05-advanced/advanced/worker-threads", items: [
          { "text": "Worker Threads", "link": "05-advanced/advanced/worker-threads" },
          { "text": "Cluster模块", "link": "05-advanced/advanced/cluster-module" },
          { "text": "子进程管理", "link": "05-advanced/advanced/child-process-management" },
          { "text": "性能分析工具", "link": "05-advanced/advanced/performance-analysis-tools" },
        ]
      },
    ]
  },
  {
    "text": "云原生开发", "link": "05-advanced/cloud/README", items: [
      {
        'text': '云平台集成', link: '05-advanced/cloud/cloud-native-basics', items: [
          { text: '云原生基础', link: '05-advanced/cloud/cloud-native-basics' },
          { text: 'AWS服务集成', link: '05-advanced/cloud/aws-integration' },
          { text: 'Azure云服务', link: '05-advanced/cloud/azure-services' },
          { text: 'Google Cloud Platform', link: '05-advanced/cloud/gcp-services' },
        ]
      },
      {
        'text': 'Serverless架构', link: '05-advanced/cloud/serverless-basics', items: [
          { text: 'Serverless基础', link: '05-advanced/cloud/serverless-basics' },
          { text: 'AWS Lambda', link: '05-advanced/cloud/aws-lambda' },
          { text: 'Azure Functions', link: '05-advanced/cloud/azure-functions' },
          { text: 'Google Cloud Functions', link: '05-advanced/cloud/gcp-functions' },
        ]
      },
      {
        text: '边缘计算', link: '05-advanced/cloud/edge-computing-basics', items: [
          { text: '边缘计算基础', link: '05-advanced/cloud/edge-computing-basics' },
          { text: 'Cloudflare Workers', link: '05-advanced/cloud/cloudflare-workers' },
          { text: 'AWS Lambda@Edge', link: '05-advanced/cloud/aws-lambda-edge' },
          { text: '边缘函数部署', link: '05-advanced/cloud/edge-function-deployment' },
        ]
      },
      {
        text: '实时通信', link: '05-advanced/cloud/websocket-applications', items: [

          { text: 'WebSocket应用', link: '05-advanced/cloud/websocket-applications' },
          { text: 'Socket.io使用', link: '05-advanced/cloud/socketio-usage' },
          { text: '实时数据同步', link: '05-advanced/cloud/real-time-data-sync' },
          { text: '消息推送', link: '05-advanced/cloud/message-push' },
        ]
      },
      {
        text: '云原生部署', link: '05-advanced/cloud/containerized-deployment', items: [
          { text: '容器化部署', link: '05-advanced/cloud/containerized-deployment' },
          { text: 'Kubernetes编排', link: '05-advanced/cloud/kubernetes-orchestration' },
          { text: '服务网格', link: '05-advanced/cloud/service-mesh' },
          { text: '云原生监控', link: '05-advanced/cloud/cloud-native-monitoring' },
        ]
      },
    ]
  },
  { "text": "企业级应用", "link": "05-advanced/enterprise/README" },
  // ]
  // }
]
