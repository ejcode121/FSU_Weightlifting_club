"use strict";
const KEY = "fsu-lifting-budget-v2";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CATS = ["Race & Meet Crews","Game Day & Concessions","Festivals & Markets","Team Events","Moving & Labor","Yard & Home","Coaching & Tutoring","On-demand Gigs"];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const usd = (n, d = 0) => (isFinite(n) ? n : 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: d, maximumFractionDigits: d });

/* ---------------- default data ---------------- */
// [title, cat, rate, hours, tips, area, when[], months|null, how-to-find, search query, description]
const SEED_JOBS = [
 // ---- group fundraisers you can run any day (no fixed date) ----
 ["Weekend 5K / 10K race-day crew","Race & Meet Crews",0,4,0,"city",["weekend"],null,"Check local race calendars (Tallahassee Runners Club, RunSignUp) and offer a 5-person setup/marshal crew. Typical group donation is $150–300 per race.","5k race volunteers","5-person crew. Course marking, finish line, water tables."],
 ["Pop-up concession stand at a Saturday event","Game Day & Concessions",0,6,0,"city",["weekend"],null,"Rent a tent and sell drinks and snacks at a tailgate, craft market, or youth tournament. Get the venue's permission and a Florida temporary food permit first.","pop up food vendor tallahassee","Crew of 5. Your own stand: you keep the profit after supplies and fees. Estimate only."],
 ["Semester move-out hauling crew","Moving & Labor",0,5,0,"near",["weekend","weekday"],null,"Post in FSU housing Facebook groups and offer a 5-person load-and-haul crew for finals week and the days after.","student move out help","Crew of 5, about $110 each for a half-day."],
 ["Holiday-lights installation crew","Yard & Home",0,5,0,"city",["weekday","weekend"],null,"Decorating companies hire day crews in Oct–Nov; offer a 5-person crew.","holiday lights installer","Crew of 5. Hanging lights and decorations; ladders and teamwork."],
 ["Restaurant “spirit night”","Team Events",0,3,0,"near",["evening"],null,"Ask a local restaurant to donate 15–20% of sales for one night; promote it on social.","","Whole team. A busy night brings in $300–500."],
 ["Community Olympic-lifting clinic","Team Events",0,2,0,"campus",["weekend"],null,"Host a $20-per-person technique clinic at your gym; invite alumni, local gyms, high-school teams.","","Whole team. 30 attendees × $20 ≈ $600."],
 ["Team car wash","Team Events",0,4,0,"near",["weekend"],null,"Ask a parking-lot owner (bank, auto parts store) for permission.","","Whole team. Roughly $400–600 for a good Saturday."],
 // ---- solo freelance work, any day ----
 ["Referee / official: youth sports (per game)","On-demand Gigs",30,3,0,"city",["weekend","evening"],null,"City of Tallahassee Parks & Recreation and youth leagues hire per-game officials; take the short certification.","youth sports referee tallahassee","Paid per game, no schedule commitment."],
 ["Event setup & teardown (Instawork shift)","On-demand Gigs",17,5,0,"city",["weekday","evening","weekend"],null,"Sign up on Instawork for Tallahassee. Pick single shifts at venues and events.","event setup crew","Single-shift gigs, no commitment."],
 ["Catering / banquet shift (one event)","On-demand Gigs",15,5,40,"city",["evening","weekend"],null,"Local caterers keep an on-call list of students for single events.","catering server banquet","One event at a time. Hourly plus tips."],
 ["Moving help (load & haul)","Moving & Labor",22,4,10,"city",["weekday","weekend"],null,"Local moving companies; Craigslist and Facebook gigs.","moving helper","Paid per job."],
 ["Junk removal / hauling job","Moving & Labor",20,4,0,"city",["weekday","weekend"],null,"Junk-removal franchises and Craigslist/Facebook haul-away requests.","junk removal helper","Lift, load, dump. Per job."],
 ["Leaf & gutter cleanup job","Yard & Home",18,3,0,"city",["weekend"],null,"Neighborhood groups and Nextdoor; flyers in nearby neighborhoods.","gutter leaf cleanup","Per-yard jobs for homeowners."],
 ["Mobile car wash / detailing","Yard & Home",20,3,15,"city",["weekend"],null,"Advertise in apartment complexes and Facebook groups.","car detailing","Your own mini-business."],
 ["Private tutoring session","Coaching & Tutoring",25,2,0,"near",["weekday","evening"],null,"Private-tutor boards, high schools and families; no employer.","tutor math","Pay per session."],
 ["Weightlifting coaching session (private clients)","Coaching & Tutoring",30,1.5,0,"near",["weekday","evening"],null,"Offer technique sessions to local gyms, youth athletes and parents; no employer.","weightlifting coach","Pay per session."],
 ["Pet sitting / dog walking","On-demand Gigs",18,2,0,"near",["weekday","weekend"],null,"Rover or Wag-style apps and apartment bulletin boards.","pet sitter dog walker","Single bookings."],
];
const GROUP = { "Weekend 5K / 10K race-day crew":[250,5], "Pop-up concession stand at a Saturday event":[400,5], "Semester move-out hauling crew":[550,5], "Holiday-lights installation crew":[600,5],
  "Restaurant “spirit night”":[400,16], "Community Olympic-lifting clinic":[600,16], "Team car wash":[500,16] };
