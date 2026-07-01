# Real-time guest-reply trigger (Gmail forward → Cloudflare → GitHub)

> **STATUS — wiring complete, awaiting live test (updated 2026-07-01).**
> **Done:** §1–§4 are all wired. GitHub PAT created + Worker deployed with
> `GH_DISPATCH_TOKEN` set. DNS moved Namecheap → Cloudflare — nameservers are now
> Cloudflare (`alec`/`indie.ns.cloudflare.com`) and MX is Cloudflare Email Routing
> (`route1/2/3.mx.cloudflare.net`). The Email Routing rule (`guest-watch@` → the
> Worker), the Gmail forwarding-address confirmation, and the Gmail filter
> (`from:express@airbnb.com` → forward to `guest-watch@`) are all confirmed by Will.
> **Code fix (2026-07-01):** the Worker previously trusted only the SMTP envelope
> sender — but Gmail rewrites that to a gmail.com address when it forwards, so
> forwarded Airbnb mail was seen as non-Airbnb and silently dropped. `src/index.mjs`
> now also checks the original `From:`/`Reply-To:` headers (which survive the
> forward). `FORWARD_TO` is temporarily ON in `wrangler.toml` so Gmail's
> confirmation email reached the inbox during setup.
> **Remaining — 2 steps:**
>   1. **Live end-to-end test.** A real `express@airbnb.com` guest email must
>      produce a `repository_dispatch` run. Watch `npx wrangler tail` for
>      `dispatched guest-email`; confirm a watcher run triggered by
>      `repository_dispatch` + a Discord ping. **Zero dispatch runs have fired yet**
>      — the `*/10` cron is still the only live delivery path until this passes.
>   2. **Turn `FORWARD_TO` off** — comment it out in `wrangler.toml` and
>      `npx wrangler deploy`, or every guest email keeps getting duplicated to the
>      inbox. Do this only after step 1 passes.
> Tracked in `SCOPE_OF_WORK.md` log entry 2026-07-01.

**Why this exists.** The watcher (`.github/workflows/guest-reply-watch.yml`)
used to rely only on a `*/10` cron. GitHub throttles scheduled cron hard — in
practice it ran every **3–5 hours**, not every 10 minutes — so guest messages
sat undelivered to Discord for hours (e.g. a 20:31 message with the last run at
19:50, nothing since).

The fix flips it from **polling** to **push**:

```
Guest message →
  Airbnb emails you (express@airbnb.com, Reply-To …@reply.airbnb.com) →
    Gmail filter auto-forwards it to guest-watch@captainscottageva.com →
      Cloudflare Email Routing → guest-email-trigger Worker →
        GitHub repository_dispatch (type: guest-email) →
          watcher runs in seconds → reads the real msg from Gmail →
            drafts reply → Discord
```

The cron stays as a **safety net** (catches anything a dropped webhook missed).
The Worker is *only* a trigger — it never reads the body or drafts; the watcher
still does everything from Gmail exactly as before.

> Nothing about Airbnb's email format changed; this is purely a delivery-latency
> fix. The watcher's Gmail read and draft logic are untouched.

---

## 1. GitHub token for the Worker

The `repository_dispatch` API needs write access. Create a **fine-grained PAT**:

- GitHub → Settings → Developer settings → Fine-grained tokens → Generate.
- **Repository access:** only `willrphillips/captainscottage`.
- **Permissions:** **Contents → Read and write** (this is what the dispatches
  endpoint checks). Nothing else.
- Copy the token (`github_pat_…`).

## 2. Deploy the Worker

```bash
cd cloudflare/guest-email-trigger
npx wrangler deploy
npx wrangler secret put GH_DISPATCH_TOKEN   # paste the PAT from step 1
```

`wrangler.toml` already carries the non-secret vars (`GH_OWNER`, `GH_REPO`,
`GH_EVENT_TYPE`). Optionally uncomment `FORWARD_TO` to keep a copy of forwarded
mail in a real inbox.

## 3. Route an address to the Worker (Cloudflare Email Routing)

Cloudflare dashboard → **captainscottageva.com → Email → Email Routing**:

1. Enable Email Routing if it isn't (adds the MX/TXT records automatically).
2. **Routing rules → Create** a custom address, e.g.
   `guest-watch@captainscottageva.com`.
3. Set its action to **Send to a Worker → guest-email-trigger**.

## 4. Auto-forward from Gmail — and the verification gotcha

Gmail verifies a forwarding address before it'll forward to it: it sends a
**confirmation code** to the target the moment you add it. That code email will
hit the Worker address — and the Worker ignores non-Airbnb mail, so you'd never
see the code. Two ways around it:

**Option A (simplest):** set `FORWARD_TO = "willrphillips@gmail.com"` in
`wrangler.toml`, redeploy, then add the forwarding address in Gmail. The Worker
forwards the Google confirmation email back to you; click the link / enter the
code. (You can leave `FORWARD_TO` on afterward, or clear it and redeploy.)

**Option B:** temporarily point the Cloudflare routing rule at your real mailbox
(plain "Send to an address"), grab the code, confirm, then switch the rule back
to the Worker.

Once the address is verified:

- Gmail → Settings → **Filters → Create**:
  - Criteria: `from:(airbnb.com)` (optionally also `to:me`).
  - Action: **Forward to** `guest-watch@captainscottageva.com`.
  - Apply.

> Keep the filter on `from:airbnb.com` (broad). The Worker re-checks the sender
> domain and only dispatches for `airbnb.com`, and the watcher itself filters
> guest vs. non-guest mail — so an over-broad forward costs nothing.

## 5. Test end to end

- `npx wrangler tail` (in the Worker dir) to watch live logs.
- Send yourself a test from any `@airbnb.com`-looking thread, or wait for the
  next real guest message. You should see `dispatched guest-email` in the tail,
  a fresh **Guest-reply watcher** run in the GitHub Actions tab triggered by
  `repository_dispatch`, and a Discord ping within seconds.

---

## Rotating / revoking

- The PAT lives only as the Worker secret `GH_DISPATCH_TOKEN`. Rotate with
  `npx wrangler secret put GH_DISPATCH_TOKEN`.
- To pause the push path: disable the Gmail filter (stops at the source) or the
  Cloudflare routing rule. The `*/10` cron still runs as a fallback.
