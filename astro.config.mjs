import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync } from "node:fs";

const SITE = "https://captainscottageva.com";
const BASE = "/";

// Dev-only feedback sink. The AdminOverlay POSTs review feedback here while
// reviewing in `npm run dev`; this writes content/feedback/<slug>.json so the
// Writer/SEO agents can consume it. configureServer runs ONLY in the dev
// server — it is never part of the static production build, so GitHub Pages
// is unaffected and no server adapter is needed.
// Flip the `approvedAt` line in a post's MDX frontmatter.
// approve=true  → set/replace approvedAt with the current ISO timestamp
// approve=false → strip any approvedAt line
// Returns the resulting ISO (or null if cleared). Throws on bad input.
function setApprovedAtInMdx(slug, approve) {
  const mdxPath = resolve(process.cwd(), "src/content/blog", slug + ".mdx");
  if (!existsSync(mdxPath)) throw new Error("post not found: " + slug);
  const original = readFileSync(mdxPath, "utf8");
  const fmMatch = original.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) throw new Error("no frontmatter found");
  const fmBlock = fmMatch[1];
  const after = original.slice(fmMatch[0].length);
  const lines = fmBlock.split(/\r?\n/).filter((l) => !/^approvedAt:\s*/.test(l));
  const iso = approve ? new Date().toISOString() : null;
  if (approve) lines.push(`approvedAt: ${iso}`);
  writeFileSync(mdxPath, `---\n${lines.join("\n")}\n---${after}`, "utf8");
  return iso;
}

function feedbackSinkPlugin() {
  return {
    name: "captains-cottage-feedback-sink",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith("/__feedback")) {
          return next();
        }

        // GET /__feedback?slug=X → reports whether a feedback file exists
        // and is non-empty. The review UI uses this on page load to clear
        // the local "rewrite pending" flag once an agent has consumed the
        // feedback (the writer empties the file to `{}` after applying).
        if (req.method === "GET") {
          const url = new URL(req.url, "http://localhost");
          const slug = (url.searchParams.get("slug") || "").replace(/[^a-z0-9-]/gi, "").toLowerCase();
          const filePath = resolve(process.cwd(), "content/feedback", slug + ".json");
          let status = "none";
          let body = null;
          try {
            if (slug && existsSync(filePath)) {
              const raw = readFileSync(filePath, "utf8").trim();
              if (!raw || raw === "{}") {
                status = "consumed";
              } else {
                status = "pending";
                try { body = JSON.parse(raw); } catch (_) {}
              }
            }
          } catch (_) {}
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: true, slug, status, body }));
          return;
        }

        // PUT /__feedback/approve  → flips a post's frontmatter
        //   body: { slug, approve: true|false }
        //     approve=true  → write `approvedAt: <ISO>` into the MDX
        //     approve=false → remove `approvedAt` (re-open for review)
        // Always keeps `draft: true` — the actual publish remains Will's
        // manual flip. The review queue filters out posts with `approvedAt`.
        if (req.method === "PUT" && req.url.startsWith("/__feedback/approve")) {
          let raw = "";
          req.on("data", (c) => (raw += c));
          req.on("end", () => {
            try {
              const data = JSON.parse(raw || "{}");
              const slug = String(data.slug || "").replace(/[^a-z0-9-]/gi, "").toLowerCase();
              if (!slug) throw new Error("missing/invalid slug");
              const approve = data.approve !== false;
              const iso = setApprovedAtInMdx(slug, approve);
              res.statusCode = 200;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ ok: true, slug, approve, approvedAt: iso }));
            } catch (err) {
              res.statusCode = 400;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ ok: false, error: String(err && err.message || err) }));
            }
          });
          return;
        }

        if (req.method !== "POST") {
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

            // Permanent structured archive — one file per submission so
            // we never lose a round of feedback when the writer agent
            // clears content/feedback/<slug>.json. Filename uses ISO
            // timestamp with colons stripped so it works on Windows.
            try {
              const archiveDir = resolve(process.cwd(), "content/feedback-archive");
              mkdirSync(archiveDir, { recursive: true });
              const isoStamp = (data.at || new Date().toISOString()).replace(/[:.]/g, "-");
              writeFileSync(
                join(archiveDir, slug + "-" + isoStamp + ".json"),
                JSON.stringify(data, null, 2) + "\n",
                "utf8",
              );
            } catch (_) {
              /* archive is best-effort; never fail the submit */
            }
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
            // If this submission is an "approve-for-batch" decision,
            // flip the post's frontmatter so it falls out of the review
            // queue. `draft: true` stays — actual publish remains Will's
            // manual flip.
            let approvedAt = null;
            if (data.decision === "approve-for-batch") {
              try { approvedAt = setApprovedAtInMdx(slug, true); } catch (_) {}
            }

            res.statusCode = 200;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true, path: "content/feedback/" + slug + ".json", approvedAt }));
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
      // /book meta-refreshes to Airbnb, so it is a redirect, not a destination.
      // Submitting it caused a "Page with redirect" exclusion in Search Console.
      filter: (page) => !page.includes("/404") && !page.includes("/book"),
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
