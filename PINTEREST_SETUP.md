# Pinterest setup: Phase 0 runbook

**Status as of 2026-08-08.** Steps 0 through 3 are done. The domain is claimed
and Rich Pins turned out to need nothing. **Picking back up at step 4, the five
boards.** That is the only thing standing between here and 27 pins queued for
review.

| Step | State |
|---|---|
| 0. `hello@` routing | Done. `hello@` and `will@` both forward to Gmail. |
| 1. Business account | Done. Username `captainscottageva`, name Captain's Cottage, email `captainscottageva@gmail.com`. |
| 2. Claim the domain | **Done. captainscottageva.com is claimed.** |
| 3. Rich Pins | **Done, and it needed nothing.** Pinterest retired the validator; Rich Pins are automatic from the page metadata. |
| 4. Five boards | **Done.** Created by `scripts/pinterest-create-boards.mjs`, all five public. |
| 5. Developer app | **Abandoned 2026-08-21.** App id 1600288 sits at Trial, which cannot post real pins. We did not pursue Standard access. Publishing now runs through Todoist, no app needed. |
| 6. Token, boards, secrets | **Done 2026-08-13.** Token minted (expires **2026-09-11**), five boards created, both repo secrets set, publisher dry-run green. |

### Board IDs (created 2026-08-13)

| Board | ID |
|---|---|
| Virginia's Northern Neck | 1107111589588796631 |
| Weekend Getaways from Washington DC | 1107111589588796632 |
| Chesapeake Bay Travel | 1107111589588796633 |
| Waterfront Cottage Stays | 1107111589588796634 |
| Slow Weekends and Cabin Trips | 1107111589588796635 |

These are in the `PINTEREST_BOARD_MAP` repo secret. All 27 queued pins resolve
against them.

### Two loose ends

1. **The token expires 2026-09-11.** When the publisher starts returning 401,
   either re-run `scripts/pinterest-auth.mjs` and update the
   `PINTEREST_ACCESS_TOKEN` secret, or wire the saved refresh token into the
   publisher so it renews itself. The refresh token is already saved in
   `.pinterest-token.local`. Unsolved, and it will bite around mid-September.
2. The profile Website field reads `http://captainscottageva.com`. Worth
   changing to `https://`. Not blocking anything.

### How the domain was claimed (done 2026-08-07)

Verification code `7b792bc46c459ab5657b254d0fc9bcbc`, deployed via
`SITE.pinterestVerification` and emitted by `BaseLayout.astro` in the head of
every page. **Leave that value in place.** Removing it can un-claim the domain.
If Pinterest ever reissues a different code, paste the new value into
`src/lib/site.ts` and push.

### The email detour, recorded so nobody repeats it

Pinterest refused to send a confirmation to `hello@captainscottageva.com`, and
then to `will@captainscottageva.com`, both times with a generic "Invalid
email." It accepted and saved both addresses; only the confirm-send call failed.

Ruled out: DNS. MX points at Cloudflare `route1/2/3.mx.cloudflare.net`, SPF is
`v=spf1 include:_spf.mx.cloudflare.net ~all`, and delivery is proven, since
Cloudflare forwarded a live test to Gmail. Also ruled out: the role-address
theory, because `will@` failed identically. Will's own observation inverted it
further: the address Pinterest accepted at signup,
`hello@captainscottage.com`, is a domain we do not own and which has no MX at
all, so Pinterest is clearly not checking deliverability.

Best-fitting explanation, unproven: Pinterest runs an SMTP probe before
sending, and Cloudflare Email Routing does not answer probes like a real
mailbox, since it accepts configured addresses and rejects everything else at
the SMTP layer. Verification services commonly score that as unconfirmable.

Resolution: the account email is a Gmail. Nothing in the pin pipeline reads it.
A real mailbox on the domain (Google Workspace or a relay) is a newsletter and
Phase 6 decision, not a Pinterest one.

---


## 0. Create hello@captainscottageva.com

Cloudflare dashboard, **captainscottageva.com**, then **Email**, then **Email
Routing**. Email Routing is already enabled on this domain (it is what carries
`guest-watch@` into the guest-reply Worker), so this is adding one rule, not
setting up mail.

