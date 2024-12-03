import { defineNotesConfig } from "vuepress-theme-plume";
import { defineNoteConfig } from "vuepress-theme-plume";

export const notes = defineNotesConfig({
  dir: "notes",
  link: "/",
  notes: [
    {
      dir: "common",
      link: "common",
      sidebar: ["", "foo", "bar"],
    },
  ],
});

export const vue = defineNoteConfig({
  dir: "vue",
  link: "/",
  sidebar: [
    { text: "setup", link: "/vue3/setup" },
    { text: "hooks", link: "/vue3/hooks" },
  ],
});
