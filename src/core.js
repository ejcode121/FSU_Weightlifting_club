"use strict";
const KEY = "fsu-lifting-budget-v2";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CATS = ["Events & Game Day","Moving & Labor","Food & Hospitality","Yard & Home","Tutoring & Coaching","Campus & Research","Delivery & Gigs","Team Fundraisers"];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const usd = (n, d = 0) => (isFinite(n) ? n : 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: d, maximumFractionDigits: d });

/* ---------------- default data ---------------- */
// [title, cat, rate, hours, tips, area, when[], months|null, how-to-find, search query, description]
const SEED_JOBS = [
 ["Stadium / arena event staff","Events & Game Day",15,6,0,"campus",["weekend","evening"],null,"Game-day and Civic Center event jobs are posted on Handshake and by event-staffing companies.","event staff usher","Ushering, ticket-taking, guest services and crowd management at games, concerts and shows."],
 ["Event setup & teardown crew","Events & Game Day",17,5,0,"city",["weekday","evening","weekend"],null,"Rental, AV and staging companies hire day-of labor — lifters are great at this.","event setup crew","Set up and break down tables, stages and tents. Heavy lifting, short notice, good pay."],
 ["Festival & market vendor help","Events & Game Day",15,6,20,"near",["weekend"],[3,4,10,11],"Ask vendors at Market Days / Springtime Tallahassee–type events; check Facebook groups.","festival vendor booth","Run a booth, load/unload vendors, handle crowds at spring & fall festivals."],
 ["Catering server / banquet","Food & Hospitality",15,5,40,"city",["evening","weekend"],null,"Local caterers and event venues keep a flexible on-call student list.","catering server banquet","Serve at weddings, corporate events and fundraisers. Hourly plus tips."],
 ["Bartender / barback (21+)","Food & Hospitality",12,6,60,"near",["evening","weekend"],null,"Downtown and Midtown bars; barbacks need no experience.","barback bartender","Tipped base wage plus tips — one busy night can beat 2 regular shifts."],
 ["Restaurant host / busser","Food & Hospitality",12,5,35,"near",["evening","weekend"],null,"Walk in with a résumé between 2–4 pm.","restaurant host busser","Easy entry job around campus; tips vary."],
 ["Moving help (load & haul)","Moving & Labor",22,4,10,"city",["weekday","weekend"],null,"Local moving companies and “two guys and a truck” outfits; Craigslist gigs.","moving helper","Peak around move-out (Apr–May, Jul–Aug, Dec). Lifting experience = instant hire."],
 ["Apartment move-out cleaning","Moving & Labor",18,4,0,"near",["weekday","weekend"],[4,5,7,8,12],"Property managers and student-housing complexes near campus.","apartment turnover cleaning","Turnover cleaning between tenants; heavy demand at semester ends."],
 ["Junk removal / hauling","Moving & Labor",20,4,0,"city",["weekday","weekend"],null,"Junk-removal franchises and Craigslist/Facebook “haul away” requests.","junk removal helper","Lift, load, dump. Per-hour or per-job."],
 ["Yard work & landscaping","Yard & Home",18,3,0,"city",["weekday","weekend"],[3,4,5,6,7,8,9,10],"Landscaping crews; neighborhood Facebook / Nextdoor posts.","lawn landscaping helper","Mowing, edging, mulch. Summer heat — hydrate."],
 ["Leaf & gutter cleanup","Yard & Home",18,3,0,"city",["weekend"],[10,11,12,1,2],"Neighborhood groups; flyers in nearby residential areas.","gutter leaf cleanup","Fall/winter cleanup for homeowners."],
 ["Holiday-lights installation","Yard & Home",20,4,15,"city",["weekday","weekend"],[11,12],"Seasonal decorating companies hire in Oct–Nov.","holiday lights installer","Hang lights and decorations; ladders and teamwork."],
 ["Seasonal retail & gift wrap","Delivery & Gigs",15,5,0,"near",["evening","weekend"],[11,12],"Apply in October at malls (Governor's Square) and big-box stores.","seasonal retail associate","Holiday retail shifts; some stores guarantee weekend hours."],
 ["Mobile car wash / detailing","Yard & Home",20,3,15,"city",["weekend"],null,"Advertise in apartment complexes and Facebook groups.","car detailing","Build your own mini-business; supplies cost is small."],
 ["Tutoring (math, SAT/ACT, chem)","Tutoring & Coaching",25,2,0,"near",["weekday","evening"],null,"FSU tutoring centers, private-tutor boards, high schools & families.","tutor math","Highest $/hour of the “easy” options; short shifts."],
 ["Youth strength / sports coach","Tutoring & Coaching",20,2,0,"near",["evening","weekend"],null,"Local gyms, youth leagues, school athletic departments.","youth strength coach","Teach technique to kids and teens — great fit for lifters."],
 ["Personal training (cert. required)","Tutoring & Coaching",35,1,0,"campus",["weekday","evening"],null,"Campus Rec / local gyms; need CPT certification.","personal trainer","Few shifts, high rate — if someone on the team is certified."],
 ["Babysitting / nanny","Tutoring & Coaching",16,4,0,"near",["evening","weekend"],null,"Faculty families, FSU parent groups, Care/Sittercity-style sites.","babysitter","Flexible evenings and weekends."],
 ["Pet sitting / dog walking","Delivery & Gigs",18,2,0,"near",["weekday","weekend"],null,"Rover/Wag-style apps and apartment bulletin boards.","pet sitter dog walker","Easy to fit between practice and class."],
 ["Campus Rec official / lifeguard","Campus & Research",15,4,0,"campus",["weekday","evening"],[1,2,3,4,9,10,11],"FSU Campus Recreation hiring page / Handshake.","campus recreation official","Intramural referees and lifeguards; evenings during the semester."],
 ["Paid research studies","Campus & Research",15,1.5,0,"campus",["weekday"],[1,2,3,4,9,10,11],"FSU department participant pools, flyers in Psychology / Health buildings.","research study participant","Quick sessions, sometimes pay is a flat $10–25."],
 ["Summer orientation staff","Campus & Research",15,6,0,"campus",["weekday"],[5,6,7],"FSU Orientation / Student Affairs — apply in the fall or early spring.","orientation leader","Seasonal but steady hours."],
 ["Food / grocery delivery","Delivery & Gigs",16,3,0,"city",["weekday","evening","weekend"],null,"DoorDash, Uber Eats, Instacart — sign up once, work whenever.","delivery driver","Most flexible; gas and wear-and-tear reduce the real take-home."],
 ["Warehouse / package sorting","Delivery & Gigs",17,6,0,"city",["weekday","evening"],[11,12,1],"Shipping carriers hire seasonal help in the fall.","package handler warehouse","Peak season Nov–Jan. Good for lifters."],
 ["Restaurant “spirit night”","Team Fundraisers",0,3,0,"near",["evening"],null,"Ask a local restaurant to donate 15–20% of sales for one night; promote it on social.","",
   "GROUP: a busy night can bring in $300–500 for the team. Split across the people working/promoting."],
 ["Community Olympic-lifting clinic","Team Fundraisers",0,2,0,"campus",["weekend"],null,"Host a $20-per-person technique clinic at your gym; invite alumni, local gyms, high-school teams.","",
   "GROUP: 30 attendees × $20 ≈ $600. On-brand and low cost."],
 ["Team car wash","Team Fundraisers",0,4,0,"near",["weekend"],[3,4,5,6,7,8,9,10],"Ask a parking-lot owner (bank, auto parts store) for permission.","",
   "GROUP: roughly $400–600 for a good Saturday."],
 ["Stadium concession stand (org payout)","Team Fundraisers",0,6,0,"campus",["weekend"],[1,2,3,4,9,10,11,12],"Venues and concession companies often pay student orgs a share to staff stands. Ask early — spots fill up.","",
   "GROUP: payouts vary widely; confirm the rate before committing."],
];
// group-job payouts (title -> [payout, crew])
const GROUP = { "Restaurant “spirit night”":[400,6], "Community Olympic-lifting clinic":[600,6], "Team car wash":[500,6], "Stadium concession stand (org payout)":[900,10] };

