export default [
  {
    "text": "Docker",
    "items": [
      { "text": "起步", "link": "start" },
      {
        "text": "版本A", items: [
          {
            text: "基础篇（1-4章）", link: "02-docker-basics", items: [
              { "text": "Docker简介与安装", "link": "01-docker-introduction" },
              { "text": "Docker基本概念", "link": "02-docker-basics" },
              { "text": "Docker镜像操作", "link": "03-docker-images" },
              { "text": "Docker容器操作", "link": "04-docker-containers" },
            ]
          },
          {
            text: "中级篇（5-8章）", link: "05-dockerfile", items: [
              { "text": "Dockerfile详解", "link": "05-dockerfile" },
              { "text": "Docker网络", "link": "06-docker-networking" },
              { "text": "Docker数据卷", "link": "07-docker-volumes" },
              { "text": "Docker Compose", "link": "08-docker-compose" },
            ]
          },
          {
            text: "高级篇（9-12章）", link: "09-multi-stage-builds", items: [
              { "text": "Docker多阶段构建", "link": "09-multi-stage-builds" },
              { "text": "Docker安全最佳实践", "link": "10-docker-security" },
              { "text": "Docker生产环境部署", "link": "11-production-deployment" },
              { "text": "Docker监控与日志", "link": "12-monitoring-logging" },
            ]
          },
        ]
      },
      {
        text: "版本B", items: [
          {
            text: "基础篇（1-4章）", link: "doc/02-docker-basics", items: [
              { "text": "Docker简介与安装", "link": "doc/01-docker-introduction" },
              { "text": "Docker基本概念", "link": "doc/02-docker-basics" },
              { "text": "Docker镜像操作", "link": "doc/03-docker-images" },
              { "text": "Docker容器操作", "link": "doc/04-docker-containers" },
            ]
          },
          {
            text: "中级篇（5-8章）", link: "doc/05-dockerfile", items: [
              { "text": "Dockerfile详解", "link": "doc/05-dockerfile" },
              { "text": "Docker网络", "link": "doc/06-docker-networking" },
              { "text": "Docker数据卷", "link": "doc/07-docker-volumes" },
              { "text": "Docker Compose", "link": "doc/08-docker-compose" },
            ]
          },
          {
            text: "高级篇（9-12章）", link: "doc/09-multi-stage-builds", items: [
              { "text": "Docker多阶段构建", "link": "doc/09-multi-stage-builds" },
              { "text": "Docker安全最佳实践", "link": "doc/10-docker-security" },
              { "text": "Docker生产环境部署", "link": "doc/11-production-deployment" },
              { "text": "Docker监控与日志", "link": "doc/12-monitoring-logging" },
            ]
          },
        ]
      }
    ]
  }
]
