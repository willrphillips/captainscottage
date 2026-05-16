import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SITE = "https://willrphillips.github.io";
const BASE = "/captainscottage";

// This working copy lives inside a Dropbox-synced folder. Dropbox holds file
// handles on node_modules/.vite, which makes Vite's dep-optimization rename
// fail with EBUSY on build/dev. Keep the Vite cache outside the synced tree.
const VITE_CACHE_DIR = join(tmpdir(), "vite-captainscottage");

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
    cacheDir: VITE_CACHE_DIR,
    plugins: [tailwindcss()],
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
});
