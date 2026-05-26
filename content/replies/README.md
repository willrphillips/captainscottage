# Guest replies knowledge base

This directory is the canonical source for how Captain's Cottage answers
Airbnb guest messages. Two agents read it:

- `guest-reply-bootstrap` — one-time mining pass that builds the initial
  set of topic files from your Airbnb message history in Gmail.
- `guest-reply` — ongoing on-demand agent that drafts replies to new
  guest messages and writes the drafts into Gmail (never sends).

Nothing in this directory is ever served to the public website. It's a
private working knowledge base.

## Structure

```
content/replies/
  README.md           ← this file
  voice-rules.md      ← reply-specific voice (distinct from blog voice)
  _template.md        ← skeleton for new topic files
  <topic>.md          ← one file per recurring question topic
```

A topic file holds one or more **Q&A blocks**. Each block is a single
canonical answer plus the question patterns that should route to it.

## Recency wins

When two answers for the same topic disagree, **the more recent one is
authoritative**. Each Q&A block carries a `lastConfirmed:` date for
exactly this reason. Agents must prefer the newest confirmed answer; old
contradicting entries are kept (don't delete history) but marked
`status: superseded`.

## How entries get added

1. **Bootstrap pass** — `guest-reply-bootstrap` scans your Airbnb email
   history, groups recurring guest questions into topics, and writes the
   initial topic files. If your outgoing replies aren't captured in
   Gmail (Airbnb-app replies usually aren't), the bootstrap leaves the
   answer slots empty for you to fill — but the question patterns and
   topic structure are still mined from inbound messages.
2. **Ongoing** — every time you approve a drafted reply, the
   `guest-reply` agent distills it into a new or updated block in the
   relevant topic file. The knowledge base compounds.
3. **Manual** — you can edit any topic file directly. Bumping
   `lastConfirmed:` to today's date marks an answer as freshly
   authoritative.

## What does NOT belong here

- Guest names or personal info
- Reservation-specific dates, prices, or payouts
- Anything that would identify a specific stay

Knowledge base entries are **patterns, not transcripts**. Anonymize
during extraction.
