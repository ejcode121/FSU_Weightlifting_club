
/* ================= UI ================= */
const ico = (id, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const usdK = n => Math.abs(n) >= 1000 ? `$${+(n / 1000).toFixed(Math.abs(n) >= 10000 ? 1 : 2)}K` : usd(n, n % 1 ? 2 : 0);
const CAT_ICO = { "Race & Meet Crews": "pin", "Game Day & Concessions": "ticket", "Festivals & Markets": "people", "Team Events": "people", "Moving & Labor": "box", "Yard & Home": "home",
  "Coaching & Tutoring": "book", "On-demand Gigs": "bag" };
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

/* ---------------- progress bar ---------------- */
let heroFirst = true;
function progressHTML(raised, g) {
  const pct = g > 0 ? Math.min(100, raised / g * 100) : 0, label = g > 0 ? Math.round(raised / g * 100) + "%" : "0%";
  const inside = pct >= 14, state = raised >= g && g > 0 ? "ok" : "";
  return `<div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-label="Fundraising progress toward ${usd(g)}">
    <div class="prog-fill ${state} ${heroFirst ? "grow" : ""}" style="width:${pct}%"></div>
    <span class="prog-pct ${inside ? "in" : ""}" style="left:${pct}%">${label}</span></div>
    <div class="prog-scale"><span>$0</span><span>Goal ${usd(g)}</span></div>`;
}
function heroHTML(mode) {
  const g = goal(), raised = plannedTotal(), gap = raised - g;
  const title = "Fundraising";
  const cls = raised === 0 ? "" : gap >= 0 ? "ok" : "warn";
  return `<h1 class="hero-title">${title}</h1>
    <div class="bar-fig">${progressHTML(raised, g)}</div>
    <dl class="readout">
      <div><dt><i></i>Raised</dt><dd>${usd(raised)}</dd></div>
      <div><dt><i class="ghost"></i>Goal</dt><dd>${usd(g)}</dd></div>
      <div><dt><i class="${gap >= 0 && raised ? "ok" : "gap"}"></i>${gap >= 0 && raised ? "Cushion" : "Still to raise"}</dt><dd class="${cls}">${usd(Math.abs(raised ? gap : g))}</dd></div>
    </dl>
    ${raised === 0 ? `<div class="hero-cta"><button class="btn pri" type="button" data-act="goto-jobs">${ico("search")}Open the work calendar</button></div>` : ""}`;
}
function renderHeroes() {
  const g = goal(), raised = plannedTotal(), gap = raised - g;
  $("#heroTrip").innerHTML = heroHTML("trip");
  heroFirst = false;
  $("#heroPlan").innerHTML = heroHTML("plan");
  const st = raised >= g && g > 0 ? ["ok", "On track"] : raised === 0 ? ["warn", "Nothing signed up"] : ["bad", `Short ${usd(-gap)}`];
  $("#mini").innerHTML = `<b>${usd(raised)}</b><span class="of">of ${usd(g)}</span><span class="st ${st[0]}">${st[1]}</span>`;
  $("#loadFill").style.width = Math.min(100, g ? raised / g * 100 : 0) + "%";
}
function renderSetupFacts() {
  const p = num(S.team.people);
  $("#setupFacts").innerHTML = [[p, "lifters"], [usd(goal()), S.team.goalMode === "trip" ? "goal, from the trip" : "goal"], [usd(perLifter(), 2), "per lifter"]]
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
    h += `<li class="${meet ? "meet" : ""}"><b>${b}</b><span>${f(o) || ""}</span></li>`;
  }
  h += `<li class="last"><b>Head home</b><span>${f(1) || ""}</span></li>`;
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
  return `<div class="stay-cost"><b class="disp">${usd(c.total)}</b><span>${n} nights, ${usd(c.total / people)} per person</span></div>
    <div class="stay-chips"><span class="chip">${ico("bed")}${c.label}${l.beds ? `, ${l.beds} beds` : ""}</span>${l.rating ? `<span class="chip">${l.rating} (${l.rev})</span>` : ""}${l.checked ? `<span class="chip">Checked ${new Date(l.checked + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>` : ""}${l.no2 ? `<span class="chip">No 2-night price</span>` : ""}${l.est ? `<span class="chip">Estimated price</span>` : ""}
      <span class="chip">${ico("pin")}${has ? `${num(l.miles)} mi to the venue` : "No distance"}</span>${l.mins ? `<span class="chip">${num(l.mins)} min drive</span>` : ""}</div>`;
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
        <label class="use"><input class="sr" type="radio" name="selL" data-pick ${l.id === S.selL ? "checked" : ""}><span class="pill">${ico("check")}Use this stay</span></label>${l.url ? `<a class="btn sm" href="${esc(l.url)}" target="_blank" rel="noopener">View on website</a>` : ""}
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
    </article>`).join("") || `<div class="empty"><b>No Airbnbs</b></div>`;
  updateLodging();
}
function rideView(t) {
  const people = Math.max(1, num(S.team.people));
  return (t.est ? `<div><span class="chip">Estimated prices</span></div>` : "") + variants(t).map(v => { const c = transportCost(t, v.n);
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
      <label class="switch-row"><input type="checkbox" class="switch" data-k="redeye" ${t.redeye ? "checked" : ""}><span>Red-eye allowed</span></label>
      <div style="padding:0 16px 14px"><label class="use"><input class="sr" type="radio" name="selT" data-pick ${t.id === S.selT ? "checked" : ""}><span class="pill">${ico("check")}Use this ride</span></label></div>
      <details class="dis" data-open="${t.id}" ${openCards.has(t.id) ? "open" : ""}>
        <summary>Prices and details${ico("chev")}</summary>
        <div class="dis-body"><div class="grid">${TFIELDS[t.type].map(([k, lab]) => numField(k, lab, t[k])).join("")}</div></div>
      </details>
    </article>`;
  }).join("") || `<div class="empty"><b>No transportation</b></div>`;
  updateTransport();
}
function updateLines() {}
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
  if (!L.length || !S.transport.length) { $("#matrix").innerHTML = `<div class="empty"><b>Nothing to compare</b></div>`; return; }
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