// Dated events, checked Oct 11 2026. [title, category, date, time slot, crew, est. team payout, what you do, pay / how to sign up, link]
// Payouts are estimates: none of these organizers publish a group rate, so confirm it in writing.
const VL = "https://visittallahassee.volunteerlocal.com/volunteer/?id=";
const EVTS = [
 ["SWAC Championships: course crew","Race & Meet Crews","2026-10-26","Shift times are posted inside the sign-up",16,800,"Conference cross-country championships at Apalachee Regional Park, 7550 Apalachee Pkwy. Course marshals, setup, results runners.","Sign up through Visit Tallahassee (free account). Ask about a club donation for the full crew.",VL+"114428"],
 ["FSU vs Clemson: concession stand","Game Day & Concessions","2026-10-31","Kickoff TBA. Crews meet at Gate B (earlier games: about 4.5 h before kickoff)",10,900,"Run a concession stand at Doak Campbell Stadium. 17+, black pants and black shoes.","Nonprofit stand lead: Volunteer Leon, 850-766-3106, or the Idealist listing. Ask to bring a full crew and what it pays.","https://www.idealist.org/en/volunteer-opportunity/908f5e680edb44ca806ce4ac2abf669a-volunteers-needed-for-fsu-home-football-games-this-fall-2026-society-for-charity-tallahassee"],
 ["NCAA South Region cross country","Race & Meet Crews","2026-11-13","Morning races. Shift times are posted inside the sign-up",16,1000,"FSU hosts the NCAA Division I South Region championships at Apalachee Regional Park. Marshals, fencing, course crew.","Sign up through Visit Tallahassee (free account). Ask FSU Cross Country about a paid crew.",VL+"114434"],
 ["FHSAA cross country state finals","Race & Meet Crews","2026-11-20","All four classes race this day. Times TBA",16,1000,"State finals at Apalachee Regional Park. Marshals, lap counters, finish chute, results runners.","Contact the timing company (PrimeTime Timing) or Visit Tallahassee Sports to offer the full crew.","https://fhsaa.com/sports/cross-country"],
 ["FSU vs NC State: concession stand","Game Day & Concessions","2026-11-21","Kickoff TBA. Crews meet at Gate B (earlier games: about 4.5 h before kickoff)",10,900,"Homecoming game. Run a concession stand at Doak Campbell Stadium. 17+, black pants and black shoes.","Nonprofit stand lead: Volunteer Leon, 850-766-3106. Ask to bring a full crew and what it pays.","https://leoncountyfl.galaxydigital.com"],
 ["Turkey Trot festival: expo setup","Race & Meet Crews","2026-11-22","1:30–5:00 PM at Goodwood Museum & Gardens",5,300,"Set up and run the packet and festival area the weekend before the race.","Email the race director at tallyturkeytrot.com and offer a 5-person crew.","https://www.tallyturkeytrot.com"],
 ["Turkey Trot: course marshals and water stops","Race & Meet Crews","2026-11-26","8:00 AM–12:00 PM race",16,700,"Marshal the 15K/10K/5K/1-mile courses and staff water stops.","Email the race director at tallyturkeytrot.com and offer the full crew for a donation.","https://www.tallyturkeytrot.com"],
 ["FSU vs Florida: concession stand","Game Day & Concessions","2026-11-27","3:30 PM kickoff. Crews typically meet at Gate B about 11:00 AM",5,500,"Senior Day. Smaller crews are easier to place on a stand. 17+, black pants and black shoes.","Nonprofit stand lead: Volunteer Leon, 850-766-3106.","https://leoncountyfl.galaxydigital.com"],
 ["AAU National Championships: course crew","Race & Meet Crews","2026-12-05","Shift times are posted inside the sign-up",16,1000,"National youth cross-country championships at Apalachee Regional Park.","Sign up through Visit Tallahassee (free account). Ask about a club donation for the full crew.",VL+"117119"],
 ["Winter Festival and Jingle Bell Run: marshals","Festivals & Markets","2026-12-05","3:00–10:00 PM festival. Jingle Bell Run 6:15 PM, parade 7:10 PM",5,300,"City of Tallahassee winter festival. Run course marshals and street crew for the 6:15 PM run and the 7:10 PM parade.","Call City of Tallahassee Parks, Recreation & Neighborhood Affairs and offer a 5-person crew.","https://www.talgov.com/parks/winter_festival"],
 ["Market Days: vendor load-out crew","Festivals & Markets","2026-12-06","Show closes 5:00 PM. Load-out after close",5,300,"Help vendors break down booths and carry loads at the North Florida Fairgrounds.","Ask vendors directly on site or in the Market Days vendor Facebook group; no organizer program found.","https://marketdays.org"],
 ["Tallahassee Marathon: expo and packet pickup","Race & Meet Crews","2027-02-06","12:00–4:00 PM at Turnbull Conference Center (the race site lists this as Saturday Feb 7; Feb 7 is a Sunday)",5,300,"Hand out bibs and shirts, run expo tables, set up and tear down.","The marathon is all-volunteer (Gulf Winds Track Club). Ask the race director about a club donation.","https://www.tallahasseemarathon.com/Race/tlhmarathon/Page/Packet-Pick-up-and-Expo"],
 ["Tallahassee Marathon: aid stations and course crew","Race & Meet Crews","2027-02-07","7:30 AM–1:30 PM. Race-day packet pickup opens 6:00 AM at the courthouse",16,1000,"Staff aid stations and marshal the course. The finish is on Madison Street.","The marathon is all-volunteer (Gulf Winds Track Club). Ask the race director about a club donation for the full crew.","https://www.tallahasseemarathon.com"]
];
const dayLabel = on => { const d = new Date(on + "T12:00:00"); return isNaN(d) ? "" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }); };
const SEED_VER = 4;
const OLD_TITLES = new Set(["Apartment move-out cleaning", "Babysitting / nanny", "Bartender / barback (21+)", "Campus Rec official / lifeguard", "Catering / banquet shift (one event)", "Catering server / banquet", "Community Olympic-lifting clinic", "Event setup & teardown (Instawork shift)", "Event setup & teardown crew", "FHSAA cross-country state finals: course marshals", "FSU home football: concession stand (5-person crew)", "FSU home football: concession stand (NC State)", "Festival & market vendor help", "Food / grocery delivery", "Holiday-lights installation", "Holiday-lights installation crew", "Junk removal / hauling", "Junk removal / hauling job", "Leaf & gutter cleanup", "Leaf & gutter cleanup job", "Mobile car wash / detailing", "Moving help (load & haul)", "NCAA South Regional cross country: course crew", "Paid research studies", "Personal training (cert. required)", "Pet sitting / dog walking", "Pop-up concession stand at a Saturday event", "Private tutoring session", "Referee / official: youth sports (per game)", "Restaurant host / busser", "Restaurant “spirit night”", "Seasonal retail & gift wrap", "Semester move-out hauling crew", "Stadium / arena event staff", "Stadium concession stand (org payout)", "Summer orientation staff", "Tallahassee Marathon: aid stations & course crew", "Tallahassee Marathon: expo & packet pickup crew", "Team car wash", "Turkey Trot: course marshals & water stops", "Tutoring (math, SAT/ACT, chem)", "Warehouse / package sorting", "Weekend 5K / 10K race-day crew", "Weightlifting coaching session (private clients)", "Yard work & landscaping", "Yard work & landscaping job", "Youth strength / sports coach"]);