function seedJobs() {
  return SEED_JOBS.map(j => {
    const g = GROUP[j[0]];
    return { id: uid(), title: j[0], cat: j[1], rate: j[2], hours: j[3], tips: j[4], group: !!g, payout: g ? g[0] : 0, crew: g ? g[1] : 1,
      area: j[5], when: j[6], months: j[7], how: j[8], query: j[9], desc: j[10] };
  });
}
// All dollar figures below are placeholders ("Sample") until the team has real quotes.
// redeye = may the team leave the night of the meet (one fewer night)? Only with a pro driver or a flight.
const TDEF = {
  flight:   { fare: 350, bags: 70, ground: 600, redeye: true },
  van:      { seats: 15, daily: 110, extra: 0, miles: 1500, mpg: 12, gas: 3.1, tolls: 50, redeye: false },
  bus:      { quote: 6500, layover: 450, driverHotel: 140, tip: 300, redeye: true },
  cars:     { seats: 4, miles: 1500, mpg: 28, gas: 3.1, tolls: 50, redeye: false },
  perperson:{ fare: 150, redeye: false }
};
const TFIELDS = {
  flight:   [["fare","Round-trip fare / person ($)"],["bags","Bags & fees / person ($)"],["ground","Ground transport, whole team ($)"]],
  van:      [["seats","Seats per van"],["daily","Rental $/day"],["extra","Extra rental days"],["miles","Round-trip miles (incl. local)"],["mpg","Van MPG"],["gas","Gas $/gal"],["tolls","Tolls/parking per van ($)"]],
  cars:     [["seats","People per car"],["miles","Round-trip miles"],["mpg","Car MPG"],["gas","Gas $/gal"],["tolls","Tolls/parking per car ($)"]],
  bus:      [["quote","Charter base quote, round trip ($)"],["layover","Layover fee per idle day ($)"],["driverHotel","Driver hotel per night ($)"],["tip","Driver tip ($)"]],
  perperson:[["fare","Cost per person ($)"]]
};
const TNAMES = { flight:"Flight", van:"Rental van", cars:"Personal cars", bus:"Charter bus", perperson:"Other (per person)" };
const TYPES = ["van", "bus", "flight"]; // offered in the type dropdown (older saved types still display)
const THINTS = {
  van: "Rental days = nights + 1 + extra days. Red-eye is off by default: the team would be driving overnight right after competing.",
  bus: "Cost = base quote + layover days idle in Richmond + driver hotel + tip. A drive this long may exceed one driver’s legal hours — ask whether two drivers or a rest stop are included.",
  flight: "Ground transport = airport rides at home plus getting around Richmond for the whole team."
};
const DEF_GRADE = { wDist: 50, near: 1, far: 10, cheap: 40, pricey: 110 };
const DEF_TRIP = { dest: "USAW University Nationals – Richmond, VA (Apr 15–18, 2027)", nights: 3, meetDay: "", reg: 175, food: 30, misc: 0 };