1. **Destination addresses** tab. If `willrphillips@gmail.com` is not already
   listed as verified, add it. Cloudflare sends a confirmation link to that
   inbox; click it. A destination has to be verified before any rule can use it.
2. **Routing rules** tab, **Create address**:
   - Custom address: `hello`
   - Action: **Send to an email**
   - Destination: `willrphillips@gmail.com`
3. Save. Send a test message to `hello@captainscottageva.com` and confirm it
   lands in Gmail.

**What this is and is not.** It receives and forwards. It is not a mailbox you
log into, and Cloudflare Email Routing cannot send outbound, so a reply from
Gmail goes out as your Gmail address, not as `hello@`. That is fine for
Pinterest, which only needs to reach you for verification, password resets, and
notifications. Real outbound sending as `@captainscottageva.com` needs a relay
or Google Workspace, and that decision belongs with the newsletter or Phase 6
direct booking, not here.

Optional: a Gmail filter on `to:hello@captainscottageva.com` labelled
`captainscottage` keeps property mail out of the main stream.

**Done when:** a test email to `hello@captainscottageva.com` arrives in Gmail.

---

## 1. Create the business account

Go to **pinterest.com/business/create**.

- Sign up as a **business account**, not personal. A personal account gets no
  analytics and no scheduler, and converting later loses nothing but is an extra
  step.
- **Email: `hello@captainscottageva.com`** (decided 2026-08-07). Create it
  first, in step 0 below. Signing up under the property's own domain means the
  account survives a handoff and never has to be migrated off a personal
  address.
- **Display name:** `Captain's Cottage` (Pinterest shows this everywhere).
- **Username:** `captainscottageva` if free. It becomes pinterest.com/<username>.
- **Website:** `https://captainscottageva.com`
- **Bio (paste this):**

  > A waterfront cottage on Virginia's Northern Neck, where the Potomac meets
  > the Chesapeake Bay. Dock, cedar sauna, hot tub, crabbing, and a slow
  > weekend 2¾ hours from Washington DC.

- Skip every "grow your business" upsell and the ads onboarding.

**Done when:** you can see the Pinterest business hub.

---

## 2. Claim captainscottageva.com

Settings, then **Claimed accounts**, then **Claim** next to Websites.

Pinterest gives you an HTML meta tag that looks like:

```html
<meta name="p:domain_verify" content="a1b2c3d4e5f6..." />
```

**You only need the `content` value.** Paste just that string into
`src/lib/site.ts`:

```ts
pinterestVerification: "a1b2c3d4e5f6...",
```

Then commit and push. GitHub Actions deploys in about two minutes. Come back to
Pinterest and hit **Verify**.

The plumbing is already in place: `BaseLayout.astro` emits the tag on every page
only when that value is non-empty, so the head stays clean until you fill it in.
The code is not a secret, same as the Cloudflare beacon token that already ships
in the page source.

**Why this matters:** claiming attributes every pin that links to the domain,
including pins other people create from your site, and it unlocks domain-level
analytics. Do not skip it.

**Done when:** Pinterest shows captainscottageva.com as claimed.

---

## 3. Rich Pins: nothing to do

**This step is obsolete.** Pinterest retired the Rich Pins validator and the
application flow (`developers.pinterest.com/tools/url-debugger/` now redirects
to the docs overview, which is what Will hit on 2026-08-08). Since late 2022 the
process is automatic: a page carrying the right metadata becomes an Article Rich
Pin when someone saves it. There is no form, no validation, no approval.

What the site needed for that was real, though, and was fixed on 2026-08-08:
every page was hardcoded to `og:type="website"`, journal posts included, and
`og:type` is exactly what Pinterest reads to decide whether a URL earns an
Article Rich Pin. `BaseLayout.astro` now takes an `ogType` prop, and
`BlogPost.astro` passes `"article"` plus `article:published_time` and
`article:author`. Confirmed live on the production site.

Journal posts now emit: `og:type=article`, `og:site_name`, `og:title`,
`og:description`, `og:url`, `og:image`, `article:published_time`,
`article:author`, plus `BlogPosting` JSON-LD. That is more than Article Rich
Pins require.

**Done when:** nothing. It is already done.

---

## 4. Create the five boards

Boards are search surfaces, so the names are keywords, not branding. Create each
one **public**, and paste the description. Board descriptions carry ranking
weight, which is why these read like meta descriptions rather than slogans.