function seedJobs() {
  const dated = EVTS.map(e => ({ id: uid(), title: e[0], cat: e[1], on: e[2], time: e[3], group: true, crew: e[4], payout: e[5], desc: e[6], how: e[7], url: e[8],
    rate: 0, hours: 0, tips: 0, area: "city", when: [], months: null, query: "" }));
  const any = SEED_JOBS.map(j => {
    const g = GROUP[j[0]];
    return { id: uid(), title: j[0], cat: j[1], rate: j[2], hours: j[3], tips: j[4], group: !!g, payout: g ? g[0] : 0, crew: g ? g[1] : 1,
      area: j[5], when: j[6], months: j[7], how: j[8], query: j[9], desc: j[10], on: "", time: "", url: "" };
  });
  return dated.concat(any);
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
    jobs: seedJobs(), jobsV: SEED_VER, plan: {}
  };
}
// fill in anything a saved/imported file from an older version doesn't have
function normalize(s) {
  s.trip = Object.assign({}, DEF_TRIP, s.trip);
  s.grade = Object.assign({}, DEF_GRADE, s.grade);
  s.lsort = s.lsort || "grade"; s.lmin = s.lmin || ""; s.selRed = !!s.selRed;
  s.lodging.forEach(l => { if (l.miles === undefined) l.miles = null; if (l.mins === undefined) l.mins = null; });
  if (s.lodging.length && s.lodging.every(l => /^Sample/.test(l.name) && !l.src)) { s.lodging = researchedLodging(); s.selL = s.lodging[0].id; } // swap the old sample stays for the researched ones
  if (s.jobsV !== SEED_VER) { // swap the old job lists for the dated calendar; keep jobs the user added
    const custom = s.jobs.filter(j => !OLD_TITLES.has(j.title)).map(j => ({ on: "", time: "", url: "", ...j, cat: CATS.includes(j.cat) ? j.cat : "On-demand Gigs" }));
    s.jobs = seedJobs().concat(custom); s.plan = {}; s.jobsV = SEED_VER;
  }
  s.jobs.forEach(j => { if (j.on === undefined) j.on = ""; if (j.time === undefined) j.time = ""; if (j.url === undefined) j.url = ""; });
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
const perLifter = () => goal() / Math.max(1, num(S.team.people));
function earn(j) {
  return j.group ? num(j.payout) / Math.max(1, num(j.crew)) : num(j.rate) * num(j.hours) + num(j.tips);
}
function planJobs() { return S.jobs.filter(j => S.plan[j.id]).sort((a, b) => (a.on || "9999").localeCompare(b.on || "9999")); }
function plannedTotal() { return planJobs().reduce((t, j) => t + (j.group ? num(j.payout) : earn(j) * num(S.team.people)), 0); }
function statusClass(total, g) { return total <= g ? "ok" : total <= g * 1.15 ? "warn" : "bad"; }

