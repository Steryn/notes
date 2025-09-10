# git 常用命令

## git 重置克隆镜像

查看所有 URL 相关配置（确认要删除的项）：

```bash
git config --global --get-regexp url.https
```

逐个删除这些配置（根据上一步的输出）：

```bash
git config --global --unset url.https://github.com.cnpmjs.org.insteadof
git config --global --unset url.https://hub.fastgit.xyz/.insteadof
git config --global --unset url.https://github.com.insteadof
git config --global --unset url.https://github.com.cnpmjs.org/.insteadof
git config --global --unset url.https://hub.fastgit.org/.insteadof
git config --global --unset url.https://githubfast.com.insteadof
```

如果有系统级配置（较少见），可以加上 --system 参数删除：

```bash
git config --system --unset url.https://github.com.cnpmjs.org.insteadof
# 其他配置同理
```

验证是否已清除：

```bash
git config list | grep url.https
```

执行后，所有 GitHub 相关的 URL 替换规则都会被移除，Git 将直接使用原始的 https://github.com 地址进行操作。如果需要重新配置镜像，可以只保留一个有效的规则，避免冲突。
