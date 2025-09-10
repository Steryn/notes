# Git 代理地址

## 设置镜像源（推荐使用以下任一镜像）

### 选项 1：使用 nuaa 镜像

```bash
git config --global url."https://hub.nuaa.cf".insteadOf https://github.com
```

### 选项 2：使用 githubfast 镜像

```bash
git config --global url."https://githubfast.com".insteadOf https://github.com
```

### 选项 3：使用 ghproxy 镜像

```bash
git config --global url."https://mirror.ghproxy.com/https://github.com".insteadOf https://github.com
```

## 检查当前配置

```bash
# 查看全局配置，确认镜像是否设置成功
git config --global --list
```

## 取消镜像配置（如需恢复默认）

```bash
# 取消 nuaa 镜像配置
git config --global --unset url."https://hub.nuaa.cf".insteadOf https://github.com

# 取消 githubfast 镜像配置
git config --global --unset url."https://githubfast.com".insteadOf https://github.com

# 取消 ghproxy 镜像配置
git config --global --unset url."https://mirror.ghproxy.com/https://github.com".insteadOf https://github.com
```
