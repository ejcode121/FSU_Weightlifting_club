
/* ================= UI ================= */
const ico = (id, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const usdK = n => Math.abs(n) >= 1000 ? `$${+(n / 1000).toFixed(Math.abs(n) >= 10000 ? 1 : 2)}K` : usd(n, n % 1 ? 2 : 0);
const CAT_ICO = { "Events & Game Day": "ticket", "Moving & Labor": "box", "Food & Hospitality": "fork", "Yard & Home": "home",
  "Tutoring & Coaching": "book", "Campus & Research": "flask", "Delivery & Gigs": "bag", "Team Fundraisers": "people" };
const T_ICO = { van: "van", bus: "bus", flight: "plane", cars: "cars", perperson: "ticket" };
const EARLY = { fee: 145, date: new Date(2027, 2, 4) };
const openCards = new Set();
let toastTimer;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("on"), 2800);
}
// re-render something without losing keyboard focus
function keepFocus(fn) {
  const a = document.activeElement; let sel = null;
  if (a && a !== document.body) {
    if (a.classList.contains("cell") || a.classList.contains("pick")) sel = `.${a.classList.contains("cell") ? "cell" : "pick"}[data-l="${a.dataset.l}"][data-t="${a.dataset.t}"][data-r="${a.dataset.r}"]`;
    else {
      const c = a.closest("[data-id]"), attr = ["data-step", "data-k", "data-pick", "data-del", "data-edit"].find(x => a.hasAttribute(x));
      if (c && attr) sel = `[data-id="${c.dataset.id}"] [${attr}="${a.getAttribute(attr)}"]`;
      else if (a.id) sel = "#" + a.id;
    }
  }
  fn();
  if (sel) { const n = document.querySelector(sel); if (n) n.focus({ preventScroll: true }); }
}

/* ---------------- the bar ---------------- */
const PLATES = [
  { kg: 25, w: 34, h: 270, c: "var(--p-red)", t: "#fff" },
  { kg: 20, w: 30, h: 270, c: "var(--p-blue)", t: "#fff" },
  { kg: 15, w: 26, h: 270, c: "var(--p-yellow)", t: "#2A2108" },
  { kg: 10, w: 22, h: 270, c: "var(--p-green)", t: "#fff" },
  { kg: 5, w: 18, h: 190, c: "var(--p-white)", t: "#1B1E23" },
  { kg: 2.5, w: 14, h: 150, c: "var(--p-red)", t: "#fff" },
  { kg: 2, w: 12, h: 130, c: "var(--p-blue)", t: "#fff" },
  { kg: 1.5, w: 10, h: 118, c: "var(--p-yellow)", t: "#2A2108" },
  { kg: 1, w: 9, h: 106, c: "var(--p-green)", t: "#fff" },
  { kg: .5, w: 8, h: 94, c: "var(--p-white)", t: "#1B1E23" }
];
const UNITS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000];
function decompose(units) {
  let h = Math.max(0, Math.round(units * 2)); const out = [];
  for (const p of PLATES) { const n = Math.floor(h / (p.kg * 2)); for (let i = 0; i < n; i++) out.push(p); h -= n * p.kg * 2; }
  return out;
}
const plateW = list => list.reduce((s, p) => s + p.w + 3, 0);
function pickUnit(goal) {
  if (goal <= 0) return 1;
  for (const u of UNITS) if (plateW(decompose(goal / u)) <= 360) return u;
  return UNITS[UNITS.length - 1];
}
let heroPrev = [], heroFirst = true;
function barSVG(raised, g) {
  const u = pickUnit(g), goalU = g / u;
  const loadU = Math.min(raised / u, Math.max(goalU, 1) * 1.6);
  const loaded = decompose(loadU), ghost = raised < g ? decompose(goalU - loadU) : [];
  const cy = 150, x0 = 324; let x = x0, out = "";
  const draw = (p, i, isGhost) => {
    const y = cy - p.h / 2, big = p.w >= 20 && !isGhost;
    const anim = heroFirst || (!isGhost && heroPrev[i] !== p.kg) || isGhost;
    const label = big ? `<text transform="translate(${x + p.w / 2},${cy}) rotate(-90)" text-anchor="middle" dominant-baseline="central" style="fill:${p.t}">${usdK(p.kg * u)}</text>` : "";
    const g1 = `<g class="plate ${p.kg === 5 || p.kg === .5 ? "white" : ""} ${isGhost ? "ghost" : ""} ${anim ? "in" : ""}" style="--d:${Math.min(i, 14) * 55}ms;--dir:${isGhost ? 0 : 1}">
      <rect class="body" x="${x}" y="${y}" width="${p.w}" height="${p.h}" rx="4" style="fill:${p.c}"/>${isGhost ? "" : `<rect class="shine" x="${x + 3}" y="${y + 8}" width="${Math.max(2, p.w * .22)}" height="${p.h - 16}" rx="2"/>`}${label}</g>`;
    x += p.w + 3; return g1;
  };
  loaded.forEach((p, i) => { out += draw(p, i, false); });
  ghost.forEach((p, i) => { out += draw(p, loaded.length + i, true); });
  heroPrev = loaded.map(p => p.kg);
  const collar2 = `<rect class="collar" x="${Math.min(x + 4, 960)}" y="124" width="12" height="52" rx="3"/>`;
  const used = [...new Map([...loaded, ...ghost].map(p => [p.kg, p])).values()];
  const svg = `<svg viewBox="0 0 1000 300" role="img" aria-label="A barbell loaded to ${raised >= g ? "past" : `${Math.round(g ? raised / g * 100 : 0)}% of`} the ${usd(g)} goal. Each plate stands for money raised.">
    <line class="floor" x1="0" x2="1000" y1="292" y2="292"/>
    <rect class="shaft" x="0" y="142" width="324" height="16" rx="3"/><rect class="knurl" x="40" y="142" width="200" height="16"/>
    <rect class="collar" x="300" y="120" width="14" height="60" rx="3"/>
    <rect class="sleeve" x="314" y="134" width="686" height="32" rx="2"/>${out}${collar2}</svg>`;
  return { svg, used, u };
}
function heroHTML(mode) {
  const g = goal(), raised = plannedTotal(), gap = raised - g, nd = neededPerMonth(), p = num(S.team.people), mo = Math.max(1, num(S.team.months));
  const b = barSVG(raised, g);
  const title = mode === "trip" ? "Load the bar for Richmond" : "Here's what your shifts load";
  const sub = mode === "trip"
    ? `${p} lifters raising ${usd(g)} before the Apr 15 to 18 meet. That's ${usd(nd, 2)} each, every month for ${mo} months.`
    : raised === 0 ? `Add shifts and watch the bar fill. Each lifter needs about ${usd(nd, 2)} a month.`
    : gap >= 0 ? `This plan raises ${usd(raised)}, ${usd(gap)} past the goal.` : `${usd(-gap)} short. A shift or two more each month would close it.`;
  const cls = raised === 0 ? "" : gap >= 0 ? "ok" : "warn";
  const key = b.used.map(pl => `<span class="k"><i style="background:${pl.c}"></i>${usdK(pl.kg * b.u)}</span>`).join("");
  return `<h1 class="hero-title">${title}</h1>${mode === "trip" ? "" : ""}<p class="hero-sub">${sub}</p>
    <div class="bar-fig">${b.svg}</div>
    <dl class="readout">
      <div><dt><i></i>Loaded</dt><dd>${usd(raised)}</dd></div>
      <div><dt><i class="ghost"></i>Goal</dt><dd>${usd(g)}</dd></div>
      <div><dt><i class="${gap >= 0 && raised ? "ok" : "gap"}"></i>${gap >= 0 && raised ? "Cushion" : "Still to load"}</dt><dd class="${cls}">${usd(Math.abs(raised ? gap : g))}</dd></div>
    </dl>
    <div class="plate-key" aria-label="Plate values"><span>Each plate:</span>${key}</div>
    ${raised === 0 ? `<div class="hero-cta"><button class="btn pri" type="button" data-act="suggest">${ico("spark")}Suggest a plan</button><button class="btn" type="button" data-act="goto-jobs">${ico("search")}Find shifts</button><p>No shifts in the plan yet, so the bar is empty. The dashed plates are what's left to load.</p></div>` : ""}`;
}
function renderHeroes() {
  const g = goal(), raised = plannedTotal(), gap = raised - g;
  const first = heroFirst;
  $("#heroTrip").innerHTML = heroHTML("trip");
  heroFirst = false; // second hero renders without the full entrance
  $("#heroPlan").innerHTML = heroHTML("plan");
  const st = raised >= g && g > 0 ? ["ok", "On track"] : raised === 0 ? ["warn", "No shifts yet"] : ["bad", `Short ${usd(-gap)}`];
  $("#mini").innerHTML = `<b>${usd(raised)}</b><span class="of">of ${usd(g)}</span><span class="st ${st[0]}">${st[1]}</span>`;
  $("#loadFill").style.width = Math.min(100, g ? raised / g * 100 : 0) + "%";
  void first;
}
function renderSetupFacts() {
  const p = num(S.team.people), mo = num(S.team.months);
  $("#setupFacts").innerHTML = [[p, "lifters"], [mo, "months to raise"], [usd(goal()), S.team.goalMode === "trip" ? "goal, from the trip" : "goal"], [usd(neededPerMonth(), 2), "each, every month"]]
    .map(([a, b]) => `<div class="sf"><b>${a}</b><span>${b}</span></div>`).join("");
}

