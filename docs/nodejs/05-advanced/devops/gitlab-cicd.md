# GitLab CI/CD

## 📋 概述

GitLab CI/CD是GitLab内置的持续集成和持续部署解决方案，通过`.gitlab-ci.yml`文件定义流水线，提供完整的DevOps平台体验。

## 🎯 学习目标

- 掌握GitLab CI/CD的核心概念
- 学会编写和配置`.gitlab-ci.yml`
- 了解GitLab Runner和执行环境
- 实现复杂的CI/CD流水线

## 📚 核心概念

### Pipeline（流水线）

由多个阶段组成的自动化流程。

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "18"

build:
  stage: build
  image: node:18-alpine
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour
```

### Job（作业）

流水线中的基本执行单元。

```yaml
test:
  stage: test
  image: node:18-alpine
  services:
    - redis:6-alpine
    - postgres:13-alpine
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: testuser
    POSTGRES_PASSWORD: testpass
    REDIS_URL: redis://redis:6379
  before_script:
    - npm ci
  script:
    - npm run test:unit
    - npm run test:integration
  coverage: '/Coverage: \d+\.\d+%/'
  artifacts:
    reports:
      junit: test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

### Runner（运行器）

执行CI/CD作业的代理程序。

```yaml
# 指定特定的Runner
deploy:
  stage: deploy
  tags:
    - docker
    - production
  script:
    - kubectl apply -f k8s/
```

## 🛠 完整CI/CD配置示例

### Node.js应用流水线

```yaml
# .gitlab-ci.yml
image: node:18-alpine

stages:
  - prepare
  - quality
  - test
  - build
  - security
  - deploy
  - cleanup

variables:
  NODE_ENV: "production"
  DOCKER_REGISTRY: $CI_REGISTRY
  IMAGE_TAG: $CI_COMMIT_SHORT_SHA
  KUBECONFIG: /tmp/kubeconfig

# 全局缓存配置
cache: &global_cache
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/
  policy: pull-push

# 准备阶段
prepare:
  stage: prepare
  cache:
    <<: *global_cache
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 hour
  only:
    changes:
      - package-lock.json
      - package.json

# 代码质量检查
lint:
  stage: quality
  cache:
    <<: *global_cache
    policy: pull
  script:
    - npm run lint -- --format=junit --output-file=lint-results.xml
  artifacts:
    reports:
      junit: lint-results.xml
    expire_in: 1 week
  except:
    - schedules

# 类型检查
type-check:
  stage: quality
  cache:
    <<: *global_cache
    policy: pull
  script:
    - npm run type-check
  except:
    - schedules

# 安全审计
security-audit:
  stage: quality
  cache:
    <<: *global_cache
    policy: pull
  script:
    - npm audit --audit-level high
    - npx snyk test --json > snyk-results.json || true
  artifacts:
    paths:
      - snyk-results.json
    expire_in: 1 week
  allow_failure: true

# 单元测试
unit-test:
  stage: test
  cache:
    <<: *global_cache
    policy: pull
  script:
    - npm run test:unit -- --coverage --reporters=default --reporters=jest-junit
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 1 week

# 集成测试
integration-test:
  stage: test
  services:
    - redis:6-alpine
    - postgres:13-alpine
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: testuser
    POSTGRES_PASSWORD: testpass
    REDIS_URL: redis://redis:6379
    DATABASE_URL: postgres://testuser:testpass@postgres:5432/testdb
  cache:
    <<: *global_cache
    policy: pull
  script:
    - npm run test:integration
  artifacts:
    reports:
      junit: integration-test-results.xml
    expire_in: 1 week

# E2E测试
e2e-test:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  cache:
    <<: *global_cache
    policy: pull
  services:
    - name: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
      alias: app
  variables:
    BASE_URL: http://app:3000
  script:
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 1 week
  allow_failure: true

# 构建应用
build:
  stage: build
  cache:
    <<: *global_cache
    policy: pull
  script:
    - npm run build
    - echo "BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" > build-info.txt
    - echo "GIT_COMMIT=$CI_COMMIT_SHA" >> build-info.txt
    - echo "PIPELINE_ID=$CI_PIPELINE_ID" >> build-info.txt
  artifacts:
    paths:
      - dist/
      - build-info.txt
    expire_in: 1 day

# Docker镜像构建
docker-build:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  variables:
    DOCKER_HOST: tcp://docker:2376
    DOCKER_TLS_CERTDIR: "/certs"
    DOCKER_TLS_VERIFY: 1
    DOCKER_CERT_PATH: "$DOCKER_TLS_CERTDIR/client"
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - |
      docker build \
        --build-arg NODE_ENV=production \
        --build-arg BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg GIT_COMMIT=$CI_COMMIT_SHA \
        -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA \
        -t $CI_REGISTRY_IMAGE:latest \
        .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
  dependencies:
    - build

# 容器安全扫描
container-scan:
  stage: security
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_HOST: tcp://docker:2376
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - |
      docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
        aquasec/trivy image \
        --format template --template "@contrib/junit.tpl" \
        --output trivy-results.xml \
        $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  artifacts:
    reports:
      junit: trivy-results.xml
    expire_in: 1 week
  dependencies:
    - docker-build
  allow_failure: true

# 部署到开发环境
deploy-dev:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: development
    url: https://dev.example.com
  variables:
    KUBE_NAMESPACE: development
  before_script:
    - echo $KUBECONFIG_DEV | base64 -d > $KUBECONFIG
  script:
    - |
      kubectl set image deployment/app \
        app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA \
        --namespace=$KUBE_NAMESPACE
    - |
      kubectl rollout status deployment/app \
        --namespace=$KUBE_NAMESPACE \
        --timeout=300s
    - |
      kubectl get pods --namespace=$KUBE_NAMESPACE -l app=myapp
  only:
    - develop
  dependencies:
    - docker-build

# 部署到预发布环境
deploy-staging:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: staging
    url: https://staging.example.com
  variables:
    KUBE_NAMESPACE: staging
  before_script:
    - echo $KUBECONFIG_STAGING | base64 -d > $KUBECONFIG
  script:
    - |
      kubectl set image deployment/app \
        app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA \
        --namespace=$KUBE_NAMESPACE
    - |
      kubectl rollout status deployment/app \
        --namespace=$KUBE_NAMESPACE \
        --timeout=600s
    - sleep 30  # 等待服务启动
    - curl -f https://staging.example.com/health || exit 1
  only:
    - main
  dependencies:
    - docker-build

# 部署到生产环境
deploy-production:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://example.com
  variables:
    KUBE_NAMESPACE: production
  before_script:
    - echo $KUBECONFIG_PROD | base64 -d > $KUBECONFIG
  script:
    - |
      kubectl set image deployment/app \
        app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA \
        --namespace=$KUBE_NAMESPACE
    - |
      kubectl rollout status deployment/app \
        --namespace=$KUBE_NAMESPACE \
        --timeout=900s
    - sleep 60  # 等待服务完全启动
    - curl -f https://example.com/health || exit 1
  when: manual
  only:
    - main
  dependencies:
    - docker-build

# 清理作业
cleanup:
  stage: cleanup
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_HOST: tcp://docker:2376
  script:
    - docker system prune -f
  when: always
  allow_failure: true

# 定时任务 - 依赖更新检查
dependency-update:
  stage: quality
  script:
    - npm outdated
    - npx ncu --doctor --upgrade
  only:
    - schedules
  allow_failure: true
```

