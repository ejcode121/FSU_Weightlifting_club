# Handoff — FSU Weightlifting Trip Budget & Fundraising Planner

_Last updated: 2026-10-11 · Branch: `claude/fsu-budget-calculator-wfvkko`_

## 0. Update — Richmond scenario build (v2)
Requester confirmed: **USAW University Nationals, Richmond VA, Apr 15–18, 2027** (Greater Richmond Convention Center). Arrive 2 days
before the meet, 1 rest day, compete, clean up, then either drive home next morning (**3 nights**) or red-eye home (**2 nights**).
Red-eye only if there is a charter driver or a flight; vans do not red-eye. Multiple options are the point of the calculator.

Built in `index.html`:
- Fundraising window now **6 months** (Nov 2026 → Apr 2027): $11,000 ÷ 18 ÷ 6 = **$101.85/student/month**; default monthly target raised to $110.
- **Airbnbs**: miles + drive-minutes to venue, A–D grade (distance + $/person/night; settings in "Grading settings"), sort by grade/cost/distance, grade filter.
- **Transport** limited to van / charter bus / flight (older types still load). Van rental days = nights + 1 + extra; bus = base + layover days + driver hotel + tip; flight adds ground transport. Per-transport "Allow red-eye" checkbox (default on for bus/flight, off for van).
- **Matrix** = Airbnb × transport × nights; bus and flight appear twice (3-night stay-over, 2-night red-eye).
- Optional "day your lifters compete" date field prints the arrive/meet/home dates and a late-check-out reminder for red-eye.
- `normalize()` upgrades older saved/imported data; storage key bumped to `fsu-lifting-budget-v2` (v1 placeholder data not migrated).
- Tested headless (34 checks: costs, grades, red-eye rule, sort/filter, persistence, legacy import, export, reset, job add/edit/delete dialog paths, dark mode load). Still untested: real phone, Safari.

Still placeholders / to verify: all prices, ~1,500 mi round-trip driving estimate, entry fee, bus hours-of-service (a ~10–11 h drive may need two drivers or a rest stop — ask the charter company), host late check-out for red-eye. Job list (Phase 2) is **not** updated yet.

_(Sections below describe v1 and are otherwise still accurate; the old 7-month / `days` van field / sample list notes are superseded by this section.)_

## 1. Goal (from the requester)
Interactive, easy-to-use budget calculator for the FSU weightlifting team (18 participants) that:
1. Cross-references **Airbnb/lodging** options with **transportation** options (interchangeable, like a calculator).
2. Sources **local freelance work** in the Tallahassee / FSU radius that students can do to fundraise.
3. Target: raise **$11,000** → ~$100 per student per month over **7 months**, via 1–2 shifts/month. Must be easy to search for work.

Math: 11,000 ÷ 18 ÷ 7 = **$87.30/student/month** needed; $100/month → $12,600 (≈$1,600 cushion).

## 2. Current status: v1 built, tested, pushed (no PR opened)
Single-file static app: `index.html` (~700 lines, vanilla JS/CSS, no dependencies, no build). `README.md` has usage notes.
Open the file in a browser, or host via GitHub Pages (Settings → Pages → deploy from branch, root).

### Tabs
- **1 · Trip** – team size, months, start month, monthly target, goal (fixed $ or "use selected trip total"); trip basics (nights, entry fee, food/day, misc);
  lodging cards (nightly, cleaning, service fee, tax %, sleeps, link → auto-computes number of places); transport cards
  (flight / rental van / personal cars / charter bus / per-person; auto-computes vehicles & fuel); **combo matrix** of every lodging × transport
  with total + per-person, green/yellow/red vs goal, cheapest starred, tap to select.
- **2 · Find Work** – 28 seeded jobs/fundraisers in 8 categories; keyword search, category chips, filters (area, weekday/evening/weekend, in-season month,
  "hits target in ≤2 shifts"), sort (per shift / hourly / shortest). Each card: $/shift, shifts-per-month needed for the target, season, where to look,
  Indeed / Handshake / Craigslist-gigs search links, +/− monthly shift stepper, Edit. "+ Add a job" dialog for custom jobs. Team fundraisers are "group" jobs (payout ÷ crew).
- **3 · Plan** – per-student monthly shift list, month-by-month bars (seasonal jobs count only in season) vs target line, team result/cushion/shortfall,
  copy-summary-for-group-chat, print, save/load JSON backup, reset.
- Sticky summary bar on all tabs: trip cost, goal, need/student/month, plan raises, status.

### Key code locations (`index.html`)
`SEED_JOBS`/`GROUP` (job data) · `TDEF`/`TFIELDS` (transport types) · `defaults()` (sample lodging/transport/state) ·
`lodgingCost`, `transportCost`, `extras`, `comboCost`, `goal`, `earn`, `monthEarn`, `plannedTotal` (calculations) ·
`render*` functions · `refreshLight()` (re-renders computed output without clobbering input focus) · `openJob()` (job dialog).
State is one object `S`, persisted to `localStorage` key `fsu-lifting-budget-v1`.

### Verification done
Headless Chromium (Playwright, 420px wide): loads with 0 console errors; matrix renders 12 combos; changing participants updates all totals; search/category/≤2-shift filters
work; steppers feed Plan tab; state persists across reload; screenshots of Trip and Find Work reviewed. Not tested: real phone, Safari, dark mode visuals, import/export file round-trip, the Edit/Add-job dialog submit/delete paths (dialog only opened).

## 3. Caveats / known limitations
- **All job pay rates are my estimates**, not live listings (no job-board access). Florida min wage assumed $15/hr (tipped ~$12) from Sept 30 2026 — verify.
- **Sample lodging/transport numbers are placeholders** — replace with real quotes. Destination/meet city not yet known.
- **Handshake search URL** (`fsu.joinhandshake.com/stu/postings?query=`) is unverified; Indeed/Craigslist URLs follow standard patterns.
- Seed "where to look" text is generic guidance; no specific businesses, phone numbers or contacts were invented.
- Group-fundraiser payouts (spirit night $400/6, clinic $600/6, car wash $500/6, concessions $900/10) are rough guesses.
- Earnings are gross (no taxes, gas for delivery gigs, etc.).
- Data is per-browser; sharing is by JSON backup file only.
- Team should confirm fundraising/money-handling rules with FSU Campus Rec / Club Sports.

## 4. Suggested next steps (not started)
1. Enter real meet city, 2–3 real Airbnb listings and van/flight/bus quotes; set the real goal.
2. Verify/adjust job rates with real postings; add specific local employers/contacts the team already knows.
3. Roster tracker: 18 lifters log completed shifts and see personal + team progress (needs shared storage — e.g. Artifact DB or a small backend; current app is local-only).
4. Publish a shareable link (GitHub Pages or a claude.ai Artifact).
5. Optional: auto-suggest a plan that hits the target with ≤2 shifts; per-month schedule of specific events (home-game dates, move-out weeks).
6. Open a PR to merge into the default branch when ready (none opened yet; repo had no commits before this work).

## 5. Git
Repo `ejcode121/fsu_weightlifting_club`; work branch `claude/fsu-budget-calculator-wfvkko` (pushed). Files: `index.html`, `README.md`, `HANDOFF.md`.