/* ---------------- trip tab ---------------- */
function bindStatic() {
  $$("[data-team]").forEach(el => { el.value = S.team[el.dataset.team]; });
  $$("[data-trip]").forEach(el => { el.value = S.trip[el.dataset.trip]; });
  $$("[data-gset]").forEach(el => { el.value = S.grade[el.dataset.gset]; });
  $$("[data-gm]").forEach(el => { el.checked = el.value === S.team.goalMode; });
  $('[data-team="goal"]').disabled = S.team.goalMode === "trip";
}
function renderTimeline() {
  const n = baseNights(), d = S.trip.meetDay, m = d ? new Date(d + "T12:00:00") : null, ok = m && !isNaN(m);
  const f = o => ok ? new Date(m.getFullYear(), m.getMonth(), m.getDate() + o).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : null;
  let h = "";
  for (let o = -(n - 1); o <= 0; o++) {
    const first = o === -(n - 1), meet = o === 0;
    const b = meet && first ? "Arrive and compete" : meet ? "Compete" : first ? "Arrive" : o === -1 ? "Rest day" : "Settle in";
    h += `<li class="${meet ? "meet" : ""}"><b>${b}</b><span>${f(o) || (meet ? "Meet day" : o === -1 ? "Day before" : `${-o} days before`)}</span></li>`;
  }
  h += `<li class="last"><b>Head home</b><span>${f(1) || "After the meet"}</span><span>${hasRed({ redeye: true }) ? "Next morning by van, or a red-eye that night by bus or flight" : "Next morning"}</span></li>`;
  $("#timeline").innerHTML = h;
  $("#timeline").style.gridAutoColumns = `minmax(0,1fr)`;
}
const stayRing = g => {
  const C = 2 * Math.PI * 24;
  return `<svg viewBox="0 0 58 58" aria-hidden="true"><circle class="trk" cx="29" cy="29" r="24"/><circle class="val" cx="29" cy="29" r="24" stroke-dasharray="${g ? (g.score / 100 * C).toFixed(1) : 0} ${C.toFixed(1)}"/></svg><b>${g ? g.letter : "?"}</b>`;
};
function stayView(l) {
  const c = lodgingCost(l), n = baseNights(), people = Math.max(1, num(S.team.people)), g = lodgingGrade(l);
  const has = !(l.miles === null || l.miles === undefined || l.miles === "");
  return `<div class="stay-cost"><b class="disp">${usd(c.total)}</b><span>for ${n} nights, ${usd(c.total / people)} per person</span></div>
    <div class="stay-chips"><span class="chip">${ico("bed")}${c.label} for ${people}</span>
      <span class="chip">${ico("pin")}${has ? `${num(l.miles)} mi to the venue` : "Add the distance to grade it"}</span>${l.mins ? `<span class="chip">${num(l.mins)} min drive</span>` : ""}</div>
    <p class="hint">${g ? `Grade ${g.letter}, score ${g.score} of 100. Distance ${g.d}, price ${g.c} (${usd(g.pp)} per person per night).` : "Enter the miles to the venue and this stay gets a grade."}</p>`;
}
function updateLodging() {
  S.lodging.forEach(l => {
    const card = $(`.stay[data-id="${l.id}"]`); if (!card) return;
    const g = lodgingGrade(l);
    card.classList.remove("gA", "gB", "gC", "gD", "gx"); card.classList.add(g ? "g" + g.letter : "gx");
    $("[data-ring]", card).innerHTML = stayRing(g);
    $("[data-view]", card).innerHTML = stayView(l);
  });
}
function numField(k, label, v, opt) {
  return `<label class="field">${label}<input type="number" inputmode="decimal" min="0" step="any" data-k="${k}" ${opt ? "data-opt" : ""} value="${v === null || v === undefined ? "" : esc(v)}"></label>`;
}
function renderLodging() {
  $("#lSort").value = S.lsort; $("#lMin").value = S.lmin;
  const list = visibleLodging();
  $("#lodgingList").innerHTML = list.map(l => `
    <article class="stay gx ${l.id === S.selL ? "sel" : ""}" data-id="${l.id}">
      <div class="stay-head">
        <span class="ring" data-ring></span>
        <input class="name" type="text" data-k="name" value="${esc(l.name)}" aria-label="Airbnb name">
        <button class="icon-btn" type="button" data-del aria-label="Delete ${esc(l.name)}">${ico("x")}</button>
      </div>
      <div data-view style="display:grid;gap:12px"></div>
      <div class="stay-foot">
        <label class="use"><input class="sr" type="radio" name="selL" data-pick ${l.id === S.selL ? "checked" : ""}><span class="pill">${ico("check")}Use this stay</span></label>
      </div>
      <details class="dis" data-open="${l.id}" ${openCards.has(l.id) ? "open" : ""}>
        <summary>Prices and details${ico("chev")}</summary>
        <div class="dis-body"><div class="grid">
          ${numField("nightly", "Nightly rate ($)", l.nightly)}${numField("cleaning", "Cleaning fee ($)", l.cleaning)}
          ${numField("service", "Service fee ($)", l.service)}${numField("tax", "Taxes (%)", l.tax)}
          ${numField("sleeps", "Sleeps (people)", l.sleeps)}${numField("miles", "Miles to venue", l.miles, 1)}${numField("mins", "Drive minutes", l.mins, 1)}
          <label class="field">Listing link<input type="url" data-k="url" value="${esc(l.url)}" placeholder="https://airbnb.com/rooms/…"></label>
        </div></div>
      </details>
    </article>`).join("") || `<div class="empty"><b>No Airbnbs to show</b>Add a listing or loosen the grade filter.</div>`;
  updateLodging();
}
function rideView(t) {
  const people = Math.max(1, num(S.team.people));
  return variants(t).map(v => { const c = transportCost(t, v.n);
    return `<div class="ride-line"><span class="lab">${ico(v.red ? "moon" : "bed")}${v.red ? `Red-eye home, ${v.n} nights` : `Stay over, ${v.n} nights`}</span><b class="disp">${usd(c.total)}</b><small>${c.label}, ${usd(c.total / people)} per person</small></div>`; }).join("");
}
function updateTransport() {
  S.transport.forEach(t => { const el = $(`.ride[data-id="${t.id}"] [data-view]`); if (el) el.innerHTML = rideView(t); });
}
function renderTransport() {
  $("#transList").innerHTML = S.transport.map(t => {
    const types = TYPES.includes(t.type) ? TYPES : [...TYPES, t.type];
    return `<article class="ride ${t.id === S.selT ? "sel" : ""}" data-id="${t.id}">
      <div class="ride-top">
        <span class="ride-ico">${ico(T_ICO[t.type] || "ticket")}</span>
        <div style="min-width:0"><input class="name" type="text" data-k="name" value="${esc(t.name)}" aria-label="Transportation name">
          <select class="type" data-k="type" aria-label="Type">${types.map(k => `<option value="${k}" ${k === t.type ? "selected" : ""}>${TNAMES[k]}</option>`).join("")}</select></div>
        <button class="icon-btn" type="button" data-del aria-label="Delete ${esc(t.name)}">${ico("x")}</button>
      </div>
      <div class="ride-cost" data-view></div>
      <label class="switch-row"><input type="checkbox" class="switch" data-k="redeye" ${t.redeye ? "checked" : ""}><span>Allow a red-eye home<small>Leave the night of the meet, one fewer night</small></span></label>
      <div style="padding:0 16px 14px"><label class="use"><input class="sr" type="radio" name="selT" data-pick ${t.id === S.selT ? "checked" : ""}><span class="pill">${ico("check")}Use this ride</span></label></div>
      <details class="dis" data-open="${t.id}" ${openCards.has(t.id) ? "open" : ""}>
        <summary>Prices and details${ico("chev")}</summary>
        <div class="dis-body"><div class="grid">${TFIELDS[t.type].map(([k, lab]) => numField(k, lab, t[k])).join("")}</div>
          ${THINTS[t.type] ? `<p class="hint">${esc(THINTS[t.type])}</p>` : ""}</div>
      </details>
    </article>`;
  }).join("") || `<div class="empty"><b>No transportation yet</b>Add a van, a bus, or flights.</div>`;
  updateTransport();
}
function updateLines() {
  const n = baseNights();
  $("#schedLine").textContent = scheduleText();
  $("#extrasLine").textContent = `Per-person extras (entry fee and food for ${daysFor(n)} days) plus other team costs come to ${usd(extras(n))} at ${n} nights. A red-eye version drops one night of lodging and food.`;
}
function allCombos() {
  const out = [];
  S.lodging.forEach(l => S.transport.forEach(t => variants(t).forEach(v => out.push({ l, t, n: v.n, red: v.red, c: comboCost(l, t, v.n), g: lodgingGrade(l) }))));
  return out;
}
function renderPicks() {
  const all = allCombos(), people = Math.max(1, num(S.team.people));
  if (!all.length) { $("#picks").innerHTML = ""; return; }
  const picks = [];
  const cheapest = all.reduce((a, b) => b.c < a.c ? b : a);
  picks.push(["Lowest cost", cheapest]);
  const graded = all.filter(x => x.g);
  if (graded.length) picks.push(["Best-graded stay", graded.reduce((a, b) => (b.g.score > a.g.score || (b.g.score === a.g.score && b.c < a.c)) ? b : a)]);
  let bestSave = null;
  all.filter(x => x.red).forEach(x => { const s = comboCost(x.l, x.t, baseNights()) - x.c; if (!bestSave || s > bestSave.s) bestSave = { s, x }; });
  if (bestSave && bestSave.s > 0) picks.push([`Red-eye saves ${usd(bestSave.s)}`, bestSave.x]);
  $("#picks").innerHTML = picks.map(([why, x]) => `<button class="pick" type="button" data-l="${x.l.id}" data-t="${x.t.id}" data-r="${x.red ? 1 : 0}">
    <span class="why">${esc(why)}</span><b>${esc(x.l.name)} + ${esc(x.t.name)}</b>
    <span class="pr"><strong>${usd(x.c)}</strong><span>${usd(x.c / people)} per person</span></span>
    <small>${x.n} nights${x.red ? ", red-eye home" : ""}</small></button>`).join("");
}
function renderMatrix() {
  const L = visibleLodging();
  if (!L.length || !S.transport.length) { $("#matrix").innerHTML = `<div class="empty"><b>Nothing to compare yet</b>Add at least one Airbnb and one way to get there.</div>`; return; }
  const g = goal(), people = Math.max(1, num(S.team.people));
  const cols = S.transport.flatMap(variants);
  let best = Infinity; L.forEach(l => cols.forEach(v => { best = Math.min(best, comboCost(l, v.t, v.n)); }));
  const head = `<tr><th></th>${cols.map(v => `<th scope="col"><span class="tt">${ico(T_ICO[v.t.type] || "ticket")}${esc(v.t.name)}</span><span class="nt">${ico(v.red ? "moon" : "bed")}${v.n} nights${v.red ? ", red-eye" : ""}</span></th>`).join("")}</tr>`;
  const rows = L.map(l => {
    const gr = lodgingGrade(l);
    return `<tr><th scope="row"><span class="rl"><span class="gchip ${gr ? "g" + gr.letter : "gx"}">${gr ? gr.letter : "?"}</span><span>${esc(l.name)}<small>${l.miles === null || l.miles === undefined || l.miles === "" ? "No distance yet" : num(l.miles) + " mi to venue"}</small></span></span></th>${cols.map(v => {
      const c = comboCost(l, v.t, v.n), sel = l.id === S.selL && v.t.id === S.selT && v.red === selRed(), d = g - c;
      return `<td><button type="button" class="cell ${statusClass(c, g)} ${sel ? "sel" : ""}" data-l="${l.id}" data-t="${v.t.id}" data-r="${v.red ? 1 : 0}" aria-pressed="${sel}">
        <span class="ct">${usd(c)}</span><span class="pp">${usd(c / people)} per person</span>
        <span class="dl">${d >= 0 ? `${usd(d)} under goal` : `${usd(-d)} over goal`}</span>
        <span class="tags">${c === best ? `<span class="tag">Lowest</span>` : ""}${sel ? `<span class="tag in">Using</span>` : ""}</span></button></td>`;
    }).join("")}</tr>`;
  }).join("");
  $("#matrix").innerHTML = `<table class="mx"><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

/* ---------------- jobs tab ---------------- */
const F = { q: "", cat: "", area: "", when: "", month: "", sort: "earn", few: false };
const hourly = j => earn(j) / Math.max(.5, num(j.hours));
function renderCatChips() {
  $("#catChips").innerHTML = ["All", ...CATS].map(c => `<button class="cat" type="button" aria-pressed="${(c === "All" ? "" : c) === F.cat}" data-cat="${c === "All" ? "" : esc(c)}">${ico(CAT_ICO[c] || "plan")}${esc(c)}</button>`).join("");
}
function renderMonthSelect() {
  $("#fMonth").innerHTML = `<option value="">Any month</option>` + monthsList().map(m => `<option value="${m.cal}" ${String(m.cal) === F.month ? "selected" : ""}>${m.label}</option>`).join("");
}
function jobMatches(j) {
  if (F.cat && j.cat !== F.cat) return false;
  if (F.area && j.area !== F.area && !(F.area === "near" && j.area === "campus") && !(F.area === "city")) return false;
  if (F.when && !j.when.includes(F.when)) return false;
  if (F.month && !inSeason(j, +F.month)) return false;
  if (F.few && !(earn(j) > 0 && Math.ceil(target() / earn(j)) <= 2)) return false;
  if (F.q) {
    const hay = `${j.title} ${j.cat} ${j.desc} ${j.how} ${j.when.join(" ")} ${j.area === "campus" ? "campus on-campus fsu" : j.area}`.toLowerCase();
    if (!F.q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w))) return false;
  }
  return true;
}
const AREA = { campus: "On campus", near: "Within ~3 mi", city: "Around Tallahassee" };
const WHEN = { weekday: "Weekdays", evening: "Evenings", weekend: "Weekends" };
const seasonText = j => (!j.months || j.months.length === 12) ? "Year-round" : j.months.map(m => MONTHS[m - 1]).join(", ");
const enc = encodeURIComponent;
function searchLinks(j) {
  if (!j.query) return "";
  const q = enc(j.query);
  return `<a href="https://www.indeed.com/jobs?q=${q}&l=Tallahassee%2C+FL&radius=10" target="_blank" rel="noopener">Indeed</a>
    <a href="https://fsu.joinhandshake.com/stu/postings?query=${q}" target="_blank" rel="noopener">Handshake</a>
    <a href="https://tallahassee.craigslist.org/search/ggg?query=${q}" target="_blank" rel="noopener">Craigslist gigs</a>`;
}
const stepper = n => `<div class="stepper"><button type="button" data-step="-1" aria-label="Fewer shifts">${ico("minus")}</button><output><b>${n}</b><small>a month</small></output><button type="button" data-step="1" aria-label="More shifts">${ico("plus")}</button></div>`;
function renderJobs() {
  const list = S.jobs.filter(jobMatches).sort((a, b) =>
    F.sort === "hourly" ? hourly(b) - hourly(a) : F.sort === "short" ? num(a.hours) - num(b.hours) : earn(b) - earn(a));
  $("#resCount").textContent = `${list.length} of ${S.jobs.length} jobs shown. Monthly target: ${usd(target())} per lifter.`;
  if (!list.length) { $("#jobList").innerHTML = `<div class="empty"><b>No jobs match</b>Clear a filter, or add your own job.<br><button class="btn" type="button" id="clearF">Clear filters</button></div>`; return; }
  $("#jobList").innerHTML = list.map(j => {
    const e = earn(j), n = S.plan[j.id] || 0, need = e > 0 ? Math.ceil(target() / e) : 0, pips = Math.min(need, 8);
    return `<article class="job ${n ? "inplan" : ""}" data-id="${j.id}">
      <div class="job-top"><span class="cat-ico">${ico(CAT_ICO[j.cat] || "plan")}</span>
        <div><h3>${esc(j.title)}</h3><div class="cn">${esc(j.cat)}</div></div>
        <div class="job-pay"><b>${usd(e)}</b><small>per shift</small></div></div>
      <p class="desc">${esc(j.desc)}</p>
      <p class="brk">${j.group ? `${usd(j.payout)} split among ${j.crew} people` : `${usd(j.rate)} an hour for ${j.hours} hours${j.tips ? `, plus about ${usd(j.tips)} in tips` : ""}`}</p>
      <div class="facts">${j.group ? `<span class="tag">Team effort</span>` : ""}${n ? `<span class="tag in">In your plan</span>` : ""}
        <span class="chip">${ico("pin")}${AREA[j.area]}</span>${j.when.map(w => `<span class="chip">${WHEN[w]}</span>`).join("")}<span class="chip">${seasonText(j)}</span></div>
      <p class="where"><b>Where to look:</b> ${esc(j.how)}</p>
      <div class="links">${searchLinks(j)}<button type="button" class="btn ghost sm" data-edit style="min-height:32px;padding:2px 0">${ico("edit")}Edit</button></div>
      <div class="job-foot">
        <div class="need"><div class="pips" aria-hidden="true">${Array.from({ length: pips }, (_, i) => `<i class="pip ${i < n ? "on" : ""}"></i>`).join("")}</div>
          <span>${need ? `${need} shift${need > 1 ? "s" : ""} a month reach${need > 1 ? "" : "es"} ${usd(target())}` : "No pay set"}</span></div>
        ${stepper(n)}
      </div></article>`;
  }).join("");
}

/* ---------------- plan tab ---------------- */
function renderPlanList() {
  const pj = planJobs();
  $("#planList").innerHTML = pj.length ? pj.map(j => `
    <div class="shift-row" data-id="${j.id}">
      <div><b>${esc(j.title)}</b><small>${usd(earn(j))} per shift, ${seasonText(j).toLowerCase()}</small></div>
      <div class="sub">${usd(S.plan[j.id] * earn(j))}</div>
      <div style="grid-column:1/-1">${stepper(S.plan[j.id])}</div>
    </div>`).join("")
    : `<div class="empty"><b>No shifts in the plan</b>Pick shifts yourself or let the planner suggest a mix.<br><button class="btn pri" type="button" data-act="suggest">${ico("spark")}Suggest a plan</button> <button class="btn" type="button" data-act="goto-jobs">${ico("search")}Find shifts</button></div>`;
}
function startDate() {
  const [y, m] = (S.team.start || "").split("-").map(Number);
  const b = (y && m) ? new Date(y, m - 1, 1) : new Date();
  return new Date(b.getFullYear(), b.getMonth(), 1);
}
function renderCum() {
  const ms = monthsList(), p = num(S.team.people), g = goal(), N = ms.length;
  const t0 = startDate(), t1 = new Date(t0.getFullYear(), t0.getMonth() + N, 1);
  const te = ms.map(m => monthEarn(m.cal) * p);
  const cumAt = d => { let s = 0; for (let i = 0; i < N; i++) { const a = new Date(t0.getFullYear(), t0.getMonth() + i, 1), b = new Date(t0.getFullYear(), t0.getMonth() + i + 1, 1);
    if (d >= b) s += te[i]; else if (d > a) s += te[i] * (d - a) / (b - a); } return s; };
  const total = cumAt(t1), top = Math.max(g, total) * 1.1 || 1;
  const step = [100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000].find(s => top / s <= 5) || 50000;
  const ymax = Math.ceil(top / step) * step;
  const W = 640, H = 300, L = 54, R = 14, T = 24, B = 34, pw = W - L - R, ph = H - T - B;
  const X = d => L + (d - t0) / (t1 - t0) * pw, Y = v => T + ph - v / ymax * ph;
  let grid = "", i = 0;
  for (let v = 0; v <= ymax; v += step) { grid += `<line class="grid-l" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${usdK(v)}</text>`; i++; }
  const pts = [[t0, 0], ...ms.map((m, k) => [new Date(t0.getFullYear(), t0.getMonth() + k + 1, 1), cumAt(new Date(t0.getFullYear(), t0.getMonth() + k + 1, 1))])];
  const path = pts.map(([d, v], k) => `${k ? "L" : "M"}${X(d).toFixed(1)} ${Y(v).toFixed(1)}`).join("");
  const area = `${path}L${X(t1).toFixed(1)} ${Y(0)}L${L} ${Y(0)}Z`;
  const xl = ms.map((m, k) => { const a = new Date(t0.getFullYear(), t0.getMonth() + k, 1), b = new Date(t0.getFullYear(), t0.getMonth() + k + 1, 1);
    return `<text x="${((X(a) + X(b)) / 2).toFixed(1)}" y="${H - 12}" text-anchor="middle">${m.label.slice(0, 3)}</text>`; }).join("");
  const meetD = S.trip.meetDay ? new Date(S.trip.meetDay + "T12:00:00") : new Date(2027, 3, 15);
  const mark = (d, label, dy) => (d > t0 && d < t1) ? `<line class="mk" x1="${X(d)}" x2="${X(d)}" y1="${T}" y2="${T + ph}"/><text x="${X(d) - 5}" y="${T + 12 + dy}" text-anchor="end" class="lbl-strong">${label}</text>` : "";
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Team total raised over time, ending at ${usd(total)} against a ${usd(g)} goal">
    ${grid}<line class="axis" x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}"/>
    <line class="goal-l" x1="${L}" x2="${W - R}" y1="${Y(g)}" y2="${Y(g)}"/><text x="${L + 6}" y="${Y(g) - 7}" class="lbl-strong">Goal ${usd(g)}</text>
    <path class="area" d="${area}"/><path class="line" d="${path}"/>${mark(EARLY.date, "Early-bird entry closes", 14)}${mark(meetD, "Meet", 0)}${xl}</svg>`;
  const notes = [];
  if (EARLY.date > t0 && EARLY.date < t1) {
    const by = cumAt(EARLY.date), cost = p * EARLY.fee, okE = by >= cost;
    notes.push(`<li><i class="${okE ? "ok" : "bad"}"></i><span>By Mar 4 this plan has raised ${usd(by)}. Early-bird entries for ${p} lifters cost ${usd(cost)} and save ${usd(p * 30)} over the regular fee.</span></li>`);
  }
  const hit = pts.findIndex(([, v]) => g > 0 && v >= g);
  notes.push(total === 0 ? `<li><i></i><span>Add shifts to see when the plan reaches the goal.</span></li>`
    : hit > 0 ? `<li><i class="ok"></i><span>The plan reaches the goal by the end of ${ms[hit - 1].label}.</span></li>`
    : `<li><i class="bad"></i><span>The plan doesn't reach the goal in this window.</span></li>`);
  $("#cumChart").innerHTML = svg + `<ul class="notes">${notes.join("")}</ul>`;
}
function renderMonthChart() {
  const ms = monthsList(), t = target(), W = 640, H = 260, L = 12, R = 12, T = 30, B = 30, ph = H - T - B;
  const vals = ms.map(m => monthEarn(m.cal)), max = Math.max(t * 1.35, ...vals, 1);
  const bw = (W - L - R) / ms.length, Y = v => T + ph - v / max * ph;
  const cols = ms.map((m, i) => { const v = vals[i], x = L + i * bw + bw * .16, w = bw * .68, h = Math.max(v ? 2 : 0, v / max * ph);
    return `<rect class="col ${v >= t ? "" : "low"}" x="${x}" y="${T + ph - h}" width="${w}" height="${h}" rx="4"/>
      <text x="${x + w / 2}" y="${T + ph - h + 18}" text-anchor="middle" style="fill:#fff;font-weight:700">${v && h > 26 ? usd(v) : ""}</text>
      <text x="${x + w / 2}" y="${H - 10}" text-anchor="middle">${m.label.slice(0, 3)}</text>`; }).join("");
  $("#monthChart").innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Earnings per lifter each month against a ${usd(t)} target">
    <line class="axis" x1="${L}" x2="${W - R}" y1="${T + ph}" y2="${T + ph}"/>${cols}
    <line class="tgt" x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}"/><text x="${W - R}" y="${T - 12}" text-anchor="end" class="lbl-strong">Target ${usd(t)}</text></svg>`;
}
function renderResult() {
  const ms = monthsList(), g = goal(), raised = plannedTotal(), per = ms.reduce((s, m) => s + monthEarn(m.cal), 0), gap = raised - g, nd = neededPerMonth(), p = Math.max(1, num(S.team.people));
  const cls = raised === 0 ? "" : gap >= 0 ? "ok" : "bad";
  $("#result").innerHTML = `<div class="verdict ${cls}"><b>${raised === 0 ? "No shifts yet" : gap >= 0 ? (gap > 0 ? `Covered, with ${usd(gap)} to spare` : "Covered, right on the goal") : `${usd(-gap)} short`}</b>
    ${raised === 0 ? "Add shifts from Find work, or let the planner suggest a mix."
    : `Each lifter raises ${usd(per)} over ${ms.length} months, about ${usd(per / ms.length, 2)} a month. You need ${usd(nd, 2)}.${gap < 0 ? ` Closing the gap takes about ${usd(-gap / p / ms.length, 2)} more per lifter each month, or a cheaper stay and ride.` : ""}`}</div>`;
}
function renderPlan() { renderPlanList(); renderResult(); renderCum(); renderMonthChart(); }

