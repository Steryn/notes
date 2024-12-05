export const menu = [
  { text: "主页", link: "/" },
  { text: "Vue", link: "/vue/start" },
  // { text: "Angular", link: "/angular" },
  // { text: "React", link: "/react" },
  {
    text: "其他",
    items: [
      { text: "工具函数", link: "/other/tool-function" },
      { text: "Example", link: "/markdown-examples" },
    ],
  },
];

export const sidebar_vue = [
  {
    text: "起步",
    link: "/vue/start",
    // collapsed: false,
    // items: [],
  },
  {
    text: "Hooks",
    // collapsed: false,
    items: [
      {
        items: [
          { text: "useWatchStopHandle", link: "/vue/hooks-useWatchStopHandle" },
        ],
      },
    ],
  },
];

export const sidebar_other = [
  {
    text: "其他",
    items: [{ text: "工具函数", link: "/other/tool-function" }],
  },
];
