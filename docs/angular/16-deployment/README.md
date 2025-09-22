# 16 - 部署与构建

## 📖 学习目标

通过本章节学习，您将掌握：

- 生产环境构建
- 环境配置管理
- 静态资源优化
- 服务器部署
- Docker容器化
- CI/CD流水线
- 性能监控

## 🎯 核心概念

### 1. 部署流程

```
开发环境 → 构建优化 → 测试验证 → 生产部署 → 监控维护
```

### 2. 构建优化

- **代码分割**：按需加载模块
- **Tree Shaking**：移除未使用代码
- **压缩优化**：减少文件大小
- **缓存策略**：提高加载速度

### 3. 部署方式

- **静态托管**：GitHub Pages、Netlify、Vercel
- **服务器部署**：Nginx、Apache
- **容器化部署**：Docker、Kubernetes
- **云平台部署**：AWS、Azure、阿里云

## 🔧 生产环境构建

### 1. 基本构建配置

```typescript
// angular.json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/my-app",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ],
            "styles": [
              "src/styles.scss"
            ],
            "scripts": [],
            "optimization": true,
            "outputHashing": "all",
            "sourceMap": false,
            "namedChunks": false,
            "aot": true,
            "extractLicenses": true,
            "vendorChunk": false,
            "buildOptimizer": true
          },
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              "optimization": true,
              "outputHashing": "all",
              "sourceMap": false,
              "namedChunks": false,
              "aot": true,
              "extractLicenses": true,
              "vendorChunk": false,
              "buildOptimizer": true,
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "2mb",
                  "maximumError": "5mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "6kb",
                  "maximumError": "10kb"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

### 2. 构建命令

```bash
# 开发构建
ng build

# 生产构建
ng build --prod

# 指定环境
ng build --configuration=production

# 分析包大小
ng build --stats-json
npx webpack-bundle-analyzer dist/my-app/stats.json

# 构建并分析
ng build --prod --stats-json
```

### 3. 环境配置

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appName: 'My App',
  version: '1.0.0',
  debug: true
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.myapp.com',
  appName: 'My App',
  version: '1.0.0',
  debug: false
};

// environments/environment.staging.ts
export const environment = {
  production: false,
  apiUrl: 'https://staging-api.myapp.com',
  appName: 'My App (Staging)',
  version: '1.0.0',
  debug: true
};
```

## 🚀 静态资源优化

### 1. 图片优化

```typescript
// 使用WebP格式
// 在angular.json中配置
{
  "assets": [
    {
      "glob": "**/*",
      "input": "src/assets/images",
      "output": "assets/images"
    }
  ]
}

// 组件中使用
@Component({
  template: `
    <picture>
      <source srcset="assets/images/hero.webp" type="image/webp">
      <img src="assets/images/hero.jpg" alt="Hero image">
    </picture>
  `
})
export class HeroComponent {}
```

### 2. 字体优化

```scss
// styles.scss
@font-face {
  font-family: 'CustomFont';
  src: url('assets/fonts/custom-font.woff2') format('woff2'),
       url('assets/fonts/custom-font.woff') format('woff');
  font-display: swap; // 优化字体加载
  font-weight: 400;
  font-style: normal;
}

// 预加载关键字体
// index.html
<link rel="preload" href="assets/fonts/custom-font.woff2" as="font" type="font/woff2" crossorigin>
```

### 3. 缓存策略

```typescript
// service-worker配置
// ngsw-config.json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2|ani)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-freshness",
      "urls": [
        "/api/**"
      ],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 100,
        "maxAge": "3d",
        "timeout": "10s"
      }
    }
  ]
}
```

## 🌐 服务器部署

### 1. Nginx配置

```nginx
# nginx.conf
server {
    listen 80;
    server_name myapp.com;
    root /var/www/myapp/dist;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Angular路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 2. Apache配置

```apache
# .htaccess
RewriteEngine On

# 启用Gzip压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# 缓存设置
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Angular路由支持
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# 安全头
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>
```

## 🐳 Docker容器化

### 1. 多阶段构建Dockerfile

```dockerfile
# Dockerfile
# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build --prod

# 生产阶段
FROM nginx:alpine

# 复制构建结果
COPY --from=build /app/dist/my-app /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    image: myapp/backend:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/myapp
    depends_on:
      - db
    networks:
      - app-network

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
```

### 3. 构建和部署脚本

```bash
#!/bin/bash
# deploy.sh

# 构建Docker镜像
docker build -t myapp/frontend:latest .

# 停止旧容器
docker-compose down

# 启动新容器
docker-compose up -d

# 清理未使用的镜像
docker image prune -f

echo "部署完成！"
```

## 🔄 CI/CD流水线

### 1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test -- --watch=false --browsers=ChromeHeadless
    
    - name: Run linting
      run: npm run lint
    
    - name: Build application
      run: npm run build --prod

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/myapp
          git pull origin main
          npm ci
          npm run build --prod
          sudo systemctl reload nginx
```

### 2. GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:${NODE_VERSION}-alpine
  script:
    - npm ci
    - npm run test -- --watch=false --browsers=ChromeHeadless
    - npm run lint
  artifacts:
    reports:
      junit: coverage/junit.xml

