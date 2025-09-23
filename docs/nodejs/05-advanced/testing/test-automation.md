# 测试自动化

## 📋 概述

测试自动化是将测试执行、结果分析、报告生成等过程自动化的实践。在Node.js项目中，测试自动化通过CI/CD流水线确保代码质量，提高开发效率，减少人工错误，是现代软件开发流程的重要组成部分。

## 🎯 学习目标

- 理解测试自动化的核心概念和价值
- 掌握CI/CD中的测试自动化配置
- 学会构建完整的测试自动化流水线
- 了解测试自动化的监控和优化策略

## 🔄 测试自动化策略

### 自动化测试金字塔

```mermaid
graph TB
    A[测试自动化金字塔] --> B[单元测试<br/>Unit Tests]
    A --> C[集成测试<br/>Integration Tests]
    A --> D[E2E测试<br/>End-to-End Tests]
    A --> E[探索性测试<br/>Exploratory Tests]
    
    B --> B1[70% - 快速反馈<br/>开发者驱动<br/>高覆盖率]
    C --> C1[20% - 组件协作<br/>API验证<br/>数据流测试]
    D --> D2[9% - 用户场景<br/>关键路径<br/>业务验证]
    E --> E1[1% - 手工测试<br/>可用性测试<br/>创新场景]
    
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#ffebee
    style E fill:#f3e5f5
```

### 自动化测试策略

```javascript
const TestAutomationStrategy = {
  LEVELS: {
    unit: {
      percentage: 70,
      characteristics: [
        '执行速度最快',
        '反馈最及时',
        '维护成本最低',
        '覆盖率最高'
      ],
      tools: ['Jest', 'Mocha', 'Vitest'],
      triggerPoints: [
        '代码提交时',
        '合并请求创建时',
        '本地开发时'
      ]
    },
    
    integration: {
      percentage: 20,
      characteristics: [
        '验证组件协作',
        '测试API接口',
        '数据库集成测试',
        '外部服务模拟'
      ],
      tools: ['Supertest', 'Testcontainers', 'Nock'],
      triggerPoints: [
        '功能分支合并前',
        '每日构建',
        '发布候选版本'
      ]
    },
    
    e2e: {
      percentage: 9,
      characteristics: [
        '模拟真实用户操作',
        '验证完整业务流程',
        '跨浏览器兼容性',
        '性能基准测试'
      ],
      tools: ['Playwright', 'Cypress', 'Puppeteer'],
      triggerPoints: [
        '发布前验证',
        '主分支更新后',
        '定时回归测试'
      ]
    },
    
    manual: {
      percentage: 1,
      characteristics: [
        '探索性测试',
        '可用性验证',
        '创新场景测试',
        '边界条件探索'
      ],
      focus: [
        '新功能验收',
        '用户体验评估',
        '安全性审查',
        '性能调优验证'
      ]
    }
  },
  
  AUTOMATION_PRINCIPLES: {
    failFast: '快速失败，快速反馈',
    parallelization: '并行执行，提高效率',
    reliability: '稳定可靠，减少误报',
    maintainability: '易于维护，持续改进',
    scalability: '可扩展性，支持团队成长'
  }
};
```

## 🏗️ CI/CD集成配置

### GitHub Actions配置

