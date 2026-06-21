export const meta = {
  name: 'cottage-pipeline',
  description: 'Drive the Captain\'s Cottage blog pipeline for the next N idea slots: editor → researcher → writer ⇄ seo-editor, stopping at in-review. Never approves or publishes (Will\'s gate).',
  whenToUse: 'When Will wants to produce the next blog draft(s) end-to-end with one trigger. Pass { count: N } to do N slots sequentially (default 1).',
  phases: [
    { title: 'Plan', detail: 'Editor advances the next idea slot on the calendar' },
    { title: 'Research', detail: 'Researcher emits the fact brief' },
    { title: 'Draft & SEO', detail: 'Writer drafts, SEO editor audits, loop to PASS, set in-review' },
  ],
}

// ── Why this is a Workflow and not an agent ──────────────────────────────────
// Subagents cannot spawn subagents in this harness. A "manager agent" therefore
// cannot run the editor/researcher/writer/seo agents. This deterministic script
// can — it invokes each real agent via opts.agentType (same registry as the
// Agent tool), so they keep their own tools and instructions.
//
// ── The gate (hard) ──────────────────────────────────────────────────────────
// This driver STOPS at status `in-review`. It never sets `approved`/`published`,
// never flips draft:false, never sends anything. Will is the only approver.
//
// ── Why sequential, not parallel ─────────────────────────────────────────────
// Every agent writes the single shared content-calendar.json (and .flowstatus.json).
// Running posts in parallel would race those files. We process one post fully,
// then start the next. pipeline()/parallel() are intentionally NOT used here.

const EDITOR_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['nothingToDo'],
  properties: {
    nothingToDo: { type: 'boolean', description: 'true if there is no idea-status post to advance' },
    slug: { type: 'string' },
    title: { type: 'string' },
    category: { type: 'string' },
    publishDate: { type: 'string' },
    handoffNote: { type: 'string', description: 'angle + target reader + the >=2 internal links to use' },
    message: { type: 'string' },
  },
}

const RESEARCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'briefPath'],
  properties: {
    slug: { type: 'string' },
    briefPath: { type: 'string', description: 'content/research/<slug>.md' },
    gaps: { type: 'array', items: { type: 'string' } },
    openQuestionsForWill: { type: 'array', items: { type: 'string' } },
  },
}

const WRITER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'draftPath'],
  properties: {
    slug: { type: 'string' },
    draftPath: { type: 'string', description: 'src/content/blog/<slug>.mdx' },
    wordCount: { type: 'number' },
    todoMarkers: { type: 'number', description: 'count of <!-- TODO: Will... --> left in the draft' },
    statusSet: { type: 'string', description: 'calendar status after this step, if changed' },
  },
}

const SEO_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict'],
  properties: {
    verdict: { type: 'string', enum: ['PASS', 'FAIL'] },
    fixes: { type: 'array', items: { type: 'string' }, description: 'numbered, specific fixes when FAIL' },
    notes: { type: 'string' },
  },
}

const MAX_SEO_ROUNDS = 3
const count = (args && Number(args.count)) > 0 ? Math.floor(Number(args.count)) : 1

log(`Driving the pipeline for ${count} slot(s). Hard stop at in-review — no approval, no publish.`)

const results = []

