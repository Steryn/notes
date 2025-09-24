import { defineConfig } from "vitepress";
import sidebar_vue from "./sidebar-vue";
import sidebar_utils from "./sidebar-utils";
import sidebar_angular from "./sidebar-angular";
import sidebar_docker from "./sidebar-docker";
import sidebar_inspiration from "./sidebar-inspiration";
import sidebar_nodejs from "./sidebar-nodejs";
import sidebar_nodejs_advanced from "./sidebar-nodejs-advanced";
import menu from "./menu";
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: {
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        plugins: [visualizer({ open: true })],
      },
    },
    plugins: [
      viteCompression({
        algorithm: 'gzip', // 或 gzip
      })
    ]
  },
  title: "Coding Notes",
  description: "A VitePress Site",
  base: "/notes/",
  head: [["link", { rel: "icon", href: "/favicon.ico" }]],
  metaChunk: true,
  ignoreDeadLinks: true,
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
      "/nodejs/05-advanced/": {
        base: "/nodejs/",
        items: sidebar_nodejs_advanced,
      },
      "/docker/": {
        base: "/docker/",
        items: sidebar_docker,
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
