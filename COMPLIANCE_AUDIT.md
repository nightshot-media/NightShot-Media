# Compliance Audit: Nightshot Media website

Audit date: 2026-11-13. Scope: the entire repository (static HTML/CSS/JS site, no framework, no build step, no package.json, no tests).
This is an engineering review, **not legal advice**. Nothing here guarantees compliance; the legal pages are drafts for an attorney to review.

Legend: [x] done in code, [ ] needs owner input / decision.

## 1. What was found (inventory)

| Item | Finding |
|---|---|
| Stack | Plain static HTML + one stylesheet + two small scripts (`js/consent.js`, `js/site.js`). Hosting: Namecheap (per owner). Source is in GitHub (`nightshot-media/NightShot-Media`). |
| Public pages | `index.html` (portfolio), `about.html`, `contact.html`; added: `privacy.html`, `terms.html`, `cookies.html`, `accessibility.html`, `privacy-request.html` |
| Forms | Contact form (name, email, message). No backend: it composes a `mailto:` to contact@nightshot.media in the visitor's mail app. Added: Privacy Request form (same mechanism). |
| Analytics / pixels / SDKs | **None.** No GA, Meta/TikTok pixel, Hotjar, chat, CRM, ads. |
| Cookies | **None set by the site.** |
| localStorage | One key, `nightshot_consent` (added by this work) storing the visitor's choice. sessionStorage: none. |
| Third-party services | **Vimeo** player iframes (`player.vimeo.com`) only; see section 4. |
| External scripts / CDNs / fonts | None. Font is self-hosted (`fonts/sequel-100-black.ttf`); system font stack for body text. |
| APIs / email / newsletter | None in the repo. No newsletter. |
| Payments / checkout / accounts | None. |
| Uploads | None. |
| Images / video | 8 JPG thumbnails (frames from Vimeo, saved locally); videos are Vimeo embeds (originals in Dropbox "NIGHTSHOT MULTICAM PORTFOLIO 2026"). |
| Reviews / testimonials / ratings / counters | None. |
| Pricing / fees | None shown. |
| Marketing claims | See section 7. |
| Existing legal pages | None existed. |
| Secrets / credentials | None found (searched current files and git history). |

## 2. Risk areas found (before changes)

1. No privacy policy, terms, cookie disclosure, accessibility statement, or privacy-request route.
2. Vimeo iframes loaded on a single click with no notice that Vimeo receives visitor data / may set cookies.
3. Contact form had no notice about what happens to submitted data.
4. Home page had no `<h1>`, no `<main>` around the intro, no skip link, no visible focus styling (`outline: none` on inputs), video "buttons" were clickable `<div>`s (not keyboard reachable), form-field borders below 3:1 contrast, inline `style` attribute (blocks a strict CSP).
5. No Content Security Policy / referrer policy.
6. Font licensing unverified (see ASSET_LICENSE_AUDIT.md).
7. Music/performance rights in portfolio videos unverified (see ASSET_LICENSE_AUDIT.md).

## 3. What was implemented (final status)

