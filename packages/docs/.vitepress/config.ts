import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Picobase",
  description:
    "Lightweight, self-hosted SQLite database manager with a browser GUI.",
  base: "/picobase/",

  head: [["link", { rel: "icon", href: "/picobase/favicon.svg" }]],

  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Picobase",

    nav: [
      { text: "Guide", link: "/guide/what-is-picobase" },
      { text: "Reference", link: "/reference/api" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is Picobase?", link: "/guide/what-is-picobase" },
            { text: "Getting Started", link: "/guide/getting-started" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [{ text: "API", link: "/reference/api" }],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/erikthalen/picobase" },
    ],

    footer: {
      message: "Released under the MIT License.",
    },
  },
});