## 🔧 高级功能

### 并行和矩阵作业

```yaml
# 并行测试
test:
  stage: test
  parallel:
    matrix:
      - NODE_VERSION: ["16", "18", "20"]
        OS: ["ubuntu", "alpine"]
  image: node:${NODE_VERSION}-${OS}
  script:
    - npm ci
    - npm test

# 手动并行
test-parallel:
  stage: test
  parallel: 3
  script:
    - npm run test -- --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

### 条件执行和规则

```yaml
# 复杂的执行规则
deploy:
  stage: deploy
  script: echo "Deploying..."
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
      allow_failure: false
    - if: $CI_COMMIT_BRANCH == "develop"
      when: always
    - if: $CI_MERGE_REQUEST_IID
      when: never
    - changes:
        - "src/**/*"
        - "package.json"
      when: on_success

# 变量条件
test-feature:
  script: npm run test:feature
  rules:
    - if: $FEATURE_ENABLED == "true"
```

### 动态子流水线

```yaml
# 父流水线
trigger-child:
  stage: deploy
  trigger:
    include: 
      - local: 'child-pipeline.yml'
    strategy: depend
  variables:
    ENVIRONMENT: production
    VERSION: $CI_COMMIT_SHORT_SHA

# child-pipeline.yml
child-job:
  script:
    - echo "Environment: $ENVIRONMENT"
    - echo "Version: $VERSION"
    - kubectl apply -f manifests/