| # | Area | Status |
|---|---|---|
| 1 | Privacy Policy (`privacy.html`) | [x] Written only for data this site actually handles. Business described as "Nightshot Media, based in Massachusetts, United States" (no LLC yet). Host: Namecheap. Retention: indefinite unless deletion requested. No sale/rental of data. |
| 2 | Terms of Service (`terms.html`) | [x] Draft. Governing law: Commonwealth of Massachusetts. No venue stated. Not yet attorney-reviewed. |
| 3 | Cancellation & Refund | [x] Owner has no policy yet, so **no page is published and no footer link exists** (nothing invented). Terms say cancellation/refund terms are agreed per booking. A ready-to-fill template is in git history (commit `a5451c5`, file `cancellation.html`); restore it with `git show a5451c5:cancellation.html > cancellation.html`, fill it in, and re-add the footer link in each page. |
| 4 | Cookie Policy (`cookies.html`) | [x] Table of the two technologies actually used. |
| 5 | Consent system | [x] See "Consent design" below. |
| 6 | Form consent | [x] Contact + Privacy Request forms explain mailto behavior and link to the Privacy Policy. No marketing opt-ins exist; no pre-checked boxes. |
| 7 | Data minimization | [x] Retained: name, email, message (all needed to reply). Nothing sensitive collected; forms warn against sending sensitive info. Nothing needed removing. |
| 8 | Third-party audit | [x] Section 4. |
| 9 | Dark patterns | [x] None existed. New consent UI: Accept / Reject / Save equal size, color and position; nothing pre-selected. |
| 10 | Hidden fees | [x] No prices on site. Nothing to fix; do not add prices without disclosing mandatory fees. |
| 11 | Fake reviews | [x] None found. |
| 12 | Unsupported claims | [x] Flagged in section 7; nothing deleted. |
| 13 | Alt text | [x] Thumbnails are inside buttons labelled "Play video: <title>", so images use `alt=""` (decorative, avoids duplicate announcement). Video iframes get a `title`. |
| 14 | Contrast | [x] axe-core WCAG 2.2 AA scan: 0 violations on all 9 pages. Form field borders raised from #222 to #767676 (3:1+); placeholder color set explicitly. Brand colors unchanged. |
| 15 | Keyboard | [x] Skip link; real `<button>`s for video; visible green focus ring; native `<dialog>` for preferences (focus trap, Esc, focus return); Esc/"Not now" on video notice. Tested with Playwright. |
| 16 | Business details | [x] Footer + legal pages identify "Nightshot Media" and contact@nightshot.media. Legal entity, address, phone: not on the site; not invented. |
| 17 | Children | [x] No child-directed features. Children's section added to Privacy Policy. No age gate. |
| 18 | Email unsubscribe | [x] No newsletter or generated emails exist. Policy states future marketing will include opt-out. If you later add a provider (Mailchimp, etc.), enable its unsubscribe + physical-address footer. |
| 19 | Asset licensing | [x] `ASSET_LICENSE_AUDIT.md` |
| 20 | Privacy request | [x] `privacy-request.html` (mailto-based form + direct email). No automatic deletion; handled manually by whoever monitors the inbox. |
| - | Footer links | [x] Privacy, Terms, Cancellation & Refunds, Cookie Policy, Cookie Preferences, Accessibility, Privacy Request. Small muted text under the existing footer; not in main nav. |
| - | Accessibility statement | [x] `accessibility.html` (targets WCAG 2.2 AA, no claim of full conformance). |
| - | Security | [x] Strict CSP meta tag (self + `frame-src player.vimeo.com`), referrer policy, inline script/style removed, `maxlength` on fields, no `innerHTML` with user data. No secrets. Contact form has no backend so no CSRF/injection surface. |
| - | SEO/metadata | [x] Unique `<title>` and description per legal page, one `<h1>` each, logical headings. No `<link rel="canonical">`: the final domain isn't known; add `https://<your-domain>/<page>` once decided. `cancellation.html` is `noindex`. |

### Consent design (and one deliberate deviation)
Nothing non-essential loads on page view, so **no banner appears on load** (you asked for no unnecessary popups). Instead:
- **Click-to-load notice** on each video before Vimeo's player loads: "Play video" / "Always allow Vimeo" / "Not now".
- **Cookie Preferences dialog** (footer + Cookie Policy page): Accept All, Reject Non-Essential, Save Preferences; Vimeo toggle off by default; choice stored 12 months, then re-asked.
- Vimeo is requested with `dnt=1`.
- If you ever add analytics/pixels, add a checkbox in `js/consent.js` and gate the script on `NightshotConsent`; a load-time banner can then be added.

## 4. Third-party services

| Service | What / why | Data it may receive | Cookies | Loads before consent? | Necessary? |
|---|---|---|---|---|---|
| Vimeo player (`player.vimeo.com`) | Plays portfolio videos | IP, device/browser, referring page, playback info | May set cookies/storage (set by Vimeo; `dnt=1` requested) | **No**, only after click + notice | Yes for videos; optional for the site |
| Vimeo oEmbed (thumbnail fetch) | Used once at build time to save thumbnails locally | n/a to visitors | n/a | n/a (not on the live site) | n/a |
| Dropbox | Source storage of original videos; not referenced by the site | none | none | n/a | n/a |
| Namecheap (hosting) | Serves the site | IP/UA in server logs | possibly none | n/a | Yes |

