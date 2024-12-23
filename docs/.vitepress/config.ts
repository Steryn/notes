import { defineConfig } from "vitepress";
import { menu, sidebar_other } from "./menu";
import sidebar_vue from "./sidebar-vue";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Coding Notes",
  description: "A VitePress Site",
  base: "/notes/",
  head: [["link", { rel: "icon", href: "/favicon.ico" }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: menu,
    sidebar: {
      "/vue/": {
        base: "/vue/",
        items: sidebar_vue,
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