// Researched Oct 11 2026 on airbnb.com: Richmond, Apr 13 to 16 2027, 18 guests, homes with 9+ beds (2 people per bed).
// Prices are Airbnb's all-in totals. nightly = (3-night total − 2-night total); the rest of the 3-night total goes in "cleaning".
const AIRBNB_DATES = "checkin=2027-04-13&checkout=2027-04-16&adults=18";
// [id, name, beds, bedrooms, rating, reviews, total3, total2, lat, lon, miles, mins]
const RESEARCHED = [
 ["1015092192647683162","Two modern homes, open-concept living",15,10,4.94,16,2480,1791,37.56013,-77.43953,2.0,5],
 ["805241141416164519","City skyline views, double-decker patio",10,5,4.89,119,4347,3031,37.53626,-77.45068,2.3,6],
 ["1205889250411521454","Two connected rowhouses near Carytown",10,6,4.57,37,1997,1307,37.5454,-77.4661,2.9,7],
 ["1625039498783959627","Historic estate across from the VMFA",9,8,4.83,6,5501,3644,37.55557,-77.47495,3.2,9],
 ["39032482","Grand historic home in the Fan",9,7,4.81,182,2735,null,37.5539,-77.47474,3.3,9],
 ["1656852893934458391","Spacious single-level with a fireplace",9,4,4.5,4,3032,2117,37.47799775448436,-77.43253982326235,5.7,14],
 ["756547520899515842","Waterfront estate with pool, Moseley",10,10,4.65,17,3810,2815,37.43609,-77.68343,19.8,33],
 ["556388631376639302","Waterfront estate, 100 acres, Moseley",12,9,4.91,32,4630,3230,37.4352,-77.68281,19.8,33],
 ["741329525448578463","Waterfront estate, 13 bedrooms, Moseley",16,13,4.92,12,6575,4680,37.43427,-77.68155,19.8,33],
 ["741339124127363443","3-home estate with pool, Moseley",22,19,5.0,6,8590,6195,37.43619,-77.68136,19.9,33]
];
function researchedLodging() {
  return RESEARCHED.map(([id, name, beds, br, rating, rev, t3, t2, lat, lon, miles, mins]) => {
    let nightly = t2 ? t3 - t2 : t3 / 3, fixed = t3 - 3 * nightly;
    if (fixed < 0) { nightly = t3 / 3; fixed = 0; }
    return { id: uid(), name, url: `https://www.airbnb.com/rooms/${id}?${AIRBNB_DATES}`, nightly: +nightly.toFixed(2), cleaning: +fixed.toFixed(2), service: 0, tax: 0,
      sleeps: beds * 2, beds, br, rating, rev, miles, mins, lat, lon, src: "airbnb", srcId: "airbnb-" + id, checked: "2026-10-11", no2: !t2 };
  });
}
function defaults() {
  const L = researchedLodging();
  const T = [
    { id: uid(), type: "van", name: "Sample: 15-passenger vans", ...TDEF.van },
    { id: uid(), type: "bus", name: "Sample: Charter bus with driver", ...TDEF.bus },
    { id: uid(), type: "flight", name: "Sample: Flights", ...TDEF.flight }
  ];
  return {
    team: { people: 18, months: 6, start: "2026-11", target: 110, goalMode: "fixed", goal: 11000 },
    trip: { ...DEF_TRIP },
    grade: { ...DEF_GRADE }, lsort: "grade", lmin: "", selRed: false,
    lodging: L, transport: T, selL: L[0].id, selT: T[0].id,
    jobs: seedJobs(), plan: {}
  };
}
// fill in anything a saved/imported file from an older version doesn't have
function normalize(s) {
  s.trip = Object.assign({}, DEF_TRIP, s.trip);
  s.grade = Object.assign({}, DEF_GRADE, s.grade);
  s.lsort = s.lsort || "grade"; s.lmin = s.lmin || ""; s.selRed = !!s.selRed;
  s.lodging.forEach(l => { if (l.miles === undefined) l.miles = null; if (l.mins === undefined) l.mins = null; });
  if (s.lodging.length && s.lodging.every(l => /^Sample/.test(l.name) && !l.src)) { s.lodging = researchedLodging(); s.selL = s.lodging[0].id; } // swap the old sample stays for the researched ones
  s.transport.forEach(t => {
    if (t.type === "van" && t.extra === undefined) { t.extra = Math.max(0, (+t.days || 0) - (+s.trip.nights || 3) - 1); delete t.days; }
    if (t.type === "bus") { if (t.layover === undefined) t.layover = 0; if (t.driverHotel === undefined) t.driverHotel = 0; }
    if (t.type === "flight" && t.ground === undefined) t.ground = 0;
    if (t.redeye === undefined) t.redeye = t.type === "bus" || t.type === "flight";
  });
  return s;
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.team && s.jobs && s.lodging && s.transport) return normalize(s); } catch (e) {}
  return null;
}
let S = load() || defaults();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------------- calculations ---------------- */
const num = v => (isFinite(+v) ? +v : 0);
// Schedule model: arrive 2 days before the meet, 1 rest day, compete, then either
//   stay the night and drive home next morning (nights = base, default 3), or
//   red-eye home right after the meet (nights = base − 1) — only if that transport allows it.
const baseNights = () => Math.max(1, num(S.trip.nights));
const daysFor = n => n + 1;
const hasRed = t => !!(t && t.redeye) && baseNights() > 1;
const nightsFor = (t, red) => (red && hasRed(t)) ? baseNights() - 1 : baseNights();
function lodgingCost(l, n = baseNights()) {
  const units = Math.max(1, Math.ceil(num(S.team.people) / Math.max(1, num(l.sleeps))));
  const total = units * (num(l.nightly) * n + num(l.cleaning) + num(l.service)) * (1 + num(l.tax) / 100);
  return { units, total, label: `${units} place${units > 1 ? "s" : ""}` };
}
function transportCost(t, n = baseNights()) {
  const p = num(S.team.people);
  switch (t.type) {
    case "flight": return { total: p * (num(t.fare) + num(t.bags)) + num(t.ground), label: `${p} seats` };
    case "van": { const u = Math.max(1, Math.ceil(p / Math.max(1, num(t.seats)))), rd = daysFor(n) + num(t.extra);
      return { total: u * (num(t.daily) * rd + num(t.miles) / Math.max(1, num(t.mpg)) * num(t.gas) + num(t.tolls)), label: `${u} van${u > 1 ? "s" : ""} × ${rd} days` }; }
    case "cars": { const u = Math.max(1, Math.ceil(p / Math.max(1, num(t.seats))));
      return { total: u * (num(t.miles) / Math.max(1, num(t.mpg)) * num(t.gas) + num(t.tolls)), label: `${u} car${u > 1 ? "s" : ""}` }; }
    case "bus": return { total: num(t.quote) + num(t.tip) + num(t.layover) * Math.max(0, n - 1) + num(t.driverHotel) * n, label: `1 bus` };
    default: return { total: p * num(t.fare), label: `${p} people` };
  }
}
const extras = (n = baseNights()) => num(S.team.people) * (num(S.trip.reg) + num(S.trip.food) * daysFor(n)) + num(S.trip.misc);
const comboCost = (l, t, n = baseNights()) => lodgingCost(l, n).total + transportCost(t, n).total + extras(n);
const selL = () => S.lodging.find(x => x.id === S.selL) || S.lodging[0];
const selT = () => S.transport.find(x => x.id === S.selT) || S.transport[0];
const selRed = () => !!S.selRed && hasRed(selT());
const selN = () => nightsFor(selT(), selRed());
const tripTotal = () => (selL() && selT()) ? comboCost(selL(), selT(), selN()) : extras(selN());
function variants(t) {
  const n = baseNights(), v = [{ t, n, red: false }];
  if (hasRed(t)) v.push({ t, n: n - 1, red: true });
  return v;
}