/* ---------------- jobs tab: calendar ---------------- */
// Window: today through 2 weeks before the meet (Apr 15, 2027).
const WIN = { from: "2026-10-11", to: "2027-04-01" };
const CAL = { y: 2026, m: 9, sel: "" };
const dated = () => S.jobs.filter(j => j.on);
const undated = () => S.jobs.filter(j => !j.on);
const timeOf = j => j.time || "Time to be confirmed";
const payText = j => j.group ? (num(j.payout) ? `${usd(j.payout)} confirmed${num(j.crew) ? `, ${usd(j.payout / j.crew, 2)} each for ${j.crew} people` : ""}` : (j.pay || "None listed"))
  : `${usd(j.rate)}/hr × ${j.hours}h${j.tips ? ` + ${usd(j.tips)} tips` : ""}`;
function eventCard(j) {
  const on = !!S.plan[j.id];
  return `<article class="job ${on ? "inplan" : ""}" data-id="${j.id}">
    <div class="job-top"><span class="cat-ico">${ico(CAT_ICO[j.cat] || "plan")}</span>
      <div><h3>${esc(j.title)}</h3><div class="cn">${esc(j.cat)}</div></div></div>
    <dl class="ev">
      ${j.on ? `<div><dt>Date</dt><dd>${esc(dayLabel(j.on))}</dd></div><div><dt>Time slot</dt><dd>${esc(timeOf(j))}</dd></div>` : ""}
      <div><dt>Pay</dt><dd class="pay-dd">${esc(payText(j))}</dd></div>
      ${j.how ? `<div><dt>Sign-up</dt><dd>${esc(j.how)}</dd></div>` : ""}
    </dl>
    ${j.desc ? `<p class="desc">${esc(j.desc)}</p>` : ""}
    <div class="links">${j.url ? `<a href="${esc(j.url)}" target="_blank" rel="noopener">Event page</a>` : ""}${searchLinks(j)}<button type="button" class="btn ghost sm" data-edit style="min-height:32px;padding:2px 0">${ico("edit")}Edit</button></div>
    ${j.group ? `<div class="job-foot pay-in"><label>Confirmed payout ($)<input type="number" min="0" step="any" inputmode="decimal" data-pay="payout" value="${num(j.payout) || ""}" placeholder="Enter once quoted"></label>
      <label>Crew<input type="number" min="0" step="1" inputmode="numeric" data-pay="crew" value="${num(j.crew) || ""}"></label>
      <button type="button" class="btn ${on ? "" : "pri"} sm" data-signed aria-pressed="${on}">${ico(on ? "check" : "plus")}${on ? "Signed up" : "Mark signed up"}</button></div>` : ""}
  </article>`;
}
const searchLinks = j => {
  if (!j.query) return "";
  const q = encodeURIComponent(j.query);
  return `<a href="https://www.indeed.com/jobs?q=${q}&l=Tallahassee%2C+FL&radius=10" target="_blank" rel="noopener">Indeed</a>
    <a href="https://tallahassee.craigslist.org/search/ggg?query=${q}" target="_blank" rel="noopener">Craigslist gigs</a>`;
};
const ymd = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
function renderCalendar() {
  const first = new Date(CAL.y, CAL.m, 1), dim = new Date(CAL.y, CAL.m + 1, 0).getDate(), lead = first.getDay();
  const by = {}; dated().forEach(j => (by[j.on] = by[j.on] || []).push(j));
  const today = iso(new Date());
  $("#calTitle").textContent = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const idx = CAL.y * 12 + CAL.m, lo = 2026 * 12 + 9, hi = 2027 * 12 + 3;
  $("#calPrev").disabled = idx <= lo; $("#calNext").disabled = idx >= hi;
  let cells = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => `<div class="cw" aria-hidden="true">${d}</div>`).join("") + '<div class="cd blank"></div>'.repeat(lead);
  for (let d = 1; d <= dim; d++) {
    const k = ymd(CAL.y, CAL.m, d), n = (by[k] || []).length, out = k < WIN.from || k > WIN.to, planned = (by[k] || []).filter(j => S.plan[j.id]).length;
    const lab = `${new Date(k + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, ${n ? `${n} opportunit${n > 1 ? "ies" : "y"}` : "none"}`;
    cells += `<button type="button" class="cd ${n ? "has" : ""} ${out ? "out" : ""} ${k === CAL.sel ? "sel" : ""} ${k === today ? "today" : ""}" data-on="${k}" aria-label="${lab}" aria-pressed="${k === CAL.sel}"><b>${d}</b>${n ? `<span class="cn-b ${planned ? "done" : ""}">${n}</span>` : ""}</button>`;
  }
  $("#calGrid").innerHTML = cells;
}
function renderDayPanel() {
  const el = $("#dayPanel"), list = dated().filter(j => j.on === CAL.sel);
  if (!CAL.sel) { el.innerHTML = `<p class="hint">Pick a marked day to see sign-ups.</p>`; return; }
  const head = `<h3 class="day-h">${esc(dayLabel(CAL.sel))}</h3>`;
  el.innerHTML = head + (list.length ? `<div class="jobs one">${list.map(j => eventCard(j)).join("")}</div>` : `<p class="hint">Nothing listed for this day.</p>`);
}
function renderJobs() {
  const list = undated().sort((a, b) => (b.group - a.group) || a.title.localeCompare(b.title));
  $("#resCount").textContent = `${list.length} without a date`;
  $("#anyDay").hidden = !list.length;
  $("#jobList").innerHTML = list.map(j => eventCard(j)).join("");
  renderCalendar(); renderDayPanel();
}
function firstUpcoming() { const d = iso(new Date()); const k = dated().map(j => j.on).filter(o => o >= d).sort()[0] || dated().map(j => j.on).sort()[0] || ""; return k; }
function selectDay(k) { CAL.sel = k; if (k) { CAL.y = +k.slice(0, 4); CAL.m = +k.slice(5, 7) - 1; } renderCalendar(); renderDayPanel(); }

