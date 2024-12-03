import { defineThemeConfig } from "vuepress-theme-plume";
import { navbar } from "./navbar";
import { notes, vue } from "./menu";

/**
 * @see https://theme-plume.vuejs.press/config/basic/
 */
export default defineThemeConfig({
  logo: "https://theme-plume.vuejs.press/plume.png",
  // your git repo url
  docsRepo: "",
  docsDir: "docs",

  appearance: true,

  profile: {
    // avatar: "https://theme-plume.vuejs.press/plume.png",
    name: "Steryn Blog Site",
    description: "代码笔记",
    // circle: true,
    // location: '',
    // organization: '',
  },

  navbar,
  vue,
  notes,
  social: [{ icon: "github", link: "/" }],
});