function suggestPlan() {
  const ms = monthsList(), nd = neededPerMonth() * 1.05;
  const ok = S.jobs.filter(j => !j.group && earn(j) > 0 && ms.every(m => inSeason(j, m.cal)));
  if (!ok.length || nd <= 0) { toast("No year-round jobs to suggest from. Add one in Find work."); return; }
  const plan = {}; let rem = nd, count = 0;
  while (rem > 0 && count < 4) {
    const fits = ok.filter(j => earn(j) >= rem).sort((a, b) => earn(a) - earn(b) || hourly(b) - hourly(a))[0];
    const pick = fits || ok.slice().sort((a, b) => earn(b) - earn(a) || hourly(b) - hourly(a))[0];
    plan[pick.id] = (plan[pick.id] || 0) + 1; rem -= earn(pick); count++;
  }
  S.plan = plan; save(); renderJobs(); renderPlan(); renderHeroes(); renderSetupFacts();
  const names = Object.keys(plan).map(id => S.jobs.find(j => j.id === id).title);
  toast(`Plan set: ${count} shift${count > 1 ? "s" : ""} a month. ${names.join(" and ")}.`);
}

/* ---------------- orchestration ---------------- */
function refreshLight() {
  updateLodging(); updateTransport(); updateLines(); renderTimeline(); renderPicks(); renderMatrix();
  renderHeroes(); renderSetupFacts(); renderJobs(); renderPlan(); renderMonthSelectKeep();
}
function renderMonthSelectKeep() { renderMonthSelect(); F.month = $("#fMonth").value; }
function renderAll() {
  bindStatic(); renderLodging(); renderTransport(); updateLines(); renderTimeline(); renderPicks(); renderMatrix();
  renderCatChips(); renderMonthSelect(); renderJobs(); renderPlan(); renderHeroes(); renderSetupFacts();
}