/* ---------------- plan tab ---------------- */
function renderPlanList() {
  const pj = planJobs();
  $("#planList").innerHTML = pj.length ? pj.map(j => `
    <div class="shift-row" data-id="${j.id}">
      <div><b>${esc(j.title)}</b><small>${j.on ? `${esc(dayLabel(j.on))} · ${esc(timeOf(j))}` : "Any day"}</small></div>
      <div class="sub">${j.group && !num(j.payout) ? "No payout yet" : usd(j.group ? j.payout : earn(j) * num(S.team.people))}</div>
      <div style="grid-column:1/-1"><button type="button" class="btn sm" data-unplan>${ico("x")}Remove</button></div>
    </div>`).join("")
    : `<div class="empty"><b>Nothing signed up</b><button class="btn pri" type="button" data-act="goto-jobs">${ico("search")}Open the work calendar</button></div>`;
}
function renderResult() {
  const g = goal(), raised = plannedTotal(), gap = raised - g;
  const cls = raised === 0 ? "" : gap >= 0 ? "ok" : "bad";
  $("#result").innerHTML = `<div class="verdict ${cls}"><b>${raised === 0 ? "Nothing signed up" : gap >= 0 ? `Covered, ${usd(gap)} to spare` : `${usd(-gap)} short`}</b>
    ${raised === 0 ? "" : `${usd(raised)} confirmed from ${planJobs().length} signed-up ${planJobs().length > 1 ? "events" : "event"}`}</div>`;
}
function renderPlan() { renderPlanList(); renderResult(); }

