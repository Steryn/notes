import { defineConfig } from "vitepress";
import sidebar_vue from "./sidebar-vue";
import sidebar_utils from "./sidebar-utils";
import sidebar_angular from "./sidebar-angular";
import sidebar_inspiration from "./sidebar-inspiration";
import sidebar_nodejs from "./sidebar-nodejs";
import menu from "./menu";

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
      "/angular/": {
        base: "/angular/",
        items: sidebar_angular,
      },
      "/nodejs/": {
        base: "/nodejs/",
        items: sidebar_nodejs,
      },
      "/utils/": {
        base: "/utils/",
        items: sidebar_utils,
      },
      "/inspiration/": {
        base: "/inspiration/",
        items: sidebar_inspiration,
      },
      // "/other/": {
      //   base: "/other/",
      //   items: [
      //     {
      //       text: "Git常用命令",
      //       items: [
      //         { text: "重置克隆镜像", link: "/git/reset-mirror" },
      //         { text: "代理镜像地址", link: "/git/proxy-address" },
      //         { text: "ip 查询地址", link: "/git/ip-search" },
      //       ],
      //     },
      //   ],
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
