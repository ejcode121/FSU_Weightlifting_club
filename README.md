# FSU Weightlifting – Trip Budget & Fundraising Planner

A single-file web app (`index.html`, no install, no server). Source is in `src/`; rebuild with `python3 tools/build.py`. Open it in any browser, or host it free with GitHub Pages
(Settings → Pages → deploy from branch, root).

**1 · Trip** – built for **USAW University Nationals, Richmond VA, Apr 15–18, 2027** (Greater Richmond Convention Center).
Enter team size, goal ($11,000 default), Airbnb options and transportation options.
- **Airbnbs** get a grade A–D from distance to the venue + cost per person per night (settings are adjustable). Sort by
  grade / cost / distance, or hide anything below a grade.
- **Transportation** is rental vans, charter bus, or flights. Schedule: arrive 2 days before the meet, 1 rest day, compete.
  Default is **3 nights** (drive home the morning after). A **red-eye home** (2 nights) is only offered for charter bus and
  flights (a pro driver / a flight does the overnight leg); vans stay the extra night. Each transport has an "Allow red-eye" checkbox.
- The matrix shows every Airbnb × transportation × nights combination with total and per-person cost against your goal.
- Fundraising window defaults to 6 months (Nov 2026 → Apr 2027).

**2 · Find Work** – searchable/filterable list of ~28 Tallahassee-area shift ideas and team fundraisers, each showing
earnings per shift and how many shifts/month hit your monthly target. Buttons open live Indeed / Handshake / Craigslist
searches. Pay rates are estimates – edit them, or add your own jobs.

**3 · Plan** – the shifts each student does monthly, a month-by-month chart (seasonal jobs only count in season),
and whether the team reaches the goal. Copy a summary for the group chat, save/load a backup file, or print.

Data is stored in the browser (localStorage, key `fsu-lifting-budget-v2`; the earlier v1 sample data is not carried over, but
old backup files still load). Sample lodging/transport numbers are placeholders – replace with real quotes. Driving distance
(~1,500 mi round trip incl. local) and bus/flight prices are rough estimates to verify.
