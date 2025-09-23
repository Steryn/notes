# Docker安全最佳实践

## 🎯 学习目标

- 深入理解Docker安全模型和威胁向量
- 掌握容器和镜像的安全配置
- 学会使用安全扫描和监控工具
- 了解生产环境的安全防护策略

## 📚 Docker安全概述

### 1. 安全模型和威胁分析

```javascript
// Docker安全威胁模型
const dockerSecurityModel = {
  threat_vectors: {
    container_escape: {
      description: '容器逃逸攻击',
      risks: ['访问宿主机', '提权攻击', '横向移动'],
      mitigations: ['最小权限原则', 'seccomp配置', 'AppArmor/SELinux']
    },
    
    image_vulnerabilities: {
      description: '镜像漏洞',
      risks: ['恶意代码执行', '数据泄露', '系统入侵'],
      mitigations: ['漏洞扫描', '最小基础镜像', '定期更新']
    },
    
    privilege_escalation: {
      description: '权限提升',
      risks: ['获取root权限', '系统控制', '数据窃取'],
      mitigations: ['非root用户', '只读文件系统', '能力限制']
    },
    
    network_attacks: {
      description: '网络攻击',
      risks: ['流量劫持', '中间人攻击', '服务拒绝'],
      mitigations: ['网络隔离', 'TLS加密', '防火墙规则']
    },
    
    data_exposure: {
      description: '数据暴露',
      risks: ['敏感信息泄露', '配置泄露', '密钥暴露'],
      mitigations: ['secrets管理', '数据加密', '访问控制']
    }
  },
  
  defense_layers: [
    '主机安全',
    'Docker守护进程安全',
    '镜像安全',
    '容器运行时安全',
    '网络安全',
    '数据安全'
  ],
  
  compliance_frameworks: [
    'CIS Docker Benchmark',
    'NIST Container Security',
    'PCI DSS',
    'SOC 2',
    'ISO 27001'
  ]
};

console.log('Docker安全模型:', dockerSecurityModel);
```

### 2. 安全检查清单

```bash
#!/bin/bash
# docker-security-check.sh

echo "🔒 Docker安全检查清单"
echo "===================="

echo ""
echo "1. 🐳 Docker守护进程安全:"
echo "   - Docker版本是否最新:"
docker version --format '{{.Server.Version}}'

echo "   - 是否启用了用户命名空间:"
docker info | grep -i "userns"

echo "   - 监听端口配置:"
ps aux | grep dockerd | grep -o "\-H [^[:space:]]*"

echo ""
echo "2. 📦 镜像安全:"
echo "   - 检查基础镜像版本:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}"

echo ""
echo "3. 🏃 运行容器安全:"
echo "   - 运行为root的容器:"
docker ps --format "table {{.Names}}\t{{.Image}}" --filter "label=user=root"

echo "   - 特权容器:"
docker ps --format "table {{.Names}}\t{{.Image}}" --filter "label=privileged=true"

echo ""
echo "4. 🌐 网络安全:"
echo "   - 暴露的端口:"
docker ps --format "table {{.Names}}\t{{.Ports}}"

echo ""
echo "5. 💾 数据安全:"
echo "   - 挂载的敏感目录:"
docker inspect $(docker ps -q) | grep -E "(\"Source\"|\"Destination\")" | grep -E "(/etc|/var|/root|/home)"
```

## 🛡️ 镜像安全

### 1. 安全的基础镜像选择

```dockerfile
# ❌ 不安全的做法
FROM ubuntu:latest  # 使用latest标签，版本不确定
USER root          # 使用root用户
RUN apt-get update # 不清理apt缓存

# ✅ 安全的做法
FROM ubuntu:20.04  # 使用具体版本标签

# 更好的选择：使用官方minimal镜像
FROM ubuntu:20.04-minimal

# 最佳选择：使用distroless镜像
FROM gcr.io/distroless/java:11

# 或者使用Alpine Linux（更小更安全）
FROM alpine:3.16

# 更新系统并清理
RUN apk update && \
    apk upgrade && \
    apk add --no-cache ca-certificates && \
    rm -rf /var/cache/apk/*

# 创建非特权用户
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

# 设置工作目录权限
WORKDIR /app
RUN chown -R appuser:appgroup /app

# 切换到非特权用户
USER appuser
```

