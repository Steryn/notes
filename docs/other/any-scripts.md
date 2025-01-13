# 脚本合集

## [git hash A]-[git-hash-B?]的所有文件变更情况

```bash
#!/bin/bash

# 显示使用方法
show_usage() {
    echo "使用方法: $0 <起始git-hash> [结束git-hash]"
    echo "  - 起始git-hash: 较早的提交点"
    echo "  - 结束git-hash: 较晚的提交点（可选，默认为 HEAD）"
    exit 1
}

# 检查参数
if [ $# -eq 0 ]; then
    show_usage
fi

# 设置起始和结束的 hash
START_HASH=$1
END_HASH=${2:-HEAD}  # 如果没有提供第二个参数，使用 HEAD

# 验证 git hash 是否有效
if ! git rev-parse --verify $START_HASH >/dev/null 2>&1; then
    echo "错误：无效的起始 git hash"
    exit 1
fi

if ! git rev-parse --verify $END_HASH >/dev/null 2>&1; then
    echo "错误：无效的结束 git hash"
    exit 1
fi

# 确保 START_HASH 比 END_HASH 更早
if ! git merge-base --is-ancestor $START_HASH $END_HASH; then
    echo "错误：起始 hash 必须比结束 hash 更早"
    exit 1
fi

# 显示比较的范围
echo "比较范围："
echo "从: $(git log -1 --format=%h\ -\ %s $START_HASH)"
echo "到: $(git log -1 --format=%h\ -\ %s $END_HASH)"
echo "----------------------------------------"

echo -e "\n➕ 新增的文件："
git diff --name-status $START_HASH $END_HASH | grep ^A | cut -f2-

echo -e "\n📝 修改的文件："
git diff --name-status $START_HASH $END_HASH | grep ^M | cut -f2-

echo -e "\n❌ 删除的文件："
git diff --name-status $START_HASH $END_HASH | grep ^D | cut -f2-

```
