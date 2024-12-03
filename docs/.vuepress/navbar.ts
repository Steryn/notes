import { defineNavbarConfig } from "vuepress-theme-plume";

export const navbar = defineNavbarConfig([
  { text: "首页", link: "/" },
  { text: "Vue", items: [{ text: "Vue3", link: "/vue/vue3/README.md" }] },
  {
    text: "笔记",
    items: [{ text: "语法示例", link: "/notes/common/README.md" }],
  },
  { text: "文章", link: "/blog/" },
  { text: "标签", link: "/blog/tags/" },
  { text: "归档", link: "/blog/archives/" },
]);