| Board name | Description to paste |
|---|---|
| **Virginia's Northern Neck** | Where the Potomac meets the Chesapeake Bay: Reedville, Irvington, Kilmarnock, Heathsville, and the quiet waterfront in between. Travel guides, day trips, and what to do on Virginia's Northern Neck. |
| **Weekend Getaways from Washington DC** | Weekend trips and long weekends within three hours of Washington DC. Waterfront stays, drive times, no Bay Bridge traffic, and where to go instead of the Eastern Shore. |
| **Chesapeake Bay Travel** | Chesapeake Bay travel on the Virginia side: tidal creeks, working fishing villages, crabbing, oysters, and small-town waterfronts worth the drive. |
| **Waterfront Cottage Stays** | Waterfront cottage rentals and cabin stays with a private dock. Cedar sauna, hot tub, kayaks, and swimming off the dock on a quiet tidal creek. |
| **Slow Weekends and Cabin Trips** | Slow travel and unplugged weekends. How to actually disconnect, what to pack, and the kind of trip you come home from rested instead of needing another vacation. |

Add a cover image to each once pins exist. Not urgent.

**Done when:** five public boards exist with those descriptions.

---

### Stop here if you are posting manually

Steps 0 to 4 are everything you need for Stage A: I queue pins, you approve
them, you add them to Pinterest's own scheduler (10 pins, 30 days out) yourself.

Steps 5 and 6 exist to remove that manual step. Do them when the manual pace
starts to annoy you.

---

## 5. Create the developer app and get a token

