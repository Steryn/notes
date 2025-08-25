import { defineConfig } from "vitepress";
import sidebar_vue from "./sidebar-vue";
import sidebar_utils from "./sidebar-utils";
import sidebar_inspiration from "./sidebar-inspiration";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Coding Notes",
  description: "A VitePress Site",
  base: "/notes/",
  head: [["link", { rel: "icon", href: "/favicon.ico" }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "主页", link: "/", },
      { text: "Vue", link: "/vue/start", activeMatch: '^/$|^/vue/' },
      // { text: "Angular", link: "/angular" },
      // { text: "React", link: "/react" },
      { text: "工具函数", link: '/utils/start', activeMatch: '^/$|^/utils/' },
      { text: "灵感", link: '/inspiration/start', activeMatch: '^/$|^/inspiration/' },
      {
        text: "其他",
        items: [
          { text: "工具站点收集", link: "/other/tool-site" },
          { text: "高质量代码", link: "/other/high-quality-code" },
          { text: "重构原则", link: "/other/refactoring-principle" },
          { text: "脚本合集", link: "/other/any-scripts" },
          // { text: "Example", link: "/markdown-examples" },
        ],
      },
    ],
    sidebar: {
      "/vue/": {
        base: "/vue/",
        items: sidebar_vue,
      },
      "/utils/": {
        base: "/utils/",
        items: sidebar_utils
      },
      "/inspiration/": {
        base: "/inspiration/",
        items: sidebar_inspiration,
      },
      // "/other/": {
      //   base: "/other/",
      //   items: sidebar_other,
      // },
    },
    socialLinks: [{ icon: "github", link: "https://github.com/Steryn/notes" }],
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
    outline: {
      label: "导航",
      level: [2, 3],
    },
    lastUpdated: {
      text: "最后更新于",
      formatOptions: {
        dateStyle: "short",
        timeStyle: "medium",
      },
    },
    editLink: {
      pattern: `https://github.com/Steryn/notes/tree/main/docs/:path`,
      text: "去编辑此文档",
    },
    search: {
      provider: "local",
    },
  },
});
