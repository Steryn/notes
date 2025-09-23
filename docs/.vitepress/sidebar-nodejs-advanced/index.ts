import database from "./database";
import testing from "./testing";
import devops from "./devops";
import advanced from "./advanced";
import cloud from './cloud';
import enterprise from './enterprise';

export default [
  // {
  // "text": "高级主题", "link": "05-advanced/README", 
  // items: [
  { "text": "性能优化与监控", "link": "05-advanced/performance/README" },
  { "text": "微服务架构", "link": "05-advanced/microservices/README" },
  {
    "text": "数据库高级应用", "link": "05-advanced/database/README", items: database
  },
  { "text": "安全与认证", "link": "05-advanced/security/README" },
  {
    "text": "测试与质量保证", "link": "05-advanced/testing/README", items: testing
  },
  {
    "text": "DevOps与CI/CD", "link": "05-advanced/devops/README", items: devops
  },
  {
    "text": "高级Node.js特性", "link": "05-advanced/advanced/README", items: advanced
  },
  {
    "text": "云原生开发", "link": "05-advanced/cloud/README", items: cloud
  },
  {
    "text": "企业级应用", "link": "05-advanced/enterprise/README", items: enterprise
  },
  // ]
  // }
]