```yaml
# .github/workflows/test-automation.yml
name: Test Automation Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    # 每日凌晨2点执行完整测试
    - cron: '0 2 * * *'

env:
  NODE_VERSION: '18'
  CACHE_NAME: 'node-modules'

jobs:
  # 代码质量检查
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Check code formatting
        run: npm run format:check

  # 单元测试
  unit-tests:
    runs-on: ubuntu-latest
    needs: code-quality
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          CI: true
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # 集成测试
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Wait for PostgreSQL
        run: |
          until pg_isready -h localhost -p 5432; do
            echo "Waiting for PostgreSQL..."
            sleep 2
          done
      
      - name: Run database migrations
        run: npm run migrate:test
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test

  # E2E测试
  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: |
          npm run start:test &
          sleep 10
        env:
          NODE_ENV: test
          PORT: 3000
      
      - name: Run E2E tests
        run: npx playwright test --project=${{ matrix.browser }}
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/

  # 性能测试
  performance-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    if: github.ref == 'refs/heads/main' || github.event_name == 'schedule'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: |
          npm run start:prod &
          sleep 15
        env:
          NODE_ENV: production
          PORT: 3000
      
      - name: Run load tests
        run: npm run test:load
        env:
          TARGET_URL: http://localhost:3000
      
      - name: Performance baseline check
        run: npm run test:performance-baseline
      
      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: performance-results/

  # 安全测试
  security-tests:
    runs-on: ubuntu-latest
    needs: code-quality
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Run CodeQL analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: javascript
      
      - name: Run OWASP dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'nodejs-app'
          path: '.'
          format: 'HTML'
      
      - name: Upload security results
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: reports/

  # 部署准备
  deployment-preparation:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run smoke tests
        run: npm run test:smoke
      
      - name: Create deployment package
        run: |
          tar -czf deployment.tar.gz \
            dist/ \
            package.json \
            package-lock.json \
            docker/ \
            scripts/
      
      - name: Upload deployment artifact
        uses: actions/upload-artifact@v3
        with:
          name: deployment-package
          path: deployment.tar.gz
```

### GitLab CI配置

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - security
  - performance
  - deploy

variables:
  NODE_VERSION: "18"
  POSTGRES_DB: test_db
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  POSTGRES_HOST_AUTH_METHOD: trust

# 缓存配置
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/

# 代码质量检查
code-quality:
  stage: validate
  image: node:${NODE_VERSION}
  before_script:
    - npm ci --cache .npm --prefer-offline
  script:
    - npm run lint
    - npm run type-check
    - npm run format:check
  artifacts:
    reports:
      junit: reports/lint-results.xml

# 单元测试
unit-tests:
  stage: test
  image: node:${NODE_VERSION}
  before_script:
    - npm ci --cache .npm --prefer-offline
  script:
    - npm run test:unit -- --coverage --reporters=default --reporters=junit
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      junit: reports/unit-tests.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/

# 集成测试
integration-tests:
  stage: test
  image: node:${NODE_VERSION}
  services:
    - postgres:14
    - redis:7-alpine
  variables:
    DATABASE_URL: "postgres://postgres:postgres@postgres:5432/test_db"
    REDIS_URL: "redis://redis:6379"
  before_script:
    - npm ci --cache .npm --prefer-offline
    - npm run migrate:test
  script:
    - npm run test:integration
  artifacts:
    reports:
      junit: reports/integration-tests.xml

# E2E测试
e2e-tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  before_script:
    - npm ci --cache .npm --prefer-offline
    - npm run build
  script:
    - npm run start:test &
    - sleep 10
    - npx playwright test
  artifacts:
    when: failure
    paths:
      - playwright-report/
    expire_in: 30 days

# 安全扫描
security-scan:
  stage: security
  image: node:${NODE_VERSION}
  before_script:
    - npm ci --cache .npm --prefer-offline
  script:
    - npm audit --audit-level high
    - npx retire
  allow_failure: true
  artifacts:
    reports:
      junit: reports/security-scan.xml

# 性能测试
performance-tests:
  stage: performance
  image: node:${NODE_VERSION}
  before_script:
    - npm ci --cache .npm --prefer-offline
    - npm run build
  script:
    - npm run start:prod &
    - sleep 15
    - npm run test:load
    - npm run test:performance-baseline
  artifacts:
    paths:
      - performance-results/
  only:
    - main
    - schedules

# 部署到测试环境
deploy-staging:
  stage: deploy
  image: node:${NODE_VERSION}
  before_script:
    - npm ci --cache .npm --prefer-offline
  script:
    - npm run build
    - npm run deploy:staging
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - main

# 部署到生产环境
deploy-production:
  stage: deploy
  image: node:${NODE_VERSION}
  before_script:
    - npm ci --cache .npm --prefer-offline
  script:
    - npm run build
    - npm run deploy:production
  environment:
    name: production
    url: https://app.example.com
  when: manual
  only:
    - main
