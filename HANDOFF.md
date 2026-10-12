# Handoff — FSU Weightlifting Trip Budget & Fundraising Planner

_Last updated: 2026-10-11 · Branch: `claude/fsu-budget-calculator-wfvkko`_

## 00. Update — UI redesign ("Richmond Total")
The UI was rebuilt as a design piece; all logic is unchanged (same state shape, same storage key `fsu-lifting-budget-v2`).
- **Source now lives in `src/`**: `template.html`, `styles.css`, `core.js` (data + calculations), `ui.js` (rendering + events). Run `python3 tools/build.py` to regenerate the single-file `index.html` (inlines CSS, JS, and the base64 Archivo subset in `fonts/`). Edit `src/`, not `index.html`.
- Hero is a plain progress rectangle (raised ÷ goal, turns green past the goal) with Raised / Goal / Still to raise readouts. Grades are rings, transport options are tickets, a "Smart picks" row and delta-vs-goal matrix, a cumulative chart with the Mar 4 2027 early-bird deadline and meet marker, a per-month chart, and "Suggest a plan".
- Tested headless: 35 checks pass (logic, red-eye rule, grades, persistence, import/export, job dialog), no console errors, light/dark at 390 and 1280 px. Not tested: real phone, Safari.
- Still to verify: real prices, driving distance, bus hours-of-service, USAW membership, host late check-out, Phase 2 job postings.

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

Entry fee researched (USAW 2027 calendar announcement + event page, both agree): $145 early bird (closes Mar 4 2027), $175 regular (Mar 18), $375 late (Apr 1), 2:00 p.m. MT; registration opens Jan 1 2027; qualifying window Mar 18 2026–Mar 18 2027. Planner default = $175/lifter. USAW annual athlete membership ($65 junior 18–20, $79 senior 21–34) is NOT included; confirm whether it's required.

Still placeholders / to verify: all prices, ~1,500 mi round-trip driving estimate, bus hours-of-service (a ~10–11 h drive may need two drivers or a rest stop — ask the charter company), host late check-out for red-eye. Job list (Phase 2) is **not** updated yet.

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

## Live links (src/live.js)
Static file, so no live scraping. "Live links" (Trip) and "Live this week" (Find work) rebuild real search URLs at every page open: today's date, meet day, and lifter count go into the Airbnb/Vrbo/Google Flights links; 4 job searches rotate daily (Indeed past-7-days, Handshake, Craigslist); Eventbrite flips between this week and this weekend. Verified: calendar.fsu.edu and the USAW 2027 calendar page load; Volunteermatch redirects to Idealist, so Idealist is linked directly. Eventbrite/Airbnb/Enterprise-style URL patterns could not be fetched from the sandbox. Click-test them from a real browser.

## Map wrapper (src/discover.js)
Stay map (venue at center, rings, pins graded A–D, hollow pins = nearby) and a Tallahassee→Richmond route map (pins: vans, TLH/RIC flights, charter bus). Clicking a pin opens a popover with two actions: **View on website** (opens the real site) or **Add to trip** / **Use this stay**. Added items go straight into the matrix; prices from nearby/transport pins are flagged "Estimated" until edited.
- Live sources, fetched on open when the cache is >24h old (key `fsu-lifting-discover-v1`), keyless: OpenStreetMap Overpass (hotels/motels/guest houses/apartments/hostels near the venue; car-rental branches near Tallahassee), OSRM (road miles/minutes, the route), Nominatim (address → pin).
- **Airbnb has no public data feed and its terms forbid scraping, so Airbnb listings cannot be pulled automatically.** "Add Airbnb by link" takes the listing URL, an address (geocoded onto the map), and the price breakdown; it then behaves like every other stay.
- OSM has no prices, so nearby stays use per-type estimates. Flights/vans/bus use the sample prices.
- Verified only against mocked responses (31 checks in the scratchpad test_maps.py): the sandbox can't reach overpass/osrm/nominatim. Real-world check needed. If Overpass is slow or rate-limited the map just shows the last cached data or "Offline".

## Researched Airbnbs (src/core.js RESEARCHED)
Checked on airbnb.com via Claude in Chrome on Oct 11 2026: Richmond, Apr 13–16 2027, 18 guests, filter 9+ beds (2 per bed → sleeps = beds × 2). 10 listings replace the old samples (old saved sample stays are swapped automatically in `normalize`). Prices are Airbnb's all-in totals; nightly = 3-night total − 2-night total, remainder goes in "cleaning" (so the red-eye 2-night version is priced from a real 2-night quote). Fan home had no 2-night quote (flagged); two listings had a negative fixed part, so they use total÷3. Road miles/minutes from OSRM; coordinates from Airbnb's search data. Four Moseley estates are ~20 mi / 33 min away (grade D). Not counted: couch capacity (unknown from search cards), Jackson Ward duplex (8 beds). Prices/availability change, so re-check before booking.


## Freelance gigs (Oct 2026 – Apr 1, 2027)
- Job list replaced by researched, dated freelance/event gigs (src/core.js: SEED_JOBS, GROUP, EVENT; SEED_VER=3 migrates saved data and keeps user-added jobs).
- Sources checked in Chrome: FHSAA XC State Finals Nov 20 (Apalachee Regional Park), NCAA South Regional XC (mid-Nov, date unconfirmed), Turkey Trot Nov 26, Tallahassee Marathon Feb 7 2027, FSU home football concession stands (Volunteer Leon / Idealist), Instawork Tallahassee.
- Springtime Tallahassee (Apr 2–3 2027) falls inside the 2-week pre-meet window, so it is excluded.
- Group payouts are ESTIMATES (organizers do not publish them); confirm each rate in writing. Whole-team crews use crew=16; 5-person crews also listed.

## Work calendar (replaces monthly shift tracking)
- Find work is now a month calendar (Oct 2026 – Apr 2027). Click a day for exact-date opportunities with time slot, crew, estimated pay, sign-up note and link. Undated fundraisers and solo gigs sit under "Any day".
- Data: `EVTS` in src/core.js (13 dated events, each with exact date + time slot). SEED_VER=4 migrates saved data and keeps jobs the user added.
- Plan tab: "Mark signed up" on an event counts its team payout toward the goal. No per-month counts, targets or charts.
- Verified Oct 11 2026: FSU home games Oct 31 (Clemson), Nov 21 (NC State), Nov 27 (Florida, 3:30 PM); Visit Tallahassee sign-ups for SWAC Oct 26, NCAA South Region Nov 13, AAU Nationals Dec 5 (shift lists need a free account); FHSAA finals Nov 20; Turkey Trot Nov 22 festival + Nov 26 race; Winter Festival/Jingle Bell Run Dec 5; Market Days Dec 5–6; Marathon Feb 7 (all-volunteer) with expo Feb 6.
- Unconfirmed: kickoff times Oct 31 and Nov 21, race times for cross-country days, expo day (site says "Saturday Feb 7"), all payouts (estimates).

## No estimates (v5)
- Removed every estimated payout, crew size, hourly rate and generic "any day" gig. Events keep only values read from organizer pages (date, time slot, venue, requirements, sign-up route). Pay shows "None listed" until the team types a confirmed payout and crew size on the event card; only confirmed payouts count toward the goal.
- Dropped Market Days (no organizer program found) and the marathon expo entry (race site says "Saturday Feb 7", a Sunday; noted on the race-day card instead).
- Instawork shifts (exact pay/date/time) are meant to be read from the user's iPhone Mirroring app via computer use; not done yet.