for (let i = 0; i < count; i++) {
  const n = i + 1

  // ── Plan: editor advances the next idea slot ──────────────────────────────
  phase('Plan')
  const ed = await agent(
    `You are running your standard Editor job for ONE post. Advance the single highest-priority post whose status is "idea" (apply your topic screen and seasonal-offset rules), update content/content-calendar.json and .flowstatus.json as your instructions require, and hand it off to the Researcher. Do not advance more than one post. If there is no "idea" post available to advance, set nothingToDo=true and explain in message. Return the structured result.`,
    { agentType: 'blog-editor', schema: EDITOR_SCHEMA, label: `editor:slot-${n}`, phase: 'Plan' }
  )

  if (!ed || ed.nothingToDo) {
    log(`Slot ${n}: nothing to advance${ed && ed.message ? ' — ' + ed.message : ''}. Stopping.`)
    results.push({ slot: n, status: 'nothing-to-do', message: ed ? ed.message : 'editor returned null' })
    break
  }

  const slug = ed.slug
  log(`Slot ${n}: ${slug} (${ed.category}, ${ed.publishDate}) advanced. Researching.`)

  // ── Research: fact brief ──────────────────────────────────────────────────
  phase('Research')
  const rb = await agent(
    `Research the assigned post "${slug}" per your standard instructions. Read the local sources of truth first, verify external facts, invent nothing, and write content/research/${slug}.md. Editor handoff note: ${ed.handoffNote || '(see the calendar entry)'}. Return the structured brief summary.`,
    { agentType: 'blog-researcher', schema: RESEARCH_SCHEMA, label: `researcher:${slug}`, phase: 'Research' }
  )
  if (!rb) {
    results.push({ slot: n, slug, status: 'research-failed' })
    log(`Slot ${n}: research failed for ${slug}. Skipping to next slot.`)
    continue
  }

  // ── Draft & SEO loop ──────────────────────────────────────────────────────
  phase('Draft & SEO')
  let writer = await agent(
    `Draft the post "${slug}" from content/research/${slug}.md per your standard instructions. draft:true always. Read content/voice-feedback-log.md and content/feedback/${slug}.json before drafting. Do NOT set the calendar status yet — the SEO loop runs next. Return the structured result.`,
    { agentType: 'blog-writer', schema: WRITER_SCHEMA, label: `writer:${slug}:draft`, phase: 'Draft & SEO' }
  )
  if (!writer) {
    results.push({ slot: n, slug, status: 'draft-failed', brief: rb.briefPath })
    log(`Slot ${n}: draft failed for ${slug}.`)
    continue
  }

  let passed = false
  let lastSeo = null
  for (let round = 1; round <= MAX_SEO_ROUNDS; round++) {
    const seo = await agent(
      `Audit the draft "${slug}" against the full SEO checklist and run the build, per your standard instructions. Return verdict PASS or FAIL with a numbered, specific fix list when FAIL. Do not flip draft or set calendar status.`,
      { agentType: 'blog-seo-editor', schema: SEO_SCHEMA, label: `seo:${slug}:r${round}`, phase: 'Draft & SEO' }
    )
    lastSeo = seo
    if (seo && seo.verdict === 'PASS') { passed = true; break }
    if (round === MAX_SEO_ROUNDS) break
    const fixes = (seo && seo.fixes) || []
    log(`Slot ${n}: ${slug} SEO round ${round} FAIL (${fixes.length} fixes). Writer revising.`)
    writer = await agent(
      `Apply these SEO fixes to "${slug}" exactly, smallest change that satisfies each, no new claims:\n${fixes.map((f, j) => `${j + 1}. ${f}`).join('\n')}\nKeep draft:true. Return the structured result.`,
      { agentType: 'blog-writer', schema: WRITER_SCHEMA, label: `writer:${slug}:fix-r${round}`, phase: 'Draft & SEO' }
    )
    if (!writer) break
  }

  if (!passed) {
    results.push({ slot: n, slug, status: 'seo-not-passing', rounds: MAX_SEO_ROUNDS, lastNotes: lastSeo && lastSeo.notes })
    log(`Slot ${n}: ${slug} did not pass SEO in ${MAX_SEO_ROUNDS} rounds. Left at "drafted" for Will. NOT set to in-review.`)
    continue
  }

  // ── Finalize: writer sets status to in-review (its authority; the gate) ────
  const fin = await agent(
    `SEO has PASSED for "${slug}". Per your hard rules, set the content-calendar.json entry status to "in-review" (the human gate — do NOT approve, do NOT set approvedBy, do NOT publish, keep draft:true), add a one-line revision summary to the entry note, and set the .flowstatus.json writer/seo-editor nodes back to idle. Return the structured result with statusSet.`,
    { agentType: 'blog-writer', schema: WRITER_SCHEMA, label: `writer:${slug}:finalize`, phase: 'Draft & SEO' }
  )

  results.push({
    slot: n,
    slug,
    status: 'in-review',
    draftPath: writer && writer.draftPath,
    briefPath: rb.briefPath,
    wordCount: writer && writer.wordCount,
    todoMarkers: writer && writer.todoMarkers,
    openQuestionsForWill: rb.openQuestionsForWill || [],
    statusSet: fin && fin.statusSet,
  })
  log(`Slot ${n}: ${slug} → in-review. ${writer && writer.todoMarkers ? writer.todoMarkers + ' TODO marker(s) for Will.' : ''} Awaiting Will's approval.`)
}

const ready = results.filter((r) => r.status === 'in-review')
log(`Done. ${ready.length}/${results.length} slot(s) reached in-review. Nothing was approved or published — that is Will's gate.`)

return {
  ranAt: 'set-by-caller',
  slotsRequested: count,
  reachedInReview: ready.map((r) => r.slug),
  needsAttention: results.filter((r) => r.status !== 'in-review' && r.status !== 'nothing-to-do'),
  results,
}
