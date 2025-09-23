# GitHub Actions

## 📋 概述

GitHub Actions是GitHub提供的持续集成和持续部署平台，允许您直接在GitHub仓库中自动化构建、测试和部署工作流程。

## 🎯 学习目标

- 掌握GitHub Actions的核心概念
- 学会编写和配置工作流程
- 了解Actions市场和自定义Actions
- 实现复杂的CI/CD流水线

## 📚 核心概念

### 工作流程（Workflows）

工作流程是由一个或多个作业组成的可配置自动化流程。

```yaml
# .github/workflows/example.yml
name: Example Workflow
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
```

### 事件（Events）

触发工作流程运行的特定活动。

```yaml
# 常见触发事件
on:
  # 推送事件
  push:
    branches: [ main, develop ]
    paths: [ 'src/**', 'package.json' ]
  
  # Pull Request事件
  pull_request:
    types: [ opened, synchronize, reopened ]
    branches: [ main ]
  
  # 定时事件
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点
  
  # 手动触发
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
```

### 作业（Jobs）

工作流程中的一组步骤，在同一运行器上执行。

```yaml
jobs:
  test:
    name: Test Application
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
```

### 步骤（Steps）

作业中的单个任务，可以运行命令或使用Actions。

```yaml
steps:
  # 使用预构建Action
  - name: Checkout repository
    uses: actions/checkout@v3
    with:
      fetch-depth: 0
  
  # 运行shell命令
  - name: Install dependencies
    run: |
      npm ci
      npm run build
  
  # 条件执行
  - name: Deploy to staging
    if: github.ref == 'refs/heads/develop'
    run: npm run deploy:staging
  
  # 设置环境变量
  - name: Set environment variables
    run: |
      echo "BUILD_TIME=$(date)" >> $GITHUB_ENV
      echo "COMMIT_SHA=${GITHUB_SHA::8}" >> $GITHUB_ENV
```

## 🛠 实用工作流程示例

### Node.js CI/CD流水线

```yaml
# .github/workflows/nodejs-cicd.yml
name: Node.js CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'

jobs:
  # 代码质量检查
  lint:
    name: Code Quality
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run Prettier check
        run: npm run format:check
      
      - name: TypeScript check
        run: npm run type-check

  # 安全扫描
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # 测试
  test:
    name: Test
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true

  # 构建
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, security, test]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-${{ github.sha }}
          path: dist/
          retention-days: 7

  # 部署到staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-${{ github.sha }}
          path: dist/
      
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          # 部署脚本
        env:
          STAGING_API_KEY: ${{ secrets.STAGING_API_KEY }}

  # 部署到生产环境
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-${{ github.sha }}
          path: dist/
      
      - name: Deploy to production
        run: |
          echo "Deploying to production environment..."
          # 生产部署脚本
        env:
          PRODUCTION_API_KEY: ${{ secrets.PRODUCTION_API_KEY }}
      
      - name: Create release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          draft: false
          prerelease: false
```

### Docker构建和推送

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## 🔧 高级功能

### 矩阵构建

```yaml
strategy:
  matrix:
    node-version: [16, 18, 20]
    os: [ubuntu-latest, windows-latest, macos-latest]
    include:
      - node-version: 18
        os: ubuntu-latest
        experimental: true
    exclude:
      - node-version: 16
        os: macos-latest
  fail-fast: false
  max-parallel: 4
```

### 条件执行

```yaml
steps:
  - name: Deploy to production
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    run: npm run deploy:prod
  
  - name: Comment on PR
    if: github.event_name == 'pull_request'
    uses: actions/github-script@v6
    with:
      script: |
        github.rest.issues.createComment({
          issue_number: context.issue.number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: 'Build completed successfully! 🎉'
        })
```

### 环境和密钥管理

```yaml
# 环境配置
environment:
  name: production
  url: https://example.com

# 使用密钥
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  API_KEY: ${{ secrets.API_KEY }}
  
# 环境变量
steps:
  - name: Set environment variables
    run: |
      echo "BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> $GITHUB_ENV
      echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV
```

