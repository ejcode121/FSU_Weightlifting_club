
/* ================= live links =================
   A static file can't read live listings, so these are real search URLs rebuilt every time the page opens:
   today's date, your meet day, and your lifter count go into the links, and the picks rotate daily. */
const dayNo = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hostOf = u => u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
const liveLink = (label, url, tag) => `<a class="live-link" href="${url}" target="_blank" rel="noopener"><span>${esc(label)}${tag ? ` <em class="tag in">${tag}</em>` : ""}</span><small>${esc(hostOf(url))}</small></a>`;
const rot = (arr, k) => arr.map((_, i) => arr[(i + k) % arr.length]);
const stamp = () => new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

function renderLiveTrip() {
  const el = document.getElementById("liveTrip"); if (!el) return;
  const n = baseNights(), p = Math.max(1, num(S.team.people));
  const m = S.trip.meetDay ? new Date(S.trip.meetDay + "T12:00:00") : new Date(2027, 3, 15);
  const at = o => new Date(m.getFullYear(), m.getMonth(), m.getDate() + o);
  const a = iso(at(-(n - 1))), c = iso(at(1)), q = encodeURIComponent;
  const air = `https://www.airbnb.com/s/Richmond--VA/homes?checkin=${a}&checkout=${c}&adults=${p}`;
  const stays = rot([
    ["Entire homes", `${air}&room_types%5B%5D=Entire%20home%2Fapt`],
    ["5+ bedrooms", `${air}&min_bedrooms=5`],
    ["All Richmond stays", air]
  ], dayNo() % 3);
  const ride = [
    ["Flights TLH to RIC", `https://www.google.com/travel/flights?q=${q(`Flights from TLH to RIC on ${a} through ${c}`)}`],
    ["15-passenger vans", `https://www.google.com/search?q=${q("15 passenger van rental Tallahassee FL")}`],
    ["Charter bus quotes", `https://www.google.com/search?q=${q("charter bus rental Tallahassee FL to Richmond VA quote")}`],
    ["BusBank", "https://www.busbank.com/"]
  ];
  const info = [
    ["Venue on Maps", "https://www.google.com/maps/search/?api=1&query=Greater+Richmond+Convention+Center"],
    ["Vrbo Richmond", `https://www.vrbo.com/search?destination=${q("Richmond, Virginia")}&startDate=${a}&endDate=${c}&adults=${p}`],
    ["USAW 2027 calendar", "https://www.usaweightlifting.org/news/2026/august/06/out-now-2027-national-competition-calendar-qualifying-totals"]
  ];
  const grp = (h, items, first) => `<h3 class="live-h">${h}</h3><div class="live-grid">${items.map(([l, u], i) => liveLink(l, u, first && i === 0 ? "Today" : "")).join("")}</div>`;
  el.innerHTML = `<div class="sec-head"><h2 class="sec-title">Live links</h2><span class="stamp">${stamp()}</span></div>${grp("Stays", stays, true)}${grp("Transportation", ride)}${grp("More", info)}`;
}

function renderLiveJobs() {
  const el = document.getElementById("liveJobs"); if (!el) return;
  const d = new Date(), weekend = d.getDay() === 0 || d.getDay() >= 5, q = encodeURIComponent;
  const withQ = S.jobs.filter(j => j.query);
  const k = withQ.length ? (dayNo() * 4) % withQ.length : 0;
  const picks = Array.from({ length: Math.min(4, withQ.length) }, (_, i) => withQ[(k + i) % withQ.length]);
  const src = [
    [weekend ? "Events this weekend" : "Events this week", `https://www.eventbrite.com/d/fl--tallahassee/events--this-${weekend ? "weekend" : "week"}/`],
    ["Volunteer openings", "https://www.idealist.org/en/volunteer-in-tallahassee-fl"],
    ["FSU events calendar", "https://calendar.fsu.edu/"],
    ["Seminoles schedule", "https://seminoles.com/calendar/"],
    ["Visit Tallahassee events", "https://www.visittallahassee.com/events/"],
    ["Craigslist gigs, newest", "https://tallahassee.craigslist.org/search/ggg?sort=date"],
    ["Handshake jobs", "https://fsu.joinhandshake.com/stu/postings"],
    ["Instawork Tallahassee", "https://www.instawork.com/category/tallahassee-city"],
    ["Volunteer Leon", "https://leoncountyfl.galaxydigital.com"],
    ["Visit Tallahassee volunteering", "https://visittallahassee.volunteerlocal.com"]
  ];
  const pk = picks.map(j => { const s = q(j.query);
    return `<div class="live-pick"><b>${esc(j.title)}</b><span class="live-pick-links">
      <a href="https://www.indeed.com/jobs?q=${s}&l=Tallahassee%2C+FL&radius=10&fromage=7&sort=date" target="_blank" rel="noopener">Indeed, past 7 days</a>
      <a href="https://fsu.joinhandshake.com/stu/postings?query=${s}" target="_blank" rel="noopener">Handshake</a>
      <a href="https://tallahassee.craigslist.org/search/ggg?query=${s}&sort=date" target="_blank" rel="noopener">Craigslist</a></span></div>`; }).join("");
  el.innerHTML = `<div class="sec-head"><h2 class="sec-title">Live this week</h2><span class="stamp">${stamp()}</span></div>
    ${pk ? `<h3 class="live-h">Today's searches</h3><div class="live-picks">${pk}</div>` : ""}
    <h3 class="live-h">Sources</h3><div class="live-grid">${src.map(([l, u]) => liveLink(l, u)).join("")}</div>`;
}
function renderLive() { renderLiveTrip(); renderLiveJobs(); }