/* ---------------- events ---------------- */
function go(tab) {
  $$("nav.tabs button").forEach(x => x.setAttribute("aria-selected", x.dataset.tab === tab));
  $$("section.panel").forEach(p => p.classList.toggle("on", p.id === "tab-" + tab));
  window.scrollTo({ top: 0 });
}
$$("nav.tabs button").forEach(b => b.addEventListener("click", () => go(b.dataset.tab)));
document.addEventListener("click", e => {
  const a = e.target.closest("[data-act]"); if (!a) return;
  if (a.dataset.act === "suggest") { suggestPlan(); }
  if (a.dataset.act === "goto-jobs") go("jobs");
});
function onTop(e) {
  const el = e.target;
  if (el.dataset.team) { S.team[el.dataset.team] = el.type === "number" ? num(el.value) : el.value; }
  else if (el.dataset.trip) { S.trip[el.dataset.trip] = el.type === "number" ? num(el.value) : el.value; }
  else if (el.dataset.gm !== undefined) { S.team.goalMode = el.value; $('[data-team="goal"]').disabled = el.value === "trip"; }
  else if (el.dataset.gset) { S.grade[el.dataset.gset] = num(el.value); }
  else return;
  save(); refreshLight();
}
document.addEventListener("input", onTop);
document.addEventListener("change", e => { if (e.target.dataset.gm !== undefined) onTop(e); });

