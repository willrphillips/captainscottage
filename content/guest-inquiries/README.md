# Guest inquiries — voice & facts log

Append-only record of real guest questions on Airbnb and Will's verbatim
responses. The future `guest-inquiries` agent reads this log to:

1. **Get the facts right** — answers here are authoritative for property
   details that aren't captured in `src/lib/site.ts` or `src/lib/guidebook.ts`
   (e.g., life-vest inventory, water depth at the dock, current direction at
   tide change). When Will answers a factual question for the first time, the
   answer becomes canonical and should be reflected in `site.ts` /
   `guidebook.ts` on the next pass.
2. **Match Will's voice** — the response field captures Will's actual
   tone with guests: warm, a little informal, leads with a sincere apology
   when late, hedges generously ("generally," "about," "should be fine"),
   gives the practical safety beat without alarmism, ends with a
   look-forward-to-hosting-you note.

Each entry is one JSON file: `content/guest-inquiries/<YYYY-MM-DD>-<first-name>.json`.

## Schema

```json
{
  "at": "ISO-8601 timestamp of Will's reply",
  "guest": "First name only",
  "stayDates": "YYYY-MM-DD to YYYY-MM-DD",
  "partySize": { "adults": 0, "children": 0 },
  "questions": ["verbatim question 1", "verbatim question 2"],
  "willResponse": "Verbatim. This is the canonical voice + factual answer.",
  "facts": [
    "Atomic, reusable factual claims extracted from the response.",
    "These are what the agent should treat as ground truth."
  ],
  "voiceNotes": [
    "Short observations about tone, structure, or phrasing the agent should mirror."
  ]
}
```

## Anti-patterns

- Don't paraphrase Will's response. Log it verbatim — voice fidelity is the
  whole point.
- Don't invent facts. If Will didn't address something, it doesn't go in
  `facts`.
- Don't auto-send replies. This log feeds drafts only; Will sends every
  message himself.

## TODO — historical backfill

Will wants to find a way to import the full archive of his prior Airbnb guest
messages into this same log so the agent has a much larger voice corpus and
fact bank to learn from. Options to evaluate:

- Airbnb does not currently expose a host-message export via API. Likely paths:
  (1) a GDPR-style "Request your data" download from Airbnb account settings,
  which typically includes message history as a structured dump; (2)
  scripted scraping of the host inbox via authenticated browser session
  (fragile, ToS-sensitive); (3) manual paste of high-signal threads.
- Whichever ingestion path we pick, the output should land here as one JSON
  file per thread using the schema above, with `willResponse` preserving the
  original message verbatim. For multi-message threads, either chain them in
  a single file (add a `thread: [...]` array) or split into one file per
  reply — decide once we see the data shape.
- Until backfill happens, log new inquiries here as they come in. Every real
  reply is a voice + facts datapoint.