```

### Jenkins Pipeline配置

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        DATABASE_URL = 'postgres://postgres:password@localhost:5432/test_db'
        REDIS_URL = 'redis://localhost:6379'
    }
    
    options {
        timeout(time: 1, unit: 'HOURS')
        retry(3)
        skipStagesAfterUnstable()
    }
    
    stages {
        stage('Preparation') {
            steps {
                // 清理工作空间
                cleanWs()
                
                // 检出代码
                checkout scm
                
                // 设置Node.js环境
                script {
                    def nodeHome = tool name: "Node-${NODE_VERSION}", type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
                    env.PATH = "${nodeHome}/bin:${env.PATH}"
                }
                
                // 安装依赖
                sh 'npm ci'
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Linting') {
                    steps {
                        sh 'npm run lint'
                        publishHTML([
                            allowMissing: false,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'reports',
                            reportFiles: 'eslint-report.html',
                            reportName: 'ESLint Report'
                        ])
                    }
                }
                
                stage('Type Checking') {
                    steps {
                        sh 'npm run type-check'
                    }
                }
                
                stage('Security Audit') {
                    steps {
                        sh 'npm audit --audit-level high'
                        
                        // OWASP依赖检查
                        script {
                            try {
                                sh 'npm run security:check'
                            } catch (Exception e) {
                                currentBuild.result = 'UNSTABLE'
                                echo "Security check failed: ${e.getMessage()}"
                            }
                        }
                    }
                }
            }
        }
        
        stage('Testing') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm run test:unit -- --coverage --reporters=default --reporters=junit'
                        
                        // 发布测试结果
                        publishTestResults testResultsPattern: 'reports/unit-tests.xml'
                        
                        // 发布覆盖率报告
                        publishHTML([
                            allowMissing: false,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'coverage/lcov-report',
                            reportFiles: 'index.html',
                            reportName: 'Coverage Report'
                        ])
                        
                        // 覆盖率阈值检查
                        script {
                            def coverage = readJSON file: 'coverage/coverage-summary.json'
                            def linesCoverage = coverage.total.lines.pct
                            
                            if (linesCoverage < 80) {
                                error "Coverage ${linesCoverage}% is below threshold of 80%"
                            }
                        }
                    }
                }
                
                stage('Integration Tests') {
                    steps {
                        // 启动测试服务
                        sh '''
                            docker-compose -f docker-compose.test.yml up -d postgres redis
                            sleep 10
                        '''
                        
                        // 运行数据库迁移
                        sh 'npm run migrate:test'
                        
                        // 运行集成测试
                        sh 'npm run test:integration'
                        
                        // 清理测试环境
                        sh 'docker-compose -f docker-compose.test.yml down'
                        
                        publishTestResults testResultsPattern: 'reports/integration-tests.xml'
                    }
                }
            }
        }
        
        stage('E2E Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    changeRequest()
                }
            }
            steps {
                // 构建应用
                sh 'npm run build'
                
                // 启动应用
                sh '''
                    npm run start:test &
                    sleep 15
                '''
                
                // 运行E2E测试
                sh 'npx playwright test'
                
                // 发布E2E测试结果
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'E2E Test Report'
                ])
            }
            post {
                failure {
                    archiveArtifacts artifacts: 'playwright-report/**/*', fingerprint: true
                }
            }
        }
        
        stage('Performance Tests') {
            when {
                branch 'main'
            }
            steps {
                // 启动生产版本
                sh '''
                    npm run start:prod &
                    sleep 20
                '''
                
                // 运行性能测试
                sh 'npm run test:load'
                sh 'npm run test:performance-baseline'
                
                // 发布性能报告
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'performance-results',
                    reportFiles: 'index.html',
                    reportName: 'Performance Report'
                ])
            }
        }
        
        stage('Build & Package') {
            when {
                branch 'main'
            }
            steps {
                sh 'npm run build'
                
                // 创建部署包
                sh '''
                    tar -czf deployment.tar.gz \
                        dist/ \
                        package.json \
                        package-lock.json \
                        docker/ \
                        scripts/
                '''
                
                archiveArtifacts artifacts: 'deployment.tar.gz', fingerprint: true
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                // 部署到预发布环境
                sh 'npm run deploy:staging'
                
                // 运行冒烟测试
                sh 'npm run test:smoke -- --env=staging'
            }
        }
        
        stage('Deploy to Production') {
            when {
                allOf {
                    branch 'main'
                    // 手动触发生产部署
                    anyOf {
                        triggeredBy 'UserIdCause'
                        environment name: 'DEPLOY_TO_PROD', value: 'true'
                    }
                }
            }
            steps {
                // 生产部署确认
                input message: 'Deploy to production?', ok: 'Deploy',
                      submitterParameter: 'DEPLOYER'
                
                // 部署到生产环境
                sh 'npm run deploy:production'
                
                // 生产环境冒烟测试
                sh 'npm run test:smoke -- --env=production'
            }
        }
    }
    
    post {
        always {
            // 清理工作空间
            cleanWs()
        }
        
        success {
            // 成功通知
            script {
                if (env.BRANCH_NAME == 'main') {
                    slackSend(
                        channel: '#deployments',
                        color: 'good',
                        message: "✅ Pipeline succeeded for ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
                    )
                }
            }
        }
        
        failure {
            // 失败通知
            slackSend(
                channel: '#build-failures',
                color: 'danger',
                message: "❌ Pipeline failed for ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
            )
            
            // 发送邮件通知
            emailext(
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build failed. Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}, team@example.com"
            )
        }
        
        unstable {
            // 不稳定构建通知
            slackSend(
                channel: '#build-warnings',
                color: 'warning',
                message: "⚠️ Pipeline unstable for ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
            )
        }
    }
}
```