function listHandlers(rootSel, listName, selKey, rerender) {
  const root = $(rootSel);
  const item = e => { const o = e.target.closest("[data-id]"); return o && S[listName].find(x => x.id === o.dataset.id); };
  root.addEventListener("input", e => {
    const it = item(e), k = e.target.dataset.k; if (!it || !k || k === "type") return;
    const t = e.target;
    it[k] = t.type === "checkbox" ? t.checked
      : t.type === "number" ? ((t.dataset.opt !== undefined && t.value === "") ? null : num(t.value)) : t.value;
    save(); refreshLight();
  });
  root.addEventListener("change", e => {
    const it = item(e), k = e.target.dataset.k; if (!it || k !== "type") return;
    it.type = e.target.value; Object.entries(TDEF[it.type]).forEach(([kk, v]) => { if (it[kk] === undefined) it[kk] = v; });
    it.redeye = TDEF[it.type].redeye;
    save(); keepFocus(rerender); refreshLight();
  });
  root.addEventListener("toggle", e => {
    const id = e.target.dataset && e.target.dataset.open; if (!id) return;
    e.target.open ? openCards.add(id) : openCards.delete(id);
  }, true);
  root.addEventListener("click", e => {
    const it = item(e); if (!it) return;
    if (e.target.matches("[data-pick]")) {
      S[selKey] = it.id; if (selKey === "selT") S.selRed = false; save();
      keepFocus(() => { renderLodging(); renderTransport(); }); refreshLight();
    }
    const del = e.target.closest("[data-del]");
    if (del) {
      if (!confirm(`Delete “${it.name}”?`)) return;
      S[listName] = S[listName].filter(x => x !== it);
      if (S[selKey] === it.id) { S[selKey] = S[listName][0]?.id; if (selKey === "selT") S.selRed = false; }
      save(); rerender(); refreshLight(); toast("Deleted.");
    }
  });
}
listHandlers("#lodgingList", "lodging", "selL", renderLodging);
listHandlers("#transList", "transport", "selT", renderTransport);
$("#addL").onclick = () => {
  const l = { id: uid(), name: "New Airbnb", url: "", nightly: 300, cleaning: 100, service: 100, tax: 12, sleeps: 8, miles: null, mins: null };
  S.lodging.push(l); if (!S.selL) S.selL = l.id; openCards.add(l.id); S.lmin = ""; save(); renderLodging(); refreshLight();
  const n = $(`[data-id="${l.id}"] [data-k=name]`); n.focus(); n.select();
};
$("#addT").onclick = () => {
  const t = { id: uid(), type: "van", name: "New transportation", ...TDEF.van };
  S.transport.push(t); if (!S.selT) S.selT = t.id; openCards.add(t.id); save(); renderTransport(); refreshLight();
  const n = $(`[data-id="${t.id}"] [data-k=name]`); n.focus(); n.select();
};
function chooseCombo(e) {
  const b = e.target.closest(".cell, .pick"); if (!b) return;
  S.selL = b.dataset.l; S.selT = b.dataset.t; S.selRed = b.dataset.r === "1"; save();
  keepFocus(() => { renderLodging(); renderTransport(); }); refreshLight();
  if (b.classList.contains("pick")) toast("Using that combination.");
}
$("#matrix").addEventListener("click", chooseCombo);
$("#picks").addEventListener("click", chooseCombo);
$("#lSort").onchange = e => { S.lsort = e.target.value; save(); renderLodging(); renderMatrix(); };
$("#lMin").onchange = e => { S.lmin = e.target.value; save(); renderLodging(); renderMatrix(); };