```

### 多项目流水线

```yaml
# 触发其他项目的流水线
trigger-downstream:
  stage: deploy
  trigger:
    project: group/downstream-project
    branch: main
    strategy: depend
  variables:
    UPSTREAM_COMMIT: $CI_COMMIT_SHA
```

## 📊 监控和报告

### 自定义报告

```yaml
generate-report:
  stage: deploy
  script:
    - npm run generate:report
  artifacts:
    reports:
      # 测试报告
      junit: test-results.xml
      # 覆盖率报告
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
      # 性能报告
      performance: performance.json
      # 安全扫描报告
      sast: sast-results.json
      dependency_scanning: dependency-scan.json
    paths:
      - reports/
    expire_in: 1 month
```

### Slack通知

```yaml
notify-slack:
  stage: .post
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - |
      if [ "$CI_JOB_STATUS" = "success" ]; then
        COLOR="good"
        MESSAGE="✅ Pipeline succeeded"
      else
        COLOR="danger"
        MESSAGE="❌ Pipeline failed"
      fi
      
      curl -X POST -H 'Content-type: application/json' \
        --data "{
          \"channel\": \"#deployments\",
          \"username\": \"GitLab CI\",
          \"text\": \"$MESSAGE\",
          \"color\": \"$COLOR\",
          \"fields\": [
            {\"title\": \"Project\", \"value\": \"$CI_PROJECT_NAME\", \"short\": true},
            {\"title\": \"Branch\", \"value\": \"$CI_COMMIT_REF_NAME\", \"short\": true},
            {\"title\": \"Commit\", \"value\": \"$CI_COMMIT_SHORT_SHA\", \"short\": true},
            {\"title\": \"Pipeline\", \"value\": \"$CI_PIPELINE_URL\", \"short\": true}
          ]
        }" \
        $SLACK_WEBHOOK_URL
  when: always
```

## 🔍 调试和优化

### 调试技巧

```yaml
debug:
  stage: test
  script:
    - echo "=== Environment Variables ==="
    - env | sort
    - echo "=== GitLab CI Variables ==="
    - echo "CI_PROJECT_NAME: $CI_PROJECT_NAME"
    - echo "CI_COMMIT_SHA: $CI_COMMIT_SHA"
    - echo "CI_PIPELINE_ID: $CI_PIPELINE_ID"
    - echo "=== System Information ==="
    - uname -a
    - df -h
    - free -m
  when: manual
  allow_failure: true
```

### 性能优化

```yaml
# 缓存优化
variables:
  npm_config_cache: "$CI_PROJECT_DIR/.npm"

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/
  policy: pull-push

# 分层构建
build:
  stage: build
  script:
    - |
      if [ -d "node_modules" ]; then
        echo "Using cached dependencies"
      else
        echo "Installing dependencies"
        npm ci
      fi
    - npm run build
```

## 🚀 最佳实践

### 1. 流水线结构

```yaml
# 推荐的阶段组织
stages:
  - prepare      # 准备工作
  - validate     # 代码验证
  - test         # 测试阶段
  - build        # 构建阶段
  - security     # 安全扫描
  - deploy       # 部署阶段
  - verify       # 部署验证
  - cleanup      # 清理工作
```

### 2. 变量管理

```yaml
# 项目级别变量
variables:
  NODE_ENV: production
  DOCKER_REGISTRY: $CI_REGISTRY
  
# 环境特定变量
deploy-prod:
  variables:
    ENVIRONMENT: production
    REPLICAS: "3"
    RESOURCES_LIMIT_CPU: "1000m"
    RESOURCES_LIMIT_MEMORY: "1Gi"
```

### 3. 安全实践

```yaml
# 敏感信息处理
deploy:
  script:
    - echo $DATABASE_URL | sed 's/:.*/:[REDACTED]/' # 隐藏密码
    - kubectl create secret generic app-secrets \
        --from-literal=database-url="$DATABASE_URL" \
        --dry-run=client -o yaml | kubectl apply -f -
```

## 📝 总结

GitLab CI/CD提供了完整的DevOps解决方案，具有：

- 与GitLab深度集成的优势
- 强大的流水线配置能力
- 丰富的报告和监控功能
- 灵活的部署策略支持

是现代软件开发团队的优秀选择。

## 🔗 相关资源

- [GitLab CI/CD文档](https://docs.gitlab.com/ee/ci/)
- [GitLab Runner文档](https://docs.gitlab.com/runner/)
- [CI/CD配置参考](https://docs.gitlab.com/ee/ci/yaml/)
- [GitLab DevOps平台](https://about.gitlab.com/stages-devops-lifecycle/)
