# Feedback queue

When Will reviews a draft in the preview Review panel, the overlay produces
`feedback-<slug>.json`. Place it here as `content/feedback/<slug>.json`.

Shape:

```json
{
  "slug": "crabbers-morning-on-hull-creek",
  "title": "…",
  "isDraft": true,
  "decision": "request-changes | approve-for-batch",
  "feedback": "Specific, actionable notes.",
  "reviewer": "Will Phillips",
  "at": "ISO-8601"
}
```

How agents use it:

- **request-changes** → the Writer reads the file, revises the matching
  `src/content/blog/<slug>.mdx`, then loops the SEO editor. The Writer
  deletes (clears) the consumed feedback file and records the revision in the
  calendar `note`.
- **approve-for-batch** → agents DO NOT publish. They record the decision in
  the calendar `note` and leave the post at `in-review` for Will's final
  batch approval in the CMS. `approvedBy` stays `null` until Will sets it.

The human gate is unchanged: no agent transitions a post to `approved` or
`published`. This queue only carries *feedback*, never authority to publish.