// jobs filters
$("#q").addEventListener("input", e => { F.q = e.target.value; renderJobs(); });
$("#fArea").onchange = e => { F.area = e.target.value; renderJobs(); };
$("#fWhen").onchange = e => { F.when = e.target.value; renderJobs(); };
$("#fMonth").onchange = e => { F.month = e.target.value; renderJobs(); };
$("#fSort").onchange = e => { F.sort = e.target.value; renderJobs(); };
$("#fFew").onchange = e => { F.few = e.target.checked; renderJobs(); };
$("#catChips").addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if (!b) return; F.cat = b.dataset.cat; keepFocus(() => { renderCatChips(); renderJobs(); }); });

function stepHandler(e) {
  const b = e.target.closest("[data-step]"); if (!b) return;
  const id = b.closest("[data-id]").dataset.id;
  S.plan[id] = Math.max(0, Math.min(12, (S.plan[id] || 0) + +b.dataset.step));
  if (!S.plan[id]) delete S.plan[id];
  save(); keepFocus(() => { renderJobs(); renderPlan(); }); renderHeroes(); renderSetupFacts();
}
$("#jobList").addEventListener("click", e => {
  stepHandler(e);
  if (e.target.closest("#clearF")) { Object.assign(F, { q: "", cat: "", area: "", when: "", month: "", few: false }); $("#q").value = ""; $("#fArea").value = $("#fWhen").value = $("#fMonth").value = ""; $("#fFew").checked = false; renderCatChips(); renderJobs(); }
  const ed = e.target.closest("[data-edit]"); if (ed) { e.preventDefault(); openJob(ed.closest("[data-id]").dataset.id); }
});
$("#planList").addEventListener("click", stepHandler);
$("#addJob").onclick = () => openJob(null);