### 自定义Action

```yaml
# action.yml
name: 'Setup Node.js with Cache'
description: 'Setup Node.js with dependency caching'
inputs:
  node-version:
    description: 'Node.js version'
    required: true
    default: '18'
  cache-dependency-path:
    description: 'Path to package-lock.json'
    required: false
    default: 'package-lock.json'

runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v3
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'
        cache-dependency-path: ${{ inputs.cache-dependency-path }}
    
    - run: npm ci
      shell: bash
```

## 📊 监控和调试

### 工作流程状态徽章

```markdown
![CI](https://github.com/username/repo/workflows/CI/badge.svg)
![Deploy](https://github.com/username/repo/workflows/Deploy/badge.svg?branch=main)
```

### 调试技巧

```yaml
steps:
  # 启用调试日志
  - name: Enable debug logging
    run: echo "ACTIONS_RUNNER_DEBUG=true" >> $GITHUB_ENV
  
  # 输出环境信息
  - name: Debug information
    run: |
      echo "GitHub Context:"
      echo "${{ toJson(github) }}"
      echo "Environment Variables:"
      env | sort
  
  # 使用tmate进行远程调试
  - name: Setup tmate session
    if: ${{ failure() }}
    uses: mxschmitt/action-tmate@v3
    timeout-minutes: 15
```

### 性能优化

```yaml
steps:
  # 缓存依赖
  - name: Cache node modules
    uses: actions/cache@v3
    with:
      path: ~/.npm
      key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-node-
  
  # 并行执行
  - name: Run tests in parallel
    run: npm test -- --maxWorkers=2
  
  # 条件缓存
  - name: Cache build
    if: steps.changes.outputs.src == 'true'
    uses: actions/cache@v3
    with:
      path: dist/
      key: build-${{ github.sha }}
```

## 🚀 最佳实践

### 1. 工作流程组织

```yaml
# 分离关注点
workflows:
  - ci.yml          # 持续集成
  - cd.yml          # 持续部署
  - security.yml    # 安全扫描
  - release.yml     # 发布管理
```

### 2. 密钥管理

```yaml
# 环境级别的密钥
environments:
  production:
    secrets:
      - DATABASE_URL
      - API_KEY
      - SSL_CERT
```

### 3. 错误处理

```yaml
steps:
  - name: Run tests
    run: npm test
    continue-on-error: true
  
  - name: Upload test results
    if: always()
    uses: actions/upload-artifact@v3
    with:
      name: test-results
      path: test-results.xml
```

### 4. 资源使用优化

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Cleanup disk space
        run: |
          sudo rm -rf /usr/share/dotnet
          sudo rm -rf /opt/ghc
          sudo rm -rf "/usr/local/share/boost"
```

## 🔍 故障排除

### 常见问题解决

1. **权限问题**

```yaml
permissions:
  contents: read
  packages: write
  pull-requests: write
  issues: write
```

2. **超时问题**

```yaml
jobs:
  build:
    timeout-minutes: 60
    
    steps:
      - name: Long running task
        timeout-minutes: 30
        run: npm run long-task
```

3. **依赖缓存问题**

```yaml
- name: Clear npm cache
  run: npm cache clean --force

- name: Delete node_modules
  run: rm -rf node_modules package-lock.json
```

## 📝 总结

GitHub Actions提供了强大而灵活的CI/CD平台，通过：

- 丰富的预构建Actions生态系统
- 灵活的工作流程配置
- 强大的矩阵构建支持
- 完善的环境和密钥管理

能够满足从简单到复杂的各种自动化需求，是现代软件开发的重要工具。

## 🔗 相关资源

- [GitHub Actions官方文档](https://docs.github.com/en/actions)
- [Actions市场](https://github.com/marketplace?type=actions)
- [工作流程语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [社区Actions](https://github.com/actions)