/* ---------------- orchestration ---------------- */
function refreshLight() {
  renderMaps(); renderLiveTrip(); updateLodging(); updateTransport(); updateLines(); renderTimeline(); renderPicks(); renderMatrix();
  renderHeroes(); renderSetupFacts(); renderJobs(); renderPlan();
}
function renderAll() {
  renderLive(); renderMaps(); bindStatic(); renderLodging(); renderTransport(); updateLines(); renderTimeline(); renderPicks(); renderMatrix();
  selectDay(CAL.sel || firstUpcoming()); renderJobs(); renderPlan(); renderHeroes(); renderSetupFacts();
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
    if (it.est && k !== "name" && k !== "url" && k !== "redeye" && (listName === "transport" || ["nightly", "cleaning", "service"].includes(k))) it.est = false;
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
$("#addLink").onclick = openStayDlg;
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

// calendar
$("#calPrev").onclick = () => { const d = new Date(CAL.y, CAL.m - 1, 1); CAL.y = d.getFullYear(); CAL.m = d.getMonth(); renderCalendar(); };
$("#calNext").onclick = () => { const d = new Date(CAL.y, CAL.m + 1, 1); CAL.y = d.getFullYear(); CAL.m = d.getMonth(); renderCalendar(); };
$("#calGrid").addEventListener("click", e => { const b = e.target.closest("[data-on]"); if (!b) return; selectDay(b.dataset.on); const n = $(`#calGrid [data-on="${b.dataset.on}"]`); if (n) n.focus(); $("#dayPanel").scrollIntoView({ block: "nearest", behavior: "smooth" }); });
function signHandler(e) {
  const b = e.target.closest("[data-signed], [data-unplan]"); if (!b) return false;
  const id = b.closest("[data-id]").dataset.id;
  if (S.plan[id]) delete S.plan[id]; else S.plan[id] = 1;
  save(); keepFocus(() => { renderJobs(); renderPlan(); }); renderHeroes(); renderSetupFacts();
  return true;
}
function jobClicks(e) {
  if (signHandler(e)) return;
  const ed = e.target.closest("[data-edit]"); if (ed) { e.preventDefault(); openJob(ed.closest("[data-id]").dataset.id); }
}
function payInput(e) {
  const i = e.target.closest("[data-pay]"); if (!i) return;
  const j = S.jobs.find(x => x.id === i.closest("[data-id]").dataset.id); if (!j) return;
  j[i.dataset.pay] = num(i.value); save(); renderHeroes(); renderSetupFacts(); renderPlan();
  const dd = i.closest("[data-id]").querySelector(".pay-dd"); if (dd) dd.textContent = payText(j);
}
$("#jobList").addEventListener("input", payInput); $("#dayPanel").addEventListener("input", payInput);
$("#jobList").addEventListener("click", jobClicks);
$("#dayPanel").addEventListener("click", jobClicks);
$("#planList").addEventListener("click", signHandler);
$("#addJob").onclick = () => openJob(null);

// job dialog
function openJob(id) {
  const j = id ? S.jobs.find(x => x.id === id) : { title: "", cat: CATS[0], rate: 15, hours: 4, tips: 0, group: true, payout: 0, crew: 0, pay: "", on: CAL.sel || "", time: "", url: "", area: "city", when: [], months: null, how: "", query: "", desc: "" };
  const f = $("#jobForm");
  f.innerHTML = `
    <h2>${id ? "Edit opportunity" : "Add an opportunity"}</h2>
    <div class="grid">
      <label class="field" style="grid-column:1/-1">Title<input type="text" name="title" required value="${esc(j.title)}"></label>
      <label class="field">Category<select name="cat">${CATS.map(c => `<option ${c === j.cat ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
      <label class="field">Date (blank means any day)<input type="date" name="on" value="${esc(j.on)}"></label>
      <label class="field" style="grid-column:1/-1">Time slot<input type="text" name="time" placeholder="e.g. 8:00 AM–12:00 PM" value="${esc(j.time)}"></label>
      <label class="switch-row" style="grid-column:1/-1"><input type="checkbox" class="switch" name="group" ${j.group ? "checked" : ""}><span>Team effort<small>One payout split among a crew</small></span></label>
      <label class="field">Confirmed team payout ($)<input type="number" step="any" min="0" name="payout" value="${j.payout || ""}"></label>
      <label class="field">Crew size<input type="number" min="0" name="crew" value="${j.crew || ""}"></label>
      <label class="field">Hourly rate ($)<input type="number" step="any" min="0" name="rate" value="${j.rate}"></label>
      <label class="field">Hours<input type="number" step="any" min="0.5" name="hours" value="${j.hours || 1}"></label>
      <label class="field">Tips ($)<input type="number" step="any" min="0" name="tips" value="${j.tips}"></label>
    </div>
    <div class="grid" style="margin-top:14px;grid-template-columns:1fr">
      <label class="field">Description<textarea name="desc" rows="2">${esc(j.desc)}</textarea></label>
      <label class="field">How to sign up<textarea name="how" rows="2">${esc(j.how)}</textarea></label>
      <label class="field">Sign-up link<input type="url" name="url" value="${esc(j.url)}"></label>
      <label class="field">Search words for the Indeed and Craigslist links<input type="text" name="query" value="${esc(j.query)}"></label>
    </div>
    <div class="row" style="margin-top:18px;justify-content:space-between">
      <div>${id ? '<button type="button" class="btn danger" id="jobDel">Delete</button>' : ""}</div>
      <div class="row"><button type="button" class="btn" id="jobCancel">Cancel</button><button type="submit" class="btn pri" value="ok">Save</button></div>
    </div>`;
  $("#jobCancel").onclick = () => $("#jobDlg").close();
  if (id) $("#jobDel").onclick = () => { if (!confirm("Delete this opportunity?")) return; S.jobs = S.jobs.filter(x => x.id !== id); delete S.plan[id]; save(); $("#jobDlg").close(); refreshLight(); toast("Deleted."); };
  f.onsubmit = ev => {
    if (ev.submitter?.value !== "ok") return;
    const d = new FormData(f);
    const out = { title: d.get("title").trim(), cat: d.get("cat"), group: d.has("group"), on: d.get("on") || "", time: d.get("time").trim(), url: d.get("url").trim(),
      rate: num(d.get("rate")), hours: Math.max(.5, num(d.get("hours"))), tips: num(d.get("tips")), payout: num(d.get("payout")), crew: Math.max(0, num(d.get("crew"))),
      desc: d.get("desc"), how: d.get("how"), query: d.get("query").trim() };
    if (id) Object.assign(S.jobs.find(x => x.id === id), out); else S.jobs.push({ id: uid(), area: "city", when: [], months: null, ...out });
    save(); if (out.on) selectDay(out.on); refreshLight(); toast(id ? "Saved." : "Added.");
  };
  $("#jobDlg").showModal();
}

// plan actions
function summaryText() {
  const g = goal();
  return [`FSU Weightlifting: ${S.trip.dest || "trip"} fundraising plan`,
    `Trip: ${selL()?.name || "none"} + ${selT()?.name || "none"}, ${selN()} nights${selRed() ? " (red-eye home)" : ""} = ${usd(tripTotal())} (${usd(tripTotal() / Math.max(1, num(S.team.people)))} per person)`,
    `Goal: ${usd(g)} for ${S.team.people} lifters (${usd(perLifter(), 2)} each).`,
    `Signed-up events:`, ...planJobs().map(j => `  • ${j.on ? dayLabel(j.on) + ", " + timeOf(j) : "Any day"}: ${j.title} (${j.group && !num(j.payout) ? "payout not confirmed" : usd(j.group ? j.payout : earn(j) * num(S.team.people))})`),
    `The team raises ${usd(plannedTotal())} against a ${usd(g)} goal.`].join("\n");
}
$("#copyBtn").onclick = async () => {
  try { await navigator.clipboard.writeText(summaryText()); toast("Summary copied."); }
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
    S = normalize(d); save(); heroFirst = true; renderAll(); toast("Backup loaded.");
  } catch (err) { toast("Not a planner backup."); }
  e.target.value = "";
};
$("#resetBtn").onclick = () => { if (confirm("Reset everything back to the starting sample data? This can't be undone.")) { S = defaults(); save(); heroFirst = true; openCards.clear(); renderAll(); toast("Back to the starting data."); } };

renderAll();
autoDiscover();