Go to **developers.pinterest.com/apps/**.

- **Create app.** Name it `Captain's Cottage publisher`. Describe it as posting
  the property's own pins to its own account.
- **Trial access is not instant.** It goes into a review queue and the app sits
  at "Trial access pending" until Pinterest approves it. Discovered 2026-08-10;
  the earlier note that Trial is available by default was wrong. Pinterest also
  caps you at one open connect request at a time.
- **CORRECTED 2026-08-21: Trial is NOT sufficient.** The earlier note here said
  Trial could post to the token owner's own account and that Standard was
  unnecessary. That was wrong. Trial apps cannot create Pins against
  `api.pinterest.com` at all; every attempt returns
  `403 {"code":29,"message":"Apps with Trial access may not create Pins in
  production ... use API Sandbox https://api-sandbox.pinterest.com instead."}`
  Pins created on Trial are sandbox entities visible only to their creator.
  **Standard access is required to publish real pins**, and Standard requires
  submitting a screen-recording video demo for review. See
  "Standard access upgrade" below.
- Both tiers are free.
- **Scopes:** `pins:read`, `pins:write`, `boards:read`, **`boards:write`**. The
  last one is what lets the boards be created for you instead of by hand.
- **Redirect URI:** `https://captainscottageva.com/` is fine; we are not
  building a login flow.
- Generate an access token and copy it. **Pinterest shows it once.**

**Done when:** you have a token string in your clipboard.

---

## 6. Mint the token and create the boards (one command)

Pinterest v5 does not give you a usable token on the app page. The App ID and
App secret shown there are **not** bearer tokens; using them directly returns
`401 Authentication failed`, which is what happened on 2026-08-10. A real token
comes from an OAuth round trip.

`scripts/pinterest-auth.mjs` does the whole thing in one run. From PowerShell:

```powershell
cd c:\Code\buffalo-rentals\captainscottage
node scripts/pinterest-auth.mjs
```

It will:

1. Ask for the **App ID** (1600288) and the **App secret**.
2. Print a consent URL and open it. Approve the app as yourself.
3. Drop you back on `https://captainscottageva.com/?code=...`. The page looks
   normal; the code is in the address bar. **Paste the code, or the whole URL,
   back into the prompt.** It accepts either.
4. Exchange the code for an access token and a refresh token, saving both to
   `.pinterest-token.local`, which is gitignored and never committed.
5. Verify the token against `/v5/user_account` before writing anything.
6. Create the five boards and print the `PINTEREST_BOARD_MAP` value.

The redirect URI has to match what is registered on the app **exactly**,
trailing slash included. Default is `https://captainscottageva.com/`. If the app
has a different one, set `PINTEREST_REDIRECT_URI` before running.

The authorization code is single use. If the exchange fails, start the command
again rather than reusing the code.

### Then the two repo secrets

The GitHub Action needs these; the local token file is not visible to CI.

- **`PINTEREST_ACCESS_TOKEN`** = `access_token` from `.pinterest-token.local`
- **`PINTEREST_BOARD_MAP`** = the JSON line the script printed

GitHub, repo **willrphillips/captainscottage**, Settings, Secrets and variables,
Actions, New repository secret.

**Note the expiry.** Pinterest access tokens are not permanent (the token file
records `expires_at`). When the publisher starts failing with 401, re-run
`pinterest-auth.mjs` and update the secret, or wire the saved refresh token into
the publisher. That is a known open item, not a solved one.

**Done when:** the boards exist and both secrets are set.

---

## What happens automatically after that

| When | What |
|---|---|
| Sunday 11:00 UTC | Pins get rendered and queued at `draft`. Discord ping. |
| You, whenever | Approve pins (in capcom, once it is built) |
| Daily 14:00 UTC | Approved pins whose date has arrived get posted, max 3 per day |
| Friday 12:00 UTC | Edwin posts the state of play to Discord |
| 1st of the month | The researcher re-verifies Pinterest's specs and rewrites the playbook |

**The gate does not move.** Agents write `draft`. Only Will writes `approved`.
The publisher posts nothing else, and there is no override flag.

---

## Publishing: Todoist click-to-publish (LOCKED 2026-08-21)

**The API route is dead and we are not reviving it.** Our app (id 1600288) holds
Trial access, and Trial apps cannot create Pins on `api.pinterest.com`; every
attempt returns `403 code 29`. Standard access would fix it but requires
recording a screen-capture video demo (OAuth flow running, a live API call, no
sensitive data on screen), uploading it at My apps, app card, Upgrade, and then
waiting out a review that community reports put at roughly 12 days to 2 weeks.
Will's call: not worth it for one to three pins a day.

**What we do instead.** Pinterest's public save endpoint needs no app, no token
and no access tier:

```
https://www.pinterest.com/pin/create/button/?url=<destination>&media=<image>&description=<text>
```

`scripts/pinterest-todoist-queue.mjs` reads `content/pins/*.json`, and for every
pin at `status: "approved"` builds that link and creates a Todoist task due at
the exact publish moment, with a push reminder set for the same time. Will taps
the task, Pinterest's composer opens with the image, the destination link (UTMs
intact) and the description already filled, he picks the board, pastes the
title, publishes.

**Two fields the save endpoint cannot pre-fill:** board and title. Both are
written into the task description for copy/paste. Everything else arrives.

| Piece | Where it comes from |
|---|---|
| `media` | `public/pins/<id>.jpg`, live at `captainscottageva.com/pins/<id>.jpg` |
| `url` | the pin's `destinationUrl`, UTMs already baked in |
| `description` | the pin's `description` |
| due date | the pin's `scheduledFor` |
| due time | `PIN_PUBLISH_TIME`, default `10:00` `America/New_York` |

**The approval gate is unchanged.** Only `status: "approved"` is queued. Agents
write `"draft"`; `"approved"` is Will's word alone. A queued pin flips to
`status: "queued"` and records its `todoistTaskId`, so it is never queued twice.

**Wiring.**

| Piece | Value |
|---|---|
| Workflow | `.github/workflows/pinterest-todoist-queue.yml`, daily 13:30 UTC |
| Parked workflow | `.github/workflows/pinterest-publish.yml`, cron removed, manual only |
| Todoist project | `Buffalo Rentals Dated` (`6FwqXhv2wM64hGGg`) |
| Todoist label | `pinterest` |
| Repo secret needed | `TODOIST_API_TOKEN` |
| Optional repo vars | `TODOIST_PROJECT_ID`, `PIN_PUBLISH_TIME` |

Without `TODOIST_API_TOKEN` the script dry-runs, logs the links it would have
created and exits clean. Get the token at Todoist Settings, Integrations,
Developer, API token.

**First four tasks were created by hand 2026-08-21** through the Todoist MCP
connection, before the secret existed, and recorded with
`node scripts/pinterest-todoist-queue.mjs --mark <pinId>=<taskId>,...`. That
flag writes state only; use it any time a task is created outside the script.
