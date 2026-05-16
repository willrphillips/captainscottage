# Live flowchart integration — contract

This file is the **integration contract** between this repo and the Living
Flowcharts app in the Codex root. It deliberately does **not** restate the
pipeline or the schema-by-example beyond what's needed — it points at the
existing sources of truth so nothing drifts.

## Who owns what (read this before adding anything)

| Concern | Single owner | Do NOT duplicate it here |
|---|---|---|
| Pipeline definition (what the agents are, the workstreams) | `SCOPE_OF_WORK.md` §4–6 | Don't re-describe agents in this repo's other docs |
| Chart **structure** (lanes, node ids, edges, layout) | `living-flowcharts/data/projects/captainscottage.json` (Codex root) | Don't redefine lanes/nodes in this repo |
| Build rules for the site | `CLAUDE.md` / `captains_cottage_brief.md` | — |
| **Live status only** | `.flowstatus.json` (this folder) | This is the only thing this repo emits for the chart |

Data flows **one direction**: this repo writes `.flowstatus.json`; the root app
reads it and overlays it onto the curated chart. The structure is never sent
from here.

## The only new rule: report status by node id

As each pipeline piece is built, set its node's status in `.flowstatus.json`.
Node ids **must** match the ids in the curated chart (the structure owner
above). Current id ↔ workstream map:

| Node id | Lane / Workstream | Mark `active` when… |
|---|---|---|
| `site-foundation` | Foundation | Site + home shipped & deploying (done) |
| `blogpost-layout` | Blog System (SOW §3) | `BlogPost.astro` renders a post (done) |
| `post-route` | Blog System | `/journal/[...slug]` builds with schema (done) |
| `journal-index` | Blog System | journal index live, draft-excluded (done) |
| `sample-post` | Blog System | one `draft:false` post passes build+SEO (done) |
| `editor` | Content Agents (SOW §4) | Editor agent picks a calendar slot end-to-end |
| `researcher` | Content Agents | Researcher emits a per-article fact brief |
| `writer` | Content Agents | Writer outputs a `draft:true` MDX post |
| `seo-editor` | Content Agents | SEO agent returns pass/fail and loops to writer |
| `calendar` | Review & Publish (SOW §6) | `content/content-calendar.json` drives the run |
| `pr-preview` | Review & Publish | a drafted post opens a PR with a preview link |
| `approve` | Review & Publish | the batch-approval gate is operational |
| `scheduled-publish` | Review & Publish | a dated job flips `draft:false` on schedule |

Statuses: `active` = working now · `idle` = built, not running · `planned` =
not built · `broken` = built but failing (put the error in `note`).

If you add, remove, or rename a pipeline node, update the **structure owner**
(`living-flowcharts/data/projects/captainscottage.json`) in the same change —
that file, not this one, defines what nodes exist.

## `.flowstatus.json` shape

Minimal; include only what you know:

```json
{
  "projectId": "captainscottage",
  "updatedAt": "<ISO-8601>",
  "nodes": {
    "writer": { "status": "active", "lastRun": "2026-05-16", "note": "drafting slot 2" }
  }
}
```

Opt out entirely: delete this file and `.flowstatus.json`, or set
`FLOWCHARTS_NO_DEPLOY=1` for the root app.
