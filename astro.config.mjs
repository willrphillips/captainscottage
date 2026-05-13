import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const SITE = "https://willrphillips.github.io";
const BASE = "/captainscottage";

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: "ignore",
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/404"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
});
