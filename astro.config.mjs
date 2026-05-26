import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";

const SITE = "https://captainscottageva.com";
const BASE = "/";

// Dev-only feedback sink. The AdminOverlay POSTs review feedback here while
// reviewing in `npm run dev`; this writes content/feedback/<slug>.json so the
// Writer/SEO agents can consume it. configureServer runs ONLY in the dev
// server — it is never part of the static production build, so GitHub Pages
// is unaffected and no server adapter is needed.
function feedbackSinkPlugin() {
  return {
    name: "captains-cottage-feedback-sink",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "POST" || !req.url || !req.url.startsWith("/__feedback")) {
          return next();
        }
        let raw = "";
        req.on("data", (c) => (raw += c));
        req.on("end", () => {
          try {
            const data = JSON.parse(raw || "{}");
            const slug = String(data.slug || "").replace(/[^a-z0-9-]/gi, "").toLowerCase();
            if (!slug) throw new Error("missing/invalid slug");
            const dir = resolve(process.cwd(), "content/feedback");
            mkdirSync(dir, { recursive: true });
            writeFileSync(
              join(dir, slug + ".json"),
              JSON.stringify(data, null, 2) + "\n",
              "utf8",
            );
            // Append to the persistent voice-feedback log so the Writer
            // can keep tuning to Will's evolving voice. The per-slug file
            // gets cleared by the Writer when consumed; this log never is.
            try {
              const logPath = resolve(process.cwd(), "content/voice-feedback-log.md");
              const stamp = data.at || new Date().toISOString();
              const decision = data.decision || "(no-decision)";
              const reviewer = data.reviewer || "Will Phillips";
              const fb = (data.feedback || "").toString().trim();
              const entry =
                `\n## ${stamp} · ${slug}\n` +
                `**Decision:** ${decision}  \n` +
                `**Reviewer:** ${reviewer}\n\n` +
                (fb ? fb : "_(no notes — decision only)_") +
                "\n\n---\n";
              appendFileSync(logPath, entry, "utf8");
            } catch (_) {
              /* logging is best-effort; never fail the submit */
            }
            res.statusCode = 200;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true, path: "content/feedback/" + slug + ".json" }));
          } catch (err) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: false, error: String(err && err.message || err) }));
          }
        });
      });
    },
  };
}

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
    plugins: [tailwindcss(), feedbackSinkPlugin()],
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
});