## 🔧 测试自动化工具集成

### 测试报告聚合

```javascript
// scripts/test-report-aggregator.js
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

class TestReportAggregator {
  constructor() {
    this.reports = {
      unit: [],
      integration: [],
      e2e: [],
      performance: []
    };
    this.summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      coverage: null,
      duration: 0
    };
  }
  
  async aggregateReports() {
    console.log('🔄 Aggregating test reports...');
    
    // 聚合JUnit报告
    await this.aggregateJUnitReports();
    
    // 聚合覆盖率报告
    await this.aggregateCoverageReports();
    
    // 聚合性能报告
    await this.aggregatePerformanceReports();
    
    // 生成HTML报告
    await this.generateHTMLReport();
    
    // 生成JSON摘要
    await this.generateJSONSummary();
    
    console.log('✅ Test report aggregation completed');
  }
  
  async aggregateJUnitReports() {
    const reportPaths = [
      'reports/unit-tests.xml',
      'reports/integration-tests.xml',
      'reports/e2e-tests.xml'
    ];
    
    for (const reportPath of reportPaths) {
      if (fs.existsSync(reportPath)) {
        await this.parseJUnitReport(reportPath);
      }
    }
  }
  
  async parseJUnitReport(filePath) {
    const xmlContent = fs.readFileSync(filePath, 'utf8');
    const parser = new xml2js.Parser();
    
    try {
      const result = await parser.parseStringPromise(xmlContent);
      const testsuites = result.testsuites || result.testsuite;
      
      if (Array.isArray(testsuites)) {
        testsuites.forEach(suite => this.processSuite(suite));
      } else {
        this.processSuite(testsuites);
      }
    } catch (error) {
      console.warn(`Failed to parse JUnit report ${filePath}:`, error.message);
    }
  }
  
  processSuite(suite) {
    const tests = parseInt(suite.$.tests || 0);
    const failures = parseInt(suite.$.failures || 0);
    const errors = parseInt(suite.$.errors || 0);
    const skipped = parseInt(suite.$.skipped || 0);
    const time = parseFloat(suite.$.time || 0);
    
    this.summary.totalTests += tests;
    this.summary.failedTests += failures + errors;
    this.summary.skippedTests += skipped;
    this.summary.passedTests += tests - failures - errors - skipped;
    this.summary.duration += time;
  }
  
  async aggregateCoverageReports() {
    const coveragePath = 'coverage/coverage-summary.json';
    
    if (fs.existsSync(coveragePath)) {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      this.summary.coverage = {
        lines: coverageData.total.lines.pct,
        functions: coverageData.total.functions.pct,
        branches: coverageData.total.branches.pct,
        statements: coverageData.total.statements.pct
      };
    }
  }
  
  async aggregatePerformanceReports() {
    const performancePath = 'performance-results/summary.json';
    
    if (fs.existsSync(performancePath)) {
      const performanceData = JSON.parse(fs.readFileSync(performancePath, 'utf8'));
      this.summary.performance = {
        averageResponseTime: performanceData.averageResponseTime,
        throughput: performanceData.throughput,
        errorRate: performanceData.errorRate
      };
    }
  }
  
  async generateHTMLReport() {
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>测试自动化报告</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .card { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; }
            .card h3 { margin-top: 0; color: #495057; }
            .metric { font-size: 2em; font-weight: bold; }
            .success { color: #28a745; }
            .danger { color: #dc3545; }
            .warning { color: #ffc107; }
            .info { color: #17a2b8; }
            .coverage-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; }
            .coverage-fill { height: 100%; background: linear-gradient(90deg, #dc3545 0%, #ffc107 70%, #28a745 90%); }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📊 测试自动化报告</h1>
            <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="summary">
            <div class="card">
                <h3>📋 测试概览</h3>
                <div class="metric success">${this.summary.passedTests}</div>
                <p>通过测试</p>
                <div class="metric danger">${this.summary.failedTests}</div>
                <p>失败测试</p>
                <div class="metric warning">${this.summary.skippedTests}</div>
                <p>跳过测试</p>
            </div>
            
            <div class="card">
                <h3>📈 覆盖率</h3>
                ${this.summary.coverage ? `
                <div style="margin-bottom: 10px;">
                    <span>行覆盖率: ${this.summary.coverage.lines}%</span>
                    <div class="coverage-bar">
                        <div class="coverage-fill" style="width: ${this.summary.coverage.lines}%"></div>
                    </div>
                </div>
                <div style="margin-bottom: 10px;">
                    <span>分支覆盖率: ${this.summary.coverage.branches}%</span>
                    <div class="coverage-bar">
                        <div class="coverage-fill" style="width: ${this.summary.coverage.branches}%"></div>
                    </div>
                </div>
                ` : '<p>无覆盖率数据</p>'}
            </div>
            
            <div class="card">
                <h3>⏱️ 执行时间</h3>
                <div class="metric info">${Math.round(this.summary.duration)}s</div>
                <p>总执行时间</p>
            </div>
            
            ${this.summary.performance ? `
            <div class="card">
                <h3>🚀 性能指标</h3>
                <p>平均响应时间: ${this.summary.performance.averageResponseTime}ms</p>
                <p>吞吐量: ${this.summary.performance.throughput} RPS</p>
                <p>错误率: ${this.summary.performance.errorRate}%</p>
            </div>
            ` : ''}
        </div>
        
        <div class="card">
            <h3>📊 测试结果详情</h3>
            <ul>
                <li>总测试数: ${this.summary.totalTests}</li>
                <li>通过率: ${((this.summary.passedTests / this.summary.totalTests) * 100).toFixed(1)}%</li>
                <li>失败率: ${((this.summary.failedTests / this.summary.totalTests) * 100).toFixed(1)}%</li>
            </ul>
        </div>
    </body>
    </html>
    `;
    
    fs.writeFileSync('reports/test-summary.html', htmlTemplate);
  }
  
  async generateJSONSummary() {
    const jsonSummary = {
      timestamp: new Date().toISOString(),
      summary: this.summary,
      status: this.summary.failedTests === 0 ? 'PASSED' : 'FAILED',
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync('reports/test-summary.json', JSON.stringify(jsonSummary, null, 2));
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    if (this.summary.coverage && this.summary.coverage.lines < 80) {
      recommendations.push({
        type: 'COVERAGE',
        priority: 'HIGH',
        message: `代码覆盖率${this.summary.coverage.lines}%低于80%，建议增加测试用例`
      });
    }
    
    if (this.summary.failedTests > 0) {
      recommendations.push({
        type: 'FAILURES',
        priority: 'CRITICAL',
        message: `有${this.summary.failedTests}个测试失败，需要立即修复`
      });
    }
    
    if (this.summary.duration > 600) { // 10分钟
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'MEDIUM',
        message: '测试执行时间过长，建议优化测试性能或增加并行度'
      });
    }
    
    return recommendations;
  }
}