### 2. 镜像构建安全实践

```dockerfile
# Dockerfile.secure
FROM node:16-alpine AS base

# 更新基础镜像
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# 创建应用用户和组
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# 设置安全的工作目录
WORKDIR /app
RUN chown -R nextjs:nodejs /app

# 依赖安装阶段
FROM base AS deps
USER nextjs
COPY --chown=nextjs:nodejs package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf ~/.npm

# 构建阶段
FROM base AS builder
USER nextjs
COPY --chown=nextjs:nodejs package*.json ./
RUN npm ci
COPY --chown=nextjs:nodejs . .
RUN npm run build

# 生产阶段
FROM base AS runner
USER nextjs

# 只复制必要的文件
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 暴露端口
EXPOSE 3000

# 使用dumb-init处理信号
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### 3. 镜像签名和验证

```bash
# 启用Docker Content Trust
export DOCKER_CONTENT_TRUST=1

# 生成签名密钥
docker trust key generate mykey

# 为仓库添加签名者
docker trust signer add --key mykey.pub myuser myrepo

# 推送签名镜像
docker push myrepo/myimage:v1.0

# 验证镜像签名
docker trust inspect --pretty myrepo/myimage:v1.0

# 使用Notary验证（高级）
notary verify docker.io/myrepo/myimage v1.0
```

## 🏃 容器运行时安全

### 1. 安全运行配置

```bash
# ✅ 安全的容器运行实践

# 1. 使用非root用户
docker run --user 1000:1000 myapp

# 2. 只读根文件系统
docker run --read-only --tmpfs /tmp myapp

# 3. 删除不必要的能力
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp

# 4. 使用安全计算模式
docker run --security-opt seccomp=seccomp-profile.json myapp

# 5. 限制资源使用
docker run -m 512m --cpus="1.0" --pids-limit 100 myapp

# 6. 网络安全
docker run --network none myapp  # 无网络访问
docker run --network custom-network myapp  # 自定义网络

# 7. 禁用新权限
docker run --security-opt no-new-privileges:true myapp

# 8. 设置SELinux/AppArmor标签
docker run --security-opt label=level:s0:c100,c200 myapp

# 综合安全配置
docker run -d \
  --name secure-app \
  --user 1000:1000 \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --cap-drop ALL \
  --cap-add NET_BIND_SERVICE \
  --security-opt no-new-privileges:true \
  --security-opt seccomp=seccomp-profile.json \
  -m 512m \
  --cpus="0.5" \
  --pids-limit 50 \
  --network secure-network \
  myapp:latest
