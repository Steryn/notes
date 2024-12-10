#!/bin/bash

# 设置文档目录路径和输出文件
DOCS_DIR="./docs/vue"
OUTPUT_FILE="./docs/.vitepress/sidebar-vue.ts"

# 将字符串的首字母大写的函数
capitalize() {
    echo "$1" | awk '{print toupper(substr($0,1,1)) substr($0,2)}'
}

# 初始化输出文件
echo "export default [" > "$OUTPUT_FILE"

# 用于跟踪当前类别和其他内容
current_category=""
other_content=""
start_content=""

# 首先处理"起步"类别
for file in "$DOCS_DIR"/*.md; do
    filename=$(basename "$file" .md)
    
    # 确定类别
    if [[ $filename == *"start"* ]]; then
        category="起步"
        # 获取标题
        title=$(sed -n '/^# /p' "$file" | head -n 1 | sed 's/^# //')
        if [ -z "$title" ]; then
            title=$(capitalize "$filename")
        fi
        
        if [ -z "$start_content" ]; then
            start_content="  {
    \"text\": \"起步\",
    \"items\": [
"
        fi
        start_content+="      { \"text\": \"$title\", \"link\": \"$filename\" },"
    fi
done

# 如果存在起步内容，写入文件
if [ ! -z "$start_content" ]; then
    echo "${start_content%,}" >> "$OUTPUT_FILE"
    echo "    ]" >> "$OUTPUT_FILE"
    echo "  }," >> "$OUTPUT_FILE"
fi

# 处理其他类别
for file in "$DOCS_DIR"/*.md; do
    filename=$(basename "$file" .md)
    
    # 跳过起步类别的文件
    if [[ $filename == *"start"* ]]; then
        continue
    fi
    
    # 确定类别
    if [[ $filename == *-* ]]; then
        category=$(capitalize "$(echo "$filename" | cut -d'-' -f1)")
    else
        category="其他"
    fi
    
    # 获取标题
    title=$(sed -n '/^# /p' "$file" | head -n 1 | sed 's/^# //')
    if [ -z "$title" ]; then
        ti,le=$(capitalize "$filename")
    fi
    
    # 处理类别变化
    if [ "$category" != "$current_category" ]; then
        if [ ! -z "$current_category" ]; then
            if [ "$current_category" = "其他" ]; then
                other_content+="    ]
  },
"
            else
                echo "    ]" >> "$OUTPUT_FILE"
                echo "  }," >> "$OUTPUT_FILE"
            fi
        fi
        if [ "$category" = "其他" ]; then
            other_content+="  {
    \"text\": \"$category\",
    \"items\": [
"
        else
            echo "  {" >> "$OUTPUT_FILE"
            echo "    \"text\": \"$category\"," >> "$OUTPUT_FILE"
            echo "    \"items\": [" >> "$OUTPUT_FILE"
        fi
        current_category=$category
    fi
    
    # 添加文件条目
    if [ "$category" = "其他" ]; then
        other_content+="      { \"text\": \"$title\", \"link\": \"$filename\" },
"
    else
        echo "      { \"text\": \"$title\", \"link\": \"$filename\" }," >> "$OUTPUT_FILE"
    fi
done

# 处理最后一个类别
if [ "$current_category" != "其他" ]; then
    echo "    ]" >> "$OUTPUT_FILE"
    echo "  }," >> "$OUTPUT_FILE"
fi

# 添加 其他 类别（如果存在）
if [ ! -z "$other_content" ]; then
    echo "${other_content%,}" >> "$OUTPUT_FILE"
fi

# 关闭主数组
echo "];" >> "$OUTPUT_FILE"

echo "侧边栏配置已生成到 $OUTPUT_FILE"