build:
  stage: build
  image: node:${NODE_VERSION}-alpine
  script:
    - npm ci
    - npm run build --prod
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - scp -r dist/* $SERVER_USER@$SERVER_HOST:/var/www/myapp/
    - ssh $SERVER_USER@$SERVER_HOST "sudo systemctl reload nginx"
  only:
    - main
```

## 📊 性能监控

### 1. Web Vitals监控

```typescript
// performance.service.ts
import { Injectable } from '@angular/core';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  constructor() {
    this.initWebVitals();
  }

  private initWebVitals() {
    // 累积布局偏移
    getCLS((metric) => {
      this.sendMetric('CLS', metric.value);
    });

    // 首次输入延迟
    getFID((metric) => {
      this.sendMetric('FID', metric.value);
    });

    // 首次内容绘制
    getFCP((metric) => {
      this.sendMetric('FCP', metric.value);
    });

    // 最大内容绘制
    getLCP((metric) => {
      this.sendMetric('LCP', metric.value);
    });

    // 首次字节时间
    getTTFB((metric) => {
      this.sendMetric('TTFB', metric.value);
    });
  }

  private sendMetric(name: string, value: number) {
    // 发送到监控服务
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        name,
        value,
        timestamp: Date.now(),
        url: window.location.href
      });
      navigator.sendBeacon('/api/metrics', data);
    }
  }
}
```

### 2. 错误监控

```typescript
// error-monitoring.service.ts
import { Injectable, ErrorHandler } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorMonitoringService implements ErrorHandler {
  handleError(error: any): void {
    console.error('Application error:', error);
    
    // 发送错误到监控服务
    this.sendError(error);
  }

  private sendError(error: any) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    // 发送到错误监控服务
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/errors', JSON.stringify(errorData));
    }
  }
}

// 在app.module.ts中注册
@NgModule({
  providers: [
    { provide: ErrorHandler, useClass: ErrorMonitoringService }
  ]
})
export class AppModule {}
```

## 🎮 实践练习

### 练习1：配置生产环境构建

配置一个完整的生产环境构建流程：

- 环境变量配置
- 构建优化设置
- 静态资源优化
- 缓存策略配置

### 练习2：实现Docker部署

创建一个完整的Docker部署方案：

- 多阶段构建Dockerfile
- Docker Compose配置
- 自动化部署脚本
- 容器监控

## 📚 详细示例

### 完整的部署配置

```typescript
// deploy.config.ts
export const deployConfig = {
  environments: {
    development: {
      apiUrl: 'http://localhost:3000/api',
      debug: true,
      logLevel: 'debug'
    },
    staging: {
      apiUrl: 'https://staging-api.myapp.com/api',
      debug: true,
      logLevel: 'info'
    },
    production: {
      apiUrl: 'https://api.myapp.com/api',
      debug: false,
      logLevel: 'error'
    }
  },
  
  build: {
    optimization: true,
    sourceMap: false,
    namedChunks: false,
    aot: true,
    extractLicenses: true,
    vendorChunk: false,
    buildOptimizer: true
  },
  
  budgets: [
    {
      type: 'initial',
      maximumWarning: '2mb',
      maximumError: '5mb'
    },
    {
      type: 'anyComponentStyle',
      maximumWarning: '6kb',
      maximumError: '10kb'
    }
  ]
};
```

### 自动化部署脚本

```bash
#!/bin/bash
# deploy-production.sh

set -e

echo "开始生产环境部署..."

# 检查环境
if [ "$NODE_ENV" != "production" ]; then
    echo "错误：必须在生产环境中运行"
    exit 1
fi

# 安装依赖
echo "安装依赖..."
npm ci --only=production

# 运行测试
echo "运行测试..."
npm run test -- --watch=false --browsers=ChromeHeadless

# 代码检查
echo "代码检查..."
npm run lint

# 构建应用
echo "构建应用..."
npm run build --prod

# 备份当前版本
echo "备份当前版本..."
if [ -d "/var/www/myapp-backup" ]; then
    rm -rf /var/www/myapp-backup
fi
if [ -d "/var/www/myapp" ]; then
    mv /var/www/myapp /var/www/myapp-backup
fi

# 部署新版本
echo "部署新版本..."
mv dist/my-app /var/www/myapp

# 重启服务
echo "重启服务..."
sudo systemctl reload nginx

# 健康检查
echo "健康检查..."
sleep 5
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "部署成功！"
    # 清理备份
    rm -rf /var/www/myapp-backup
else
    echo "部署失败，回滚..."
    mv /var/www/myapp-backup /var/www/myapp
    sudo systemctl reload nginx
    exit 1
fi

echo "生产环境部署完成！"
```

## ✅ 学习检查

完成本章节后，请确认您能够：

- [ ] 配置生产环境构建
- [ ] 管理环境变量
- [ ] 优化静态资源
- [ ] 配置服务器部署
- [ ] 使用Docker容器化
- [ ] 设置CI/CD流水线
- [ ] 实现性能监控

## 🚀 下一步

完成本章节学习后，请继续学习[17-响应式表单高级功能](./../17-reactive-forms/README.md)。
