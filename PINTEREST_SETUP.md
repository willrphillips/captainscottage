# Pinterest setup: Phase 0 runbook

**Status as of 2026-08-07, end of session.** Steps 0, 1, and 2 are done. The
domain is claimed. Picking back up at step 3, Rich Pins.

| Step | State |
|---|---|
| 0. `hello@` routing | Done. `hello@` and `will@` both forward to Gmail. |
| 1. Business account | Done. Username `captainscottageva`, name Captain's Cottage, email `captainscottageva@gmail.com`. |
| 2. Claim the domain | **Done. captainscottageva.com is claimed.** |
| 3. Rich Pins | **Next.** Validate a live post URL, then Apply. |
| 4. Five boards | Not started. Descriptions are in step 4 below, ready to paste. |
| 5-6. API + secrets | Not started, and not needed for Stage A. |

### Small loose end

The profile Website field reads `http://captainscottageva.com`. Worth changing
to `https://captainscottageva.com` so it matches the canonical hostname. Not
blocking anything.

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

## 3. Turn on Rich Pins

Go to **developers.pinterest.com/tools/url-debugger/**, paste any live post URL,
for example:

```
https://captainscottageva.com/journal/the-art-of-the-slow-weekend/
```

Hit validate, then **Apply**.

No code changes should be needed. The site already emits the OpenGraph tags that
Article Rich Pins read (`og:title`, `og:description`, `og:site_name`), because
`BaseLayout.astro` has emitted them since launch. If the validator complains,
send me the exact error and I will fix the tags.

**Done when:** the validator reports the pin as valid and you have applied.

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
- Trial access is what you get by default, and **Trial is sufficient for us**,
  because it can post to the token owner's own account, which is the only
  account we post to. Standard access requires submitting a video demo and we do
  not need it.
- Both tiers are free.
- **Scopes:** `pins:read`, `pins:write`, `boards:read`.
- **Redirect URI:** `https://captainscottageva.com/` is fine; we are not
  building a login flow.
- Generate an access token and copy it. **Pinterest shows it once.**

**Done when:** you have a token string in your clipboard.

---

## 6. Add the two repo secrets

GitHub, repo **willrphillips/captainscottage**, Settings, Secrets and variables,
Actions, New repository secret.

**a. `PINTEREST_ACCESS_TOKEN`** = the token from step 5.

**b. `PINTEREST_BOARD_MAP`** = a JSON map of board name to board ID. Board IDs
are not shown anywhere useful in the UI, so run this locally with the token in
your environment:

```bash
PINTEREST_ACCESS_TOKEN=your_token_here node scripts/pinterest-boards.mjs
```

It prints your boards and a ready-to-paste JSON line. Paste that as the secret
value.

**Done when:** both secrets are listed in the repo.

---

## What happens automatically after that

| When | What |
|---|---|
| Sunday 11:00 UTC | Pins get rendered and queued at `draft`. Discord ping. |
| You, whenever | Flip the ones you want from `draft` to `approved` in `content/pins/*.json` |
| Daily 14:00 UTC | Approved pins whose date has arrived get posted, max 3 per day |
| Friday 12:00 UTC | Edwin posts the state of play to Discord |
| 1st of the month | The researcher re-verifies Pinterest's specs and rewrites the playbook |

Until `PINTEREST_ACCESS_TOKEN` exists, the daily publisher runs as a dry run: it
logs what it would have posted and exits clean. That is the current state and it
is safe.

**The gate does not move.** Agents write `draft`. Only you write `approved`. The
publisher posts nothing else, and there is no override flag.

---

## Report back

Tell me when steps 0 to 4 are done, and specifically:

1. The exact board names you ended up with, if you changed any. The keyword bank
   and every queued pin reference boards by name, so a rename has to propagate.
2. Whether the Rich Pins validator passed or what it said.
3. Whether you want Stage A (manual posting) or to go straight to steps 5 and 6.

Then I run the researcher for the first real playbook, and the pin-writer
backfills the nine published posts, which is 27 pins waiting for your approval.