// 使用示例
async function main() {
  const aggregator = new TestReportAggregator();
  await aggregator.aggregateReports();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestReportAggregator;
```

### 测试环境管理

```javascript
// scripts/test-environment-manager.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestEnvironmentManager {
  constructor() {
    this.services = new Map();
    this.environments = {
      unit: {
        services: [],
        env: { NODE_ENV: 'test' }
      },
      integration: {
        services: ['postgres', 'redis'],
        env: {
          NODE_ENV: 'test',
          DATABASE_URL: 'postgres://postgres:password@localhost:5432/test_db',
          REDIS_URL: 'redis://localhost:6379'
        }
      },
      e2e: {
        services: ['postgres', 'redis', 'app'],
        env: {
          NODE_ENV: 'test',
          PORT: '3001',
          DATABASE_URL: 'postgres://postgres:password@localhost:5432/e2e_test_db',
          REDIS_URL: 'redis://localhost:6379'
        }
      }
    };
  }
  
  async setupEnvironment(type) {
    console.log(`🚀 Setting up ${type} test environment...`);
    
    const env = this.environments[type];
    if (!env) {
      throw new Error(`Unknown environment type: ${type}`);
    }
    
    // 设置环境变量
    Object.assign(process.env, env.env);
    
    // 启动所需服务
    for (const service of env.services) {
      await this.startService(service);
    }
    
    // 等待服务就绪
    await this.waitForServices(env.services);
    
    // 运行初始化脚本
    await this.runInitializationScripts(type);
    
    console.log(`✅ ${type} test environment ready`);
  }
  
  async startService(serviceName) {
    if (this.services.has(serviceName)) {
      console.log(`Service ${serviceName} already running`);
      return;
    }
    
    console.log(`Starting service: ${serviceName}`);
    
    switch (serviceName) {
      case 'postgres':
        await this.startPostgreSQL();
        break;
      case 'redis':
        await this.startRedis();
        break;
      case 'app':
        await this.startApplication();
        break;
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }
  
  async startPostgreSQL() {
    const dockerCmd = [
      'docker', 'run', '-d',
      '--name', 'test-postgres',
      '-p', '5432:5432',
      '-e', 'POSTGRES_PASSWORD=password',
      '-e', 'POSTGRES_DB=test_db',
      'postgres:14'
    ];
    
    try {
      await this.execCommand(dockerCmd);
      this.services.set('postgres', { type: 'docker', container: 'test-postgres' });
    } catch (error) {
      // 可能容器已存在，尝试启动
      await this.execCommand(['docker', 'start', 'test-postgres']);
      this.services.set('postgres', { type: 'docker', container: 'test-postgres' });
    }
  }
  
  async startRedis() {
    const dockerCmd = [
      'docker', 'run', '-d',
      '--name', 'test-redis',
      '-p', '6379:6379',
      'redis:7-alpine'
    ];
    
    try {
      await this.execCommand(dockerCmd);
      this.services.set('redis', { type: 'docker', container: 'test-redis' });
    } catch (error) {
      await this.execCommand(['docker', 'start', 'test-redis']);
      this.services.set('redis', { type: 'docker', container: 'test-redis' });
    }
  }
  
  async startApplication() {
    const appProcess = spawn('npm', ['run', 'start:test'], {
      env: process.env,
      stdio: 'pipe'
    });
    
    this.services.set('app', { type: 'process', process: appProcess });
    
    // 监听应用输出
    appProcess.stdout.on('data', (data) => {
      console.log(`[APP] ${data}`);
    });
    
    appProcess.stderr.on('data', (data) => {
      console.error(`[APP ERROR] ${data}`);
    });
  }
  
  async waitForServices(services) {
    const checks = services.map(service => this.waitForService(service));
    await Promise.all(checks);
  }
  
  async waitForService(serviceName) {
    console.log(`Waiting for ${serviceName} to be ready...`);
    
    const maxAttempts = 30;
    const delay = 1000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const isReady = await this.checkServiceHealth(serviceName);
        if (isReady) {
          console.log(`✅ ${serviceName} is ready`);
          return;
        }
      } catch (error) {
        console.log(`Attempt ${attempt}/${maxAttempts}: ${serviceName} not ready yet`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    throw new Error(`${serviceName} failed to start within ${maxAttempts} attempts`);
  }
  
  async checkServiceHealth(serviceName) {
    switch (serviceName) {
      case 'postgres':
        return await this.checkPostgresHealth();
      case 'redis':
        return await this.checkRedisHealth();
      case 'app':
        return await this.checkAppHealth();
      default:
        return true;
    }
  }
  
  async checkPostgresHealth() {
    try {
      await this.execCommand([
        'docker', 'exec', 'test-postgres',
        'pg_isready', '-U', 'postgres'
      ]);
      return true;
    } catch {
      return false;
    }
  }
  
  async checkRedisHealth() {
    try {
      await this.execCommand([
        'docker', 'exec', 'test-redis',
        'redis-cli', 'ping'
      ]);
      return true;
    } catch {
      return false;
    }
  }
  
  async checkAppHealth() {
    try {
      const http = require('http');
      const port = process.env.PORT || 3001;
      
      return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/health`, (res) => {
          resolve(res.statusCode === 200);
        });
        
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
          req.destroy();
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }
  
  async runInitializationScripts(type) {
    const scriptsDir = path.join(process.cwd(), 'scripts', 'test-init');
    const scriptFile = path.join(scriptsDir, `${type}.js`);
    
    if (fs.existsSync(scriptFile)) {
      console.log(`Running initialization script for ${type}...`);
      const initScript = require(scriptFile);
      await initScript();
    }
  }
  
  async teardownEnvironment() {
    console.log('🧹 Tearing down test environment...');
    
    for (const [serviceName, service] of this.services) {
      try {
        if (service.type === 'docker') {
          await this.execCommand(['docker', 'stop', service.container]);
          await this.execCommand(['docker', 'rm', service.container]);
        } else if (service.type === 'process') {
          service.process.kill('SIGTERM');
        }
        console.log(`Stopped service: ${serviceName}`);
      } catch (error) {
        console.warn(`Failed to stop service ${serviceName}:`, error.message);
      }
    }
    
    this.services.clear();
    console.log('✅ Test environment cleaned up');
  }
  
  async execCommand(command) {
    return new Promise((resolve, reject) => {
      const process = spawn(command[0], command.slice(1), { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => stdout += data);
      process.stderr.on('data', (data) => stderr += data);
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed: ${command.join(' ')}\\n${stderr}`));
        }
      });
    });
  }
}