// job dialog
function openJob(id) {
  const j = id ? S.jobs.find(x => x.id === id) : { title: "", cat: CATS[0], rate: 15, hours: 4, tips: 0, group: false, payout: 0, crew: 1, area: "near", when: ["weekend"], months: null, how: "", query: "", desc: "" };
  const f = $("#jobForm");
  f.innerHTML = `
    <h2>${id ? "Edit job" : "Add a job"}</h2>
    <div class="grid">
      <label class="field" style="grid-column:1/-1">Title<input type="text" name="title" required value="${esc(j.title)}"></label>
      <label class="field">Category<select name="cat">${CATS.map(c => `<option ${c === j.cat ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
      <label class="field">Area<select name="area">${Object.entries(AREA).map(([k, v]) => `<option value="${k}" ${k === j.area ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="switch-row" style="grid-column:1/-1"><input type="checkbox" class="switch" name="group" ${j.group ? "checked" : ""}><span>Team effort<small>One payout split among a crew</small></span></label>
      <label class="field">Hourly rate ($)<input type="number" step="any" min="0" name="rate" value="${j.rate}"></label>
      <label class="field">Hours per shift<input type="number" step="any" min="0.5" name="hours" value="${j.hours}"></label>
      <label class="field">Average tips per shift ($)<input type="number" step="any" min="0" name="tips" value="${j.tips}"></label>
      <label class="field">Team payout ($)<input type="number" step="any" min="0" name="payout" value="${j.payout}"></label>
      <label class="field">Crew size<input type="number" min="1" name="crew" value="${j.crew}"></label>
    </div>
    <p class="sub-h">When you can work</p>
    <div class="mchips">${Object.entries(WHEN).map(([k, v]) => `<label><input type="checkbox" name="when" value="${k}" ${j.when.includes(k) ? "checked" : ""}>${v}</label>`).join("")}</div>
    <p class="sub-h">Months available (none checked means year-round)</p>
    <div class="mchips">${MONTHS.map((m, i) => `<label><input type="checkbox" name="mo" value="${i + 1}" ${j.months && j.months.includes(i + 1) ? "checked" : ""}>${m}</label>`).join("")}</div>
    <div class="grid" style="margin-top:14px;grid-template-columns:1fr">
      <label class="field">Description<textarea name="desc" rows="2">${esc(j.desc)}</textarea></label>
      <label class="field">Where to find it, or who to contact<textarea name="how" rows="2">${esc(j.how)}</textarea></label>
      <label class="field">Search words for the Indeed, Handshake and Craigslist links<input type="text" name="query" value="${esc(j.query)}"></label>
    </div>
    <div class="row" style="margin-top:18px;justify-content:space-between">
      <div>${id ? '<button type="button" class="btn danger" id="jobDel">Delete job</button>' : ""}</div>
      <div class="row"><button type="button" class="btn" id="jobCancel">Cancel</button><button type="submit" class="btn pri" value="ok">Save job</button></div>
    </div>`;
  $("#jobCancel").onclick = () => $("#jobDlg").close();
  if (id) $("#jobDel").onclick = () => { if (!confirm("Delete this job?")) return; S.jobs = S.jobs.filter(x => x.id !== id); delete S.plan[id]; save(); $("#jobDlg").close(); refreshLight(); toast("Job deleted."); };
  f.onsubmit = ev => {
    if (ev.submitter?.value !== "ok") return;
    const d = new FormData(f), mo = d.getAll("mo").map(Number);
    const out = { title: d.get("title").trim(), cat: d.get("cat"), area: d.get("area"), group: d.has("group"),
      rate: num(d.get("rate")), hours: Math.max(.5, num(d.get("hours"))), tips: num(d.get("tips")), payout: num(d.get("payout")), crew: Math.max(1, num(d.get("crew"))),
      when: d.getAll("when"), months: mo.length && mo.length < 12 ? mo : null, desc: d.get("desc"), how: d.get("how"), query: d.get("query").trim() };
    if (!out.when.length) out.when = ["weekday"];
    if (id) Object.assign(S.jobs.find(x => x.id === id), out); else S.jobs.push({ id: uid(), ...out });
    save(); refreshLight(); toast(id ? "Job saved." : "Job added.");
  };
  $("#jobDlg").showModal();
}

// plan actions
function summaryText() {
  const ms = monthsList(), per = ms.reduce((s, m) => s + monthEarn(m.cal), 0), g = goal();
  return [`FSU Weightlifting: ${S.trip.dest || "trip"} fundraising plan`,
    `Trip: ${selL()?.name || "none"} + ${selT()?.name || "none"}, ${selN()} nights${selRed() ? " (red-eye home)" : ""} = ${usd(tripTotal())} (${usd(tripTotal() / Math.max(1, num(S.team.people)))} per person)`,
    `Goal: ${usd(g)} for ${S.team.people} lifters over ${ms.length} months (${ms[0].label} to ${ms[ms.length - 1].label}). Need ${usd(neededPerMonth(), 2)} per lifter per month.`,
    `Monthly shifts per lifter:`, ...planJobs().map(j => `  • ${S.plan[j.id]}× ${j.title} (${usd(earn(j))} a shift)`),
    `Each lifter raises ${usd(per)}. The team raises ${usd(plannedTotal())} against a ${usd(g)} goal.`].join("\n");
}
$("#copyBtn").onclick = async () => {
  try { await navigator.clipboard.writeText(summaryText()); $("#copyMsg").textContent = "Copied. Paste it into your group chat."; toast("Summary copied."); }
  catch (e) { prompt("Copy this summary:", summaryText()); }
};
$("#printBtn").onclick = () => window.print();
$("#exportBtn").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: "application/json" }));
  a.download = "fsu-lifting-budget.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast("Backup file saved.");
};
$("#importBtn").onclick = () => $("#importFile").click();
$("#importFile").onchange = async e => {
  try {
    const d = JSON.parse(await e.target.files[0].text());
    if (!d.team || !d.jobs || !d.lodging || !d.transport) throw 0;
    S = normalize(d); save(); heroFirst = true; renderAll(); $("#copyMsg").textContent = "Backup loaded."; toast("Backup loaded.");
  } catch (err) { toast("That file isn't a planner backup. Pick the file you saved with Save backup file."); }
  e.target.value = "";
};
$("#resetBtn").onclick = () => { if (confirm("Reset everything back to the starting sample data? This can't be undone.")) { S = defaults(); save(); heroFirst = true; openCards.clear(); renderAll(); toast("Back to the starting data."); } };

renderAll();
