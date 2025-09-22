export default [
  { text: "主页", link: "/" },
  { text: "Vue", link: "/vue/start", activeMatch: "^/$|^/vue/" },
  { text: "Angular", link: "/angular/start", activeMatch: "^/$|^/angular/" },
  // { text: "React", link: "/react" },
  { text: "工具函数", link: "/utils/start", activeMatch: "^/$|^/utils/" },
  {
    text: "灵感",
    link: "/inspiration/start",
    activeMatch: "^/$|^/inspiration/",
  },
  {
    text: "其他",
    items: [
      { text: "工具站点收集", link: "/other/tool-site" },
      { text: "高质量代码", link: "/other/high-quality-code" },
      { text: "重构原则", link: "/other/refactoring-principle" },
      { text: "脚本合集", link: "/other/any-scripts" },
      { text: "git 常用命令", link: "/other/git" },
    ],
  },
];