module.exports = TestEnvironmentManager;
```

## 📝 测试自动化最佳实践

### 监控和优化

```javascript
const TestAutomationBestPractices = {
  PIPELINE_OPTIMIZATION: {
    parallelization: [
      '并行执行独立的测试套件',
      '使用测试分片减少执行时间',
      '合理配置CI/CD工作器数量',
      '优化依赖安装和缓存策略'
    ],
    
    failFast: [
      '快速失败原则，及时终止失败的构建',
      '优先执行快速测试',
      '设置合理的超时时间',
      '智能重试机制'
    ],
    
    caching: [
      '缓存依赖包安装',
      '缓存构建产物',
      '缓存测试环境镜像',
      '增量测试执行'
    ]
  },
  
  QUALITY_GATES: {
    coverage: [
      '设置代码覆盖率阈值',
      '强制覆盖率不能下降',
      '分类别设置不同的覆盖率要求',
      '覆盖率趋势分析'
    ],
    
    performance: [
      '建立性能基准线',
      '监控性能回归',
      '设置响应时间阈值',
      '资源使用限制'
    ],
    
    security: [
      '依赖漏洞扫描',
      '代码安全审计',
      '敏感信息检测',
      '许可证合规检查'
    ]
  },
  
  MONITORING: {
    metrics: [
      '测试执行时间趋势',
      '测试成功率统计',
      '环境稳定性指标',
      '资源使用情况'
    ],
    
    alerting: [
      '测试失败即时通知',
      '覆盖率下降警告',
      '性能回归提醒',
      '环境异常报警'
    ]
  }
};
```

## 📝 总结

测试自动化是现代软件开发的核心实践：

- **全流程覆盖**：从代码提交到生产部署的完整自动化
- **质量保证**：多层次测试确保代码质量和系统稳定性
- **效率提升**：自动化执行减少人工成本和错误
- **持续改进**：监控和优化测试流程，不断提升效果

通过系统化的测试自动化实施，可以显著提高开发效率和产品质量。

## 🔗 相关资源

- [GitHub Actions文档](https://docs.github.com/en/actions)
- [GitLab CI/CD指南](https://docs.gitlab.com/ee/ci/)
- [Jenkins Pipeline文档](https://www.jenkins.io/doc/book/pipeline/)
- [测试自动化最佳实践](https://martinfowler.com/articles/practical-test-pyramid.html)