```

### 2. Seccomp安全配置

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": [
    "SCMP_ARCH_X86_64",
    "SCMP_ARCH_X86",
    "SCMP_ARCH_X32"
  ],
  "syscalls": [
    {
      "names": [
        "accept",
        "accept4",
        "access",
        "adjtimex",
        "alarm",
        "bind",
        "brk",
        "capget",
        "capset",
        "chdir",
        "chmod",
        "chown",
        "chown32",
        "clock_getres",
        "clock_gettime",
        "clock_nanosleep",
        "close",
        "connect",
        "copy_file_range",
        "creat",
        "dup",
        "dup2",
        "dup3",
        "epoll_create",
        "epoll_create1",
        "epoll_ctl",
        "epoll_ctl_old",
        "epoll_pwait",
        "epoll_wait",
        "epoll_wait_old",
        "eventfd",
        "eventfd2",
        "execve",
        "execveat",
        "exit",
        "exit_group",
        "faccessat",
        "fadvise64",
        "fadvise64_64",
        "fallocate",
        "fanotify_mark",
        "fchdir",
        "fchmod",
        "fchmodat",
        "fchown",
        "fchown32",
        "fchownat",
        "fcntl",
        "fcntl64",
        "fdatasync",
        "fgetxattr",
        "flistxattr",
        "flock",
        "fork",
        "fremovexattr",
        "fsetxattr",
        "fstat",
        "fstat64",
        "fstatat64",
        "fstatfs",
        "fstatfs64",
        "fsync",
        "ftruncate",
        "ftruncate64",
        "futex",
        "futimesat",
        "getcwd",
        "getdents",
        "getdents64",
        "getegid",
        "getegid32",
        "geteuid",
        "geteuid32",
        "getgid",
        "getgid32",
        "getgroups",
        "getgroups32",
        "getitimer",
        "getpeername",
        "getpgid",
        "getpgrp",
        "getpid",
        "getppid",
        "getpriority",
        "getrandom",
        "getresgid",
        "getresgid32",
        "getresuid",
        "getresuid32",
        "getrlimit",
        "get_robust_list",
        "getrusage",
        "getsid",
        "getsockname",
        "getsockopt",
        "get_thread_area",
        "gettid",
        "gettimeofday",
        "getuid",
        "getuid32",
        "getxattr",
        "inotify_add_watch",
        "inotify_init",
        "inotify_init1",
        "inotify_rm_watch",
        "io_cancel",
        "ioctl",
        "io_destroy",
        "io_getevents",
        "ioprio_get",
        "ioprio_set",
        "io_setup",
        "io_submit",
        "ipc",
        "kill",
        "lchown",
        "lchown32",
        "lgetxattr",
        "link",
        "linkat",
        "listen",
        "listxattr",
        "llistxattr",
        "_llseek",
        "lremovexattr",
        "lseek",
        "lsetxattr",
        "lstat",
        "lstat64",
        "madvise",
        "memfd_create",
        "mincore",
        "mkdir",
        "mkdirat",
        "mknod",
        "mknodat",
        "mlock",
        "mlock2",
        "mlockall",
        "mmap",
        "mmap2",
        "mprotect",
        "mq_getsetattr",
        "mq_notify",
        "mq_open",
        "mq_timedreceive",
        "mq_timedsend",
        "mq_unlink",
        "mremap",
        "msgctl",
        "msgget",
        "msgrcv",
        "msgsnd",
        "msync",
        "munlock",
        "munlockall",
        "munmap",
        "nanosleep",
        "newfstatat",
        "_newselect",
        "open",
        "openat",
        "pause",
        "pipe",
        "pipe2",
        "poll",
        "ppoll",
        "prctl",
        "pread64",
        "preadv",
        "prlimit64",
        "pselect6",
        "pwrite64",
        "pwritev",
        "read",
        "readahead",
        "readlink",
        "readlinkat",
        "readv",
        "recv",
        "recvfrom",
        "recvmmsg",
        "recvmsg",
        "remap_file_pages",
        "removexattr",
        "rename",
        "renameat",
        "renameat2",
        "restart_syscall",
        "rmdir",
        "rt_sigaction",
        "rt_sigpending",
        "rt_sigprocmask",
        "rt_sigqueueinfo",
        "rt_sigreturn",
        "rt_sigsuspend",
        "rt_sigtimedwait",
        "rt_tgsigqueueinfo",
        "sched_getaffinity",
        "sched_getattr",
        "sched_getparam",
        "sched_get_priority_max",
        "sched_get_priority_min",
        "sched_getscheduler",
        "sched_rr_get_interval",
        "sched_setaffinity",
        "sched_setattr",
        "sched_setparam",
        "sched_setscheduler",
        "sched_yield",
        "seccomp",
        "select",
        "semctl",
        "semget",
        "semop",
        "semtimedop",
        "send",
        "sendfile",
        "sendfile64",
        "sendmmsg",
        "sendmsg",
        "sendto",
        "setfsgid",
        "setfsgid32",
        "setfsuid",
        "setfsuid32",
        "setgid",
        "setgid32",
        "setgroups",
        "setgroups32",
        "setitimer",
        "setpgid",
        "setpriority",
        "setregid",
        "setregid32",
        "setresgid",
        "setresgid32",
        "setresuid",
        "setresuid32",
        "setreuid",
        "setreuid32",
        "setrlimit",
        "set_robust_list",
        "setsid",
        "setsockopt",
        "set_thread_area",
        "set_tid_address",
        "setuid",
        "setuid32",
        "setxattr",
        "shmat",
        "shmctl",
        "shmdt",
        "shmget",
        "shutdown",
        "sigaltstack",
        "signalfd",
        "signalfd4",
        "sigreturn",
        "socket",
        "socketcall",
        "socketpair",
        "splice",
        "stat",
        "stat64",
        "statfs",
        "statfs64",
        "statx",
        "symlink",
        "symlinkat",
        "sync",
        "sync_file_range",
        "syncfs",
        "sysinfo",
        "tee",
        "tgkill",
        "time",
        "timer_create",
        "timer_delete",
        "timerfd_create",
        "timerfd_gettime",
        "timerfd_settime",
        "timer_getoverrun",
        "timer_gettime",
        "timer_settime",
        "times",
        "tkill",
        "truncate",
        "truncate64",
        "ugetrlimit",
        "umask",
        "uname",
        "unlink",
        "unlinkat",
        "utime",
        "utimensat",
        "utimes",
        "vfork",
        "vmsplice",
        "wait4",
        "waitid",
        "waitpid",
        "write",
        "writev"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

### 3. AppArmor/SELinux配置

```bash
# AppArmor配置
# /etc/apparmor.d/docker-nginx
profile docker-nginx flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>
  
  network inet tcp,
  network inet udp,
  network inet6 tcp,
  network inet6 udp,
  
  deny @{PROC}/{*,**^[0-9*],sys/kernel/shm*} wkx,
  deny @{PROC}/sysrq-trigger rwklx,
  deny @{PROC}/mem rwklx,
  deny @{PROC}/kmem rwklx,
  deny @{PROC}/kcore rwklx,
  deny mount,
  deny /sys/[^f]*/** wklx,
  deny /sys/f[^s]*/** wklx,
  deny /sys/fs/[^c]*/** wklx,
  deny /sys/fs/c[^g]*/** wklx,
  deny /sys/fs/cg[^r]*/** wklx,
  deny /sys/firmware/efi/efivars/** rwklx,
  deny /sys/kernel/security/** rwklx,
  
  # 允许nginx访问
  /usr/sbin/nginx mrix,
  /var/log/nginx/** rw,
  /var/cache/nginx/** rw,
  /usr/share/nginx/html/** r,
  /etc/nginx/** r,
}

# 加载AppArmor配置
sudo apparmor_parser -r /etc/apparmor.d/docker-nginx

# 使用AppArmor运行容器
docker run --security-opt apparmor=docker-nginx nginx
```

## 🔐 密钥和配置管理

### 1. Docker Secrets

```bash
# 创建secrets
echo "mysecretpassword" | docker secret create db_password -
docker secret create api_key ./api_key.txt

# 在compose中使用secrets
# docker-compose.yml
version: '3.8'

services:
  web:
    image: myapp
    secrets:
      - db_password
      - api_key
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
      - API_KEY_FILE=/run/secrets/api_key

secrets:
  db_password:
    external: true
  api_key:
    file: ./api_key.txt
```

### 2. 环境变量安全

```dockerfile
# ❌ 不安全的做法
ENV API_KEY=secret123
ENV DB_PASSWORD=password

# ✅ 安全的做法
# 使用ARG传递构建时密钥，运行时不保留
ARG API_KEY
RUN curl -H "Authorization: Bearer $API_KEY" api.example.com/setup && \
    unset API_KEY

# 使用多阶段构建分离密钥
FROM alpine AS secrets
ARG API_KEY
RUN echo "$API_KEY" > /tmp/api_key

FROM alpine AS runtime
COPY --from=secrets /tmp/api_key /run/secrets/api_key
RUN rm /tmp/api_key
```

### 3. 配置文件加密

```bash
#!/bin/bash
# encrypt-config.sh

CONFIG_FILE="app.conf"
ENCRYPTED_FILE="app.conf.enc"
KEY_FILE="encryption.key"

# 生成加密密钥
openssl rand -base64 32 > $KEY_FILE

# 加密配置文件
openssl enc -aes-256-cbc -salt -in $CONFIG_FILE -out $ENCRYPTED_FILE -pass file:$KEY_FILE

# 在容器中解密
# COPY decrypt-and-run.sh /usr/local/bin/
# ENTRYPOINT ["/usr/local/bin/decrypt-and-run.sh"]

cat > decrypt-and-run.sh << 'EOF'
#!/bin/sh
# 从环境变量或文件获取密钥
if [ -f "/run/secrets/encryption_key" ]; then
    KEY_FILE="/run/secrets/encryption_key"
else
    echo "Encryption key not found!"
    exit 1
fi

# 解密配置文件
openssl enc -aes-256-cbc -d -in /app/app.conf.enc -out /app/app.conf -pass file:$KEY_FILE

# 启动应用
exec "$@"
EOF

chmod +x decrypt-and-run.sh
```

## 🔍 安全扫描和监控

### 1. 漏洞扫描工具

```bash
# 使用Trivy扫描镜像
trivy image myapp:latest

# 扫描文件系统
trivy fs .

# 生成报告
trivy image --format json --output report.json myapp:latest

# 使用Clair扫描
docker run -d --name clair-db postgres:latest
docker run -d --name clair --link clair-db:postgres quay.io/coreos/clair:latest

# 使用Grype扫描
grype myapp:latest

# 使用Snyk扫描
snyk test --docker myapp:latest

# 自动化扫描脚本
#!/bin/bash
# security-scan.sh

IMAGE_NAME=$1
REPORT_DIR="./security-reports"

mkdir -p $REPORT_DIR

echo "🔍 开始安全扫描: $IMAGE_NAME"

# Trivy扫描
echo "📋 Trivy扫描..."
trivy image --format json --output "$REPORT_DIR/trivy-report.json" $IMAGE_NAME
trivy image --format table $IMAGE_NAME

# 检查高危漏洞
HIGH_VULNS=$(trivy image --format json $IMAGE_NAME | jq '.Results[].Vulnerabilities[] | select(.Severity=="HIGH" or .Severity=="CRITICAL") | .VulnerabilityID' | wc -l)

if [ $HIGH_VULNS -gt 0 ]; then
    echo "⚠️ 发现 $HIGH_VULNS 个高危漏洞"
    exit 1
else
    echo "✅ 未发现高危漏洞"
fi
```

### 2. 运行时安全监控

```bash
# 使用Falco进行运行时监控
# falco-rules.yaml
- rule: Unexpected container behavior
  desc: Detect unexpected behavior in containers
  condition: >
    spawned_process and container and
    (proc.name in (nc, netcat, ncat, nmap, dig, nslookup, tcpdump))
  output: >
    Unexpected process spawned in container
    (user=%user.name command=%proc.cmdline container_id=%container.id 
     container_name=%container.name image=%container.image.repository)
  priority: WARNING

- rule: Container with sensitive mount
  desc: Detect containers with sensitive mounts
  condition: >
    container and container.mounts intersects (/proc, /var/run/docker.sock, /etc)
  output: >
    Container with sensitive mount detected
    (container_id=%container.id container_name=%container.name 
     image=%container.image.repository mounts=%container.mounts)
  priority: WARNING

# 启动Falco
docker run --rm -i -t \
  --name falco \
  --privileged \
  -v /var/run/docker.sock:/host/var/run/docker.sock \
  -v /dev:/host/dev \
  -v /proc:/host/proc:ro \
  -v /boot:/host/boot:ro \
  -v /lib/modules:/host/lib/modules:ro \
  -v /usr:/host/usr:ro \
  -v $PWD/falco-rules.yaml:/etc/falco/local_rules.yaml \
  falcosecurity/falco:latest
```

### 3. 安全监控脚本

```bash
#!/bin/bash
# security-monitor.sh

echo "🔒 Docker安全监控"
echo "=================="

echo ""
echo "1. 🔍 容器权限检查:"
docker ps --format "table {{.Names}}\t{{.Image}}" | while read name image; do
    if [ "$name" != "NAMES" ]; then
        privileged=$(docker inspect $name 2>/dev/null | jq '.[0].HostConfig.Privileged' 2>/dev/null)
        user=$(docker inspect $name 2>/dev/null | jq -r '.[0].Config.User' 2>/dev/null)
        readonly=$(docker inspect $name 2>/dev/null | jq '.[0].HostConfig.ReadonlyRootfs' 2>/dev/null)
        
        echo "  容器: $name"
        echo "    特权模式: ${privileged:-unknown}"
        echo "    运行用户: ${user:-root}"
        echo "    只读根文件系统: ${readonly:-false}"
        echo ""
    fi
done

echo "2. 🌐 网络暴露检查:"
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "0\.0\.0\.0|:::"

echo ""
echo "3. 💾 敏感挂载检查:"
docker inspect $(docker ps -q) 2>/dev/null | \
jq -r '.[] | select(.Mounts != null) | .Name + ": " + (.Mounts[] | select(.Source | test("/etc|/var|/root|/home|/proc|/sys")) | .Source)' 2>/dev/null

echo ""
echo "4. 🔑 Capabilities检查:"
docker ps -q | xargs -I {} docker inspect {} 2>/dev/null | \
jq -r '.[] | .Name + ": " + (.HostConfig.CapAdd // [] | join(","))' 2>/dev/null

echo ""
echo "5. 📊 资源限制检查:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null
```

## 📋 安全配置模板

### 1. 安全的Compose配置

```yaml
# docker-compose.secure.yml
version: '3.8'

services:
  web:
    image: myapp:latest
    user: "1000:1000"
    read_only: true
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=100m
      - /var/cache:rw,noexec,nosuid,size=50m
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true
      - seccomp:./seccomp-profile.json
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    networks:
      - frontend
    secrets:
      - api_key
      - db_password
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  db:
    image: postgres:13
    user: "999:999"
    read_only: true
    tmpfs:
      - /tmp:rw,noexec,nosuid
      - /var/run/postgresql:rw,noexec,nosuid
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - backend
    secrets:
      - db_password
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password

networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
  backend:
    driver: bridge
    internal: true

volumes:
  db-data:
    driver: local

secrets:
  api_key:
    external: true
  db_password:
    external: true
```

### 2. CI/CD安全检查

```yaml
# .github/workflows/security.yml
name: Security Checks

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build image
      run: docker build -t test-image .
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'test-image'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
    
    - name: Run Hadolint
      uses: hadolint/hadolint-action@v2.0.0
      with:
        dockerfile: Dockerfile
    
    - name: Security hardening check
      run: |
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
          docker/docker-bench-security
```

## 📝 下一步

现在您已经掌握了Docker安全配置，接下来学习：

1. **[Docker生产环境部署](./11-production-deployment.md)** - 学习生产部署策略
2. **[Docker监控与日志](./12-monitoring-logging.md)** - 掌握监控和日志管理

## 🎯 本章要点

- ✅ 理解Docker安全威胁模型和防护策略
- ✅ 掌握镜像和容器的安全配置
- ✅ 学会使用安全扫描和监控工具
- ✅ 了解密钥管理和访问控制
- ✅ 掌握安全配置模板和最佳实践

继续深入学习Docker生产环境部署！🐳