## 5. Security review
- No API keys, tokens, passwords, or env vars in repo or history.
- No XSS sinks with untrusted data (`innerHTML` is used only with static strings). No `eval`, `document.write`, open redirects, uploads, or database.
- Forms use `mailto:`; values are `encodeURIComponent`-encoded. Spam: nothing is stored server-side, so no endpoint to abuse.
- No source maps / debug output. No analytics receiving sensitive data. No sensitive data in URLs.
- Larger item to consider later (not changed): GitHub Pages cannot set HTTP security headers; if you move to Netlify/Cloudflare, add `X-Content-Type-Options`, `Referrer-Policy`, and `frame-ancestors` via headers (meta CSP cannot set `frame-ancestors`).
- If you add a real form backend later, add server-side validation, rate limiting/spam protection (e.g., hCaptcha/Turnstile, which would need disclosure) and CSRF protection.

## 6. Owner decisions recorded (2026-11-13) and what is still open

Recorded and applied to the pages:
- No LLC yet: pages use "Nightshot Media", based in Massachusetts, USA. **Update the name (e.g., "Nightshot Media LLC") in all legal pages once the entity exists.**
- Governing law: Massachusetts. Hosting: Namecheap. Retention: indefinite unless deletion is requested. Does not sell or rent data.
- Cancellation/refund rules: none for now (page not published).
- Public mailing address: none for now (email only).
- Privacy requests are handled by the two owners (Ross McGregor and the account owner) through contact@nightshot.media.
- Captions: being considered (stated as such in the Accessibility Statement).
- Attorney: none yet. Pages are unreviewed drafts.

Still open / worth doing:
1. Have an attorney review the Privacy Policy and Terms (especially the liability limit and indemnity clauses). Consider forming the LLC first, then update the name everywhere.
2. "Keep forever" retention is a valid disclosure but weaker than a fixed period under some laws (e.g., GDPR storage limitation). Consider adding a period later.
3. Email provider is described generically ("our email service provider"); name it if you want more specific disclosure.
4. Until an entity exists, ownership of the videos/IP and the business sits with the two of you personally; an LLC and a short partner agreement would clarify who owns the portfolio content.
5. Domain/canonical URL once final.

## 7. Flagged for owner verification (not changed)
- "Live switching, synced multi-angle edits, and clean audio. ... we bring the gear and the crew to cover it all." (About): confirm accurate.
- "Live events · Concerts · Conferences" (home): the portfolio shows only concerts/club events; confirm you serve conferences.
- "Multicam Video Production": fine as a description; no measurable/superlative claims (no "#1", "best", counts, awards) were found.
- Artist/venue names in titles (Silva Bumpa, Ashibah, DJ Costa, Boys Noize, Bijou, Big Night Live, We Belong Here): confirm you may name them and show their performances publicly.
- "Ross McGregor" appears in Vimeo titles/filenames. He is a partner (per owner), so no separate credit question; he is not named on the site.
- Video-card title mismatches: the third Silva Bumpa video is titled "SILVA BUMPA 10" on Vimeo, and the DJ Costa card uses the video titled "HAPPY DAZE 9" on Vimeo (per your instruction). Rename on Vimeo if public titles matter.

## 8. Testing performed
No project build/lint/type-check/test tooling exists (static site). Instead:
- axe-core (WCAG 2.0/2.1/2.2 A+AA + best-practice) on all 9 pages: 0 violations.
- Playwright (Chromium) at 1280, 768 and 375 px: no horizontal overflow, no console errors/warnings, CSP did not block anything.
- Scripted flows (all passed, re-run after the 2026-11-13 content update): no storage/cookies/iframes/popups on first load; Vimeo blocked until choice; Play once / Always allow / Not now; Accept, Reject, Save, change later; 12-month expiry; focus trap, Esc, focus return; skip link; form validation; all footer links 200.
- Not tested: actual Vimeo playback inside the iframe (headless/offline limitations), real mail-client handoff for `mailto:`, screen readers (NVDA/VoiceOver), Safari/Firefox. Please spot-check these on the live site.