// Airbnb grade (A–D): distance to the venue + price per person per night
const clamp01 = x => Math.max(0, Math.min(1, x));
const GRANK = { A: 4, B: 3, C: 2, D: 1 };
function lodgingGrade(l) {
  if (l.miles === null || l.miles === undefined || l.miles === "") return null;
  const g = S.grade, n = baseNights(), people = Math.max(1, num(S.team.people));
  const pp = lodgingCost(l, n).total / people / n;
  const d = clamp01(1 - (num(l.miles) - num(g.near)) / Math.max(.1, num(g.far) - num(g.near)));
  const c = clamp01(1 - (pp - num(g.cheap)) / Math.max(1, num(g.pricey) - num(g.cheap)));
  const w = clamp01(num(g.wDist) / 100);
  const score = Math.round((w * d + (1 - w) * c) * 100);
  return { letter: score >= 75 ? "A" : score >= 55 ? "B" : score >= 35 ? "C" : "D", score, pp, d: Math.round(d * 100), c: Math.round(c * 100) };
}
function visibleLodging() {
  let list = S.lodging.slice();
  if (S.lmin) list = list.filter(l => { const g = lodgingGrade(l); return l.id === S.selL || (g && GRANK[g.letter] >= GRANK[S.lmin]); });
  const key = l => S.lsort === "cost" ? lodgingCost(l).total
    : S.lsort === "dist" ? ((l.miles === null || l.miles === undefined || l.miles === "") ? Infinity : num(l.miles))
    : (lodgingGrade(l) ? -lodgingGrade(l).score : Infinity);
  return list.sort((a, b) => key(a) - key(b));
}
function scheduleText() {
  const d = S.trip.meetDay;
  if (!d) return "Pick the day your lifters compete (the meet runs Apr 15–18) to see your travel dates.";
  const m = new Date(d + "T12:00:00"); if (isNaN(m)) return "";
  const n = baseNights();
  const f = o => new Date(m.getFullYear(), m.getMonth(), m.getDate() + o).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  let s = `${n} nights: arrive ${f(-(n - 1))} · meet ${f(0)} · drive home ${f(1)}.`;
  if (n > 1) s += ` Red-eye (${n - 1} nights, charter bus or flight only): leave the night of ${f(0)} — check out and clean up after the meet, so ask the host about late check-out.`;
  return s;
}
const goal = () => S.team.goalMode === "trip" ? tripTotal() : num(S.team.goal);
const neededPerMonth = () => goal() / Math.max(1, num(S.team.people)) / Math.max(1, num(S.team.months));
const target = () => num(S.team.target);
function earn(j) {
  return j.group ? num(j.payout) / Math.max(1, num(j.crew)) : num(j.rate) * num(j.hours) + num(j.tips);
}
const inSeason = (j, m) => !j.months || j.months.includes(m);
function monthsList() {
  const [y, m] = (S.team.start || "").split("-").map(Number);
  const base = (y && m) ? new Date(y, m - 1, 1) : new Date();
  return Array.from({ length: Math.max(1, num(S.team.months)) }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    return { cal: d.getMonth() + 1, label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` };
  });
}
function planJobs() { return S.jobs.filter(j => (S.plan[j.id] || 0) > 0); }
function monthEarn(cal) {
  return planJobs().reduce((s, j) => s + (inSeason(j, cal) ? S.plan[j.id] * earn(j) : 0), 0);
}
function plannedTotal() { return monthsList().reduce((s, m) => s + monthEarn(m.cal), 0) * num(S.team.people); }
function statusClass(total, g) { return total <= g ? "ok" : total <= g * 1.15 ? "warn" : "bad"; }

