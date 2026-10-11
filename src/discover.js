
/* ================= map + discovery =================
   Sources (all keyless, CORS-enabled, fetched when the page opens and cached in this browser):
   - OpenStreetMap Overpass: hotels, motels, guest houses, apartments, hostels near the venue; car-rental branches near Tallahassee
   - OSRM: real road miles and drive minutes; the Tallahassee to Richmond route
   - Nominatim: turns an Airbnb address into a map position
   Airbnb has no public data feed, so Airbnb stays come in through "Add by link" and sit on the same map. */
const VENUE = { lat: 37.5444, lon: -77.4349, name: "Greater Richmond Convention Center" };
const ORIGIN = { lat: 30.4418, lon: -84.2985, name: "Tallahassee" };
const AIRPORTS = { tlh: { lat: 30.3965, lon: -84.3503 }, ric: { lat: 37.5052, lon: -77.3197 } };
const DKEY = "fsu-lifting-discover-v1", DAYMS = 864e5;
const STAY_TYPES = { hotel: ["Hotel", 150, 4], motel: ["Motel", 110, 4], guest_house: ["Guest house", 180, 6], apartment: ["Apartment", 200, 6], hostel: ["Hostel", 45, 1], chalet: ["Chalet", 260, 8] };
function loadD() { try { const d = JSON.parse(localStorage.getItem(DKEY)); if (d && d.v === 1) return d; } catch (e) {} return { v: 1, ts: 0, stays: [], rentals: [], route: null }; }
let D = loadD(), dStatus = D.ts ? "saved" : "idle", dBusy = false, zoom = 0;
const saveD = () => { try { localStorage.setItem(DKEY, JSON.stringify(D)); } catch (e) {} };
const hav = (a, b, c, d) => { const r = x => x * Math.PI / 180, dl = r(c - a), dn = r(d - b), h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dn / 2) ** 2; return 7917.6 * Math.asin(Math.sqrt(h)); };
const gmap = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const fullUrl = u => !u ? "" : /^https?:/i.test(u) ? u : "https://" + u;
async function getJSON(url, opt = {}) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), opt.ms || 15000);
  try { const r = await fetch(url, { ...opt, signal: c.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(t); }
}
const overpass = q => getJSON("https://overpass-api.de/api/interpreter", { method: "POST", body: new URLSearchParams({ data: q }), ms: 25000 });
const elLL = e => ({ lat: e.lat ?? (e.center && e.center.lat), lon: e.lon ?? (e.center && e.center.lon) });

async function fetchStays() {
  const j = await overpass(`[out:json][timeout:25];nwr["tourism"~"^(hotel|motel|guest_house|apartment|hostel|chalet)$"]["name"](around:16000,${VENUE.lat},${VENUE.lon});out center tags 90;`);
  let list = (j.elements || []).map(e => { const p = elLL(e), t = e.tags || {}; if (p.lat == null) return null;
    return { id: `osm-${e.type[0]}${e.id}`, name: t.name, type: t.tourism, lat: p.lat, lon: p.lon, web: t.website || t["contact:website"] || "", rooms: +t.rooms || 0 }; }).filter(Boolean);
  list.forEach(s => { s.miles = +(hav(VENUE.lat, VENUE.lon, s.lat, s.lon) * 1.3).toFixed(1); s.mins = Math.round(s.miles / .4); s.road = false; });
  list = list.sort((a, b) => a.miles - b.miles).slice(0, 60);
  try {
    const co = [VENUE, ...list].map(p => `${p.lon},${p.lat}`).join(";");
    const r = await getJSON(`https://router.project-osrm.org/table/v1/driving/${co}?destinations=0&annotations=distance,duration`);
    list.forEach((s, i) => { const d = r.distances && r.distances[i + 1] && r.distances[i + 1][0], t = r.durations && r.durations[i + 1] && r.durations[i + 1][0];
      if (d != null && t != null) { s.miles = +(d / 1609.34).toFixed(1); s.mins = Math.round(t / 60); s.road = true; } });
  } catch (e) {}
  return list;
}
async function fetchRoute() {
  const r = await getJSON(`https://router.project-osrm.org/route/v1/driving/${ORIGIN.lon},${ORIGIN.lat};${VENUE.lon},${VENUE.lat}?overview=simplified&geometries=geojson`);
  const rt = r.routes[0], c = rt.geometry.coordinates, k = Math.max(1, Math.ceil(c.length / 150));
  return { miles: rt.distance / 1609.34, mins: rt.duration / 60, pts: c.filter((_, i) => i % k === 0 || i === c.length - 1) };
}
async function fetchRentals() {
  const j = await overpass(`[out:json][timeout:25];nwr["amenity"="car_rental"]["name"](around:20000,${ORIGIN.lat},${ORIGIN.lon});out center tags 30;`);
  return (j.elements || []).map(e => { const p = elLL(e), t = e.tags || {}; return p.lat == null ? null : { name: t.name, lat: p.lat, lon: p.lon, web: t.website || t["contact:website"] || "" }; }).filter(Boolean)
    .sort((a, b) => hav(ORIGIN.lat, ORIGIN.lon, a.lat, a.lon) - hav(ORIGIN.lat, ORIGIN.lon, b.lat, b.lon)).slice(0, 12);
}
async function discover() {
  if (dBusy) return; dBusy = true; dStatus = "loading"; renderMaps();
  const [s, r, v] = await Promise.allSettled([fetchStays(), fetchRoute(), fetchRentals()]);
  let ok = 0;
  if (s.status === "fulfilled") { D.stays = s.value; ok++; }
  if (r.status === "fulfilled") { D.route = r.value; ok++; }
  if (v.status === "fulfilled") { D.rentals = v.value; ok++; }
  if (ok) { D.ts = Date.now(); saveD(); }
  dStatus = ok ? "live" : D.ts ? "saved" : "offline"; dBusy = false; renderMaps();
}
function autoDiscover() { if (Date.now() - D.ts > DAYMS && navigator.onLine !== false) discover(); }
const statusText = () => dStatus === "loading" ? "Loading" : dStatus === "offline" ? "Offline" : D.ts ? `Updated ${new Date(D.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "No data";
const routeMiles = () => D.route ? D.route.miles : hav(ORIGIN.lat, ORIGIN.lon, VENUE.lat, VENUE.lon) * 1.2;
const routeMins = () => D.route ? D.route.mins : routeMiles() / .8;
const hm = m => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, "0")}m`;

/* ---------- stay map ---------- */
const cosV = Math.cos(VENUE.lat * Math.PI / 180);
const xyMi = (lat, lon) => ({ dx: (lon - VENUE.lon) * 69.17 * cosV, dy: (lat - VENUE.lat) * 69.05 });
function lodgingPos(l) {
  if (l.lat != null && l.lon != null) return { lat: l.lat, lon: l.lon, approx: false };
  let h = 0; for (const ch of String(l.id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = (h % 360) * Math.PI / 180, mi = (l.miles === null || l.miles === undefined || l.miles === "") ? 3 : num(l.miles);
  return { lat: VENUE.lat + Math.sin(a) * mi / 69.05, lon: VENUE.lon + Math.cos(a) * mi / (69.17 * cosV), approx: true };
}
function stayItems() {
  const have = new Set(S.lodging.map(l => l.srcId).filter(Boolean));
  const trip = S.lodging.map(l => { const p = lodgingPos(l); return { k: "trip", id: l.id, name: l.name, ...p, ...xyMi(p.lat, p.lon), l }; });
  const disc = D.stays.filter(s => !have.has(s.id)).map(s => ({ k: "disc", id: s.id, name: s.name, lat: s.lat, lon: s.lon, ...xyMi(s.lat, s.lon), s }));
  return [...disc, ...trip].map(i => ({ ...i, dist: Math.hypot(i.dx, i.dy) }));
}
const mapBar = (zoomOn, Z) => `<div class="map-bar">${zoomOn ? `<div class="zoom" role="group" aria-label="Map zoom">${[3, 6, 12, 24].map(z => `<button type="button" data-zoom="${z}" aria-pressed="${Z === z}">${z} mi</button>`).join("")}</div>` : "<span></span>"}
  <span class="map-bar-r"><span class="stamp">${statusText()}</span><button class="icon-btn sm" type="button" data-refresh aria-label="Refresh map data" ${dBusy ? "disabled" : ""}>${ico("reset")}</button></span></div>`;
function renderStayMap() {
  const el = $("#stayMap"); if (!el) return;
  const items = stayItems(), tripMax = Math.max(0, ...items.filter(i => i.k === "trip").map(i => i.dist));
  const Z = zoom || [3, 6, 12, 24].find(z => z >= tripMax) || 24, s = 205 / Z;
  const shown = items.filter(i => i.dist <= Z).sort((a, b) => (a.k === "trip") - (b.k === "trip"));
  const rings = [1 / 3, 2 / 3, 1].map(f => Z * f);
  const pins = shown.map(i => { const x = (320 + i.dx * s).toFixed(1), y = (220 - i.dy * s).toFixed(1);
    if (i.k === "trip") { const g = lodgingGrade(i.l);
      return `<g class="pin trip ${g ? "g" + g.letter : "gx"} ${i.id === S.selL ? "sel" : ""}" tabindex="0" role="button" aria-label="${esc(i.name)}" data-pin="trip:${i.id}" transform="translate(${x} ${y})"><circle class="hit" r="20"/><circle class="dot" r="13"/><text y="1">${g ? g.letter : "?"}</text></g>`; }
    return `<g class="pin disc" tabindex="0" role="button" aria-label="${esc(i.name)}" data-pin="disc:${i.id}" transform="translate(${x} ${y})"><circle class="hit" r="16"/><circle class="dot" r="7"/></g>`; }).join("");
  const nDisc = D.stays.length;
  el.innerHTML = `${mapBar(true, Z)}<svg class="map" viewBox="0 0 640 440" role="group" aria-label="Map of stays around the venue">
    ${rings.map(r => `<circle class="ring-l" cx="320" cy="220" r="${r * s}"/><text class="ring-t" x="320" y="${220 - r * s - 5}" text-anchor="middle">${+r.toFixed(1)} mi</text>`).join("")}
    <line class="ring-l" x1="320" x2="320" y1="15" y2="425"/><line class="ring-l" x1="115" x2="525" y1="220" y2="220"/>
    <g class="venue" transform="translate(320 220)"><polygon points="0,-14 4.2,-5 14,-4.3 6.6,2.3 8.6,12 0,7 -8.6,12 -6.6,2.3 -14,-4.3 -4.2,-5"/></g><text class="venue-t" x="320" y="196" text-anchor="middle">Venue</text>${pins}</svg>
    <div class="map-legend"><span><i class="lg trip"></i>In trip</span><span><i class="lg disc"></i>Nearby${nDisc ? ` ${nDisc}` : ""}</span><span><i class="lg ven"></i>Venue</span></div>`;
}

/* ---------- route map ---------- */
function renderRouteMap() {
  const el = $("#routeMap"); if (!el) return;
  const pts = D.route ? D.route.pts : [[ORIGIN.lon, ORIGIN.lat], [VENUE.lon, VENUE.lat]];
  const lons = pts.map(p => p[0]), lats = pts.map(p => p[1]), midLat = (Math.min(...lats) + Math.max(...lats)) / 2, k = Math.cos(midLat * Math.PI / 180);
  const minLon = Math.min(...lons), minLat = Math.min(...lats), w = (Math.max(...lons) - minLon) * k, h = Math.max(...lats) - minLat, pad = 56;
  const sc = Math.min((640 - 2 * pad) / w, (320 - 2 * pad) / h), ox = (640 - w * sc) / 2, oy = (320 - h * sc) / 2;
  const P = (lon, lat) => [ox + (lon - minLon) * k * sc, 320 - oy - (lat - minLat) * sc];
  const path = pts.map((p, i) => { const q = P(p[0], p[1]); return `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }).join("");
  const o = P(ORIGIN.lon, ORIGIN.lat), v = P(VENUE.lon, VENUE.lat), m = P(...pts[Math.floor(pts.length / 2)]);
  const pin = (id, label, x, y, cls) => `<g class="pin rt ${cls || ""}" tabindex="0" role="button" aria-label="${label}" data-pin="rt:${id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle class="hit" r="22"/><circle class="dot" r="11"/><text y="1">${{ origin: "V", tlh: "F", ric: "F", mid: "B" }[id]}</text></g>`;
  const oneWay = routeMiles();
  el.innerHTML = `${mapBar(false)}<svg class="map" viewBox="0 0 640 320" role="group" aria-label="Route from Tallahassee to Richmond">
    <path class="route-l" d="${path}"/>
    <line class="leader" x1="${o[0]}" y1="${o[1]}" x2="${o[0] - 34}" y2="${o[1] + 30}"/><line class="leader" x1="${v[0]}" y1="${v[1]}" x2="${v[0] - 34}" y2="${v[1] + 30}"/>
    ${pin("tlh", "Flights from Tallahassee airport", o[0] - 34, o[1] + 30)}${pin("ric", "Flights into Richmond airport", v[0] - 34, v[1] + 30)}
    ${pin("mid", "Charter bus", m[0], m[1])}${pin("origin", "Rental vans in Tallahassee", o[0], o[1])}
    <g class="venue" transform="translate(${v[0]} ${v[1]})"><polygon points="0,-14 4.2,-5 14,-4.3 6.6,2.3 8.6,12 0,7 -8.6,12 -6.6,2.3 -14,-4.3 -4.2,-5"/></g>
    <text class="venue-t" x="${v[0]}" y="${v[1] - 20}" text-anchor="middle">Richmond</text><text class="venue-t" x="${o[0]}" y="${o[1] - 18}" text-anchor="middle">Tallahassee</text></svg>
    <div class="map-legend"><span>${Math.round(oneWay).toLocaleString()} mi one way</span><span>${hm(routeMins())} drive</span><span><i class="lg ven"></i>Venue</span></div>`;
}
function renderMaps() { renderStayMap(); renderRouteMap(); }

/* ---------- popover: view on the real site, or add to the trip ---------- */
const pop = () => $("#mapPop");
function closePop() { const p = pop(); if (p) p.hidden = true; }
function openPop(html, anchor, key) {
  const p = pop(); p.innerHTML = `<button class="icon-btn sm pop-x" type="button" data-pop="close" aria-label="Close">${ico("x")}</button>${html}`; p.dataset.key = key; p.hidden = false;
  if (innerWidth > 700) { const r = anchor.getBoundingClientRect();
    p.style.left = Math.max(12, Math.min(innerWidth - 312, r.left + r.width / 2 - 150)) + scrollX + "px"; p.style.top = r.bottom + scrollY + 10 + "px";
  } else { p.style.left = p.style.top = ""; }
  const f = p.querySelector(".pop-act"); if (f) f.focus({ preventScroll: true });
}
const popActions = (href, label) => `<div class="pop-actions"><a class="btn pop-act" href="${href}" target="_blank" rel="noopener">View on website</a><button class="btn pri" type="button" data-pop="${label[0]}">${label[1]}</button></div>`;
const chip = t => `<span class="chip">${t}</span>`;
function showPin(g) {
  const [kind, id] = g.dataset.pin.split(":");
  if (kind === "trip") {
    const l = S.lodging.find(x => x.id === id); if (!l) return;
    const gr = lodgingGrade(l), c = lodgingCost(l), pos = lodgingPos(l);
    openPop(`<h3>${esc(l.name)}</h3><div class="chips-row">${gr ? chip(`Grade ${gr.letter}`) : ""}${l.miles != null && l.miles !== "" ? chip(`${num(l.miles)} mi`) : ""}${l.mins ? chip(`${num(l.mins)} min`) : ""}${chip(`${usd(c.total)} total`)}${l.est ? chip("Estimated price") : ""}${pos.approx ? chip("Position approximate") : ""}</div>
      ${popActions(fullUrl(l.url) || gmap(pos.approx ? `${l.name} Richmond VA` : `${pos.lat},${pos.lon}`), ["use", l.id === S.selL ? "Using" : "Use this stay"])}`, g, "trip:" + id);
  } else if (kind === "disc") {
    const s = D.stays.find(x => x.id === id); if (!s) return; const T = STAY_TYPES[s.type] || ["Stay", 150, 4];
    openPop(`<h3>${esc(s.name)}</h3><div class="chips-row">${chip(T[0])}${chip(`${s.miles} mi`)}${chip(`${s.mins} min`)}${chip(`~${usd(T[1])} a night, estimate`)}</div>
      ${popActions(fullUrl(s.web) || gmap(`${s.name} Richmond VA`), ["add", "Add to trip"])}`, g, "disc:" + id);
  } else {
    const dates = tripDates(), mi = Math.round(routeMiles());
    if (id === "origin") {
      const list = D.rentals.slice(0, 4).map(r => `<li><a href="${fullUrl(r.web) || gmap(`${r.name} Tallahassee FL`)}" target="_blank" rel="noopener">${esc(r.name)}</a></li>`).join("");
      openPop(`<h3>Rental vans</h3><div class="chips-row">${chip(`${mi * 2 + 60} mi round trip`)}${chip("Prices estimated")}</div>${list ? `<ul class="pop-list">${list}</ul>` : ""}
        ${popActions(`https://www.google.com/search?q=${encodeURIComponent("15 passenger van rental Tallahassee FL")}`, ["addvan", "Add to trip"])}`, g, "rt:origin");
    } else if (id === "mid") {
      openPop(`<h3>Charter bus</h3><div class="chips-row">${chip(`${hm(routeMins())} each way`)}${chip("Prices estimated")}</div>
        ${popActions(`https://www.google.com/search?q=${encodeURIComponent("charter bus rental Tallahassee FL to Richmond VA quote")}`, ["addbus", "Add to trip"])}`, g, "rt:mid");
    } else {
      openPop(`<h3>Flights</h3><div class="chips-row">${chip("TLH to RIC")}${chip("Prices estimated")}</div>
        ${popActions(`https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from TLH to RIC on ${dates.a} through ${dates.c}`)}`, ["addfly", "Add to trip"])}`, g, "rt:" + id);
    }
  }
}
function tripDates() {
  const n = baseNights(), m = S.trip.meetDay ? new Date(S.trip.meetDay + "T12:00:00") : new Date(2027, 3, 15), at = o => new Date(m.getFullYear(), m.getMonth(), m.getDate() + o);
  return { a: iso(at(-(n - 1))), c: iso(at(1)) };
}
function popAction(act) {
  const p = pop(), key = p.dataset.key || "", [kind, id] = key.split(":");
  if (act === "close") { closePop(); return; }
  if (act === "use") { S.selL = id; save(); keepFocus(() => { renderLodging(); renderTransport(); }); refreshLight(); closePop(); toast("Using this stay."); return; }
  if (act === "add") {
    const s = D.stays.find(x => x.id === id); if (!s) return; const T = STAY_TYPES[s.type] || ["Stay", 150, 4];
    const l = { id: uid(), name: s.name, url: fullUrl(s.web), nightly: T[1], cleaning: 0, service: 0, tax: 13, sleeps: T[2], miles: s.miles, mins: s.mins, lat: s.lat, lon: s.lon, src: "osm", srcId: s.id, est: true };
    S.lodging.push(l); openCards.add(l.id); S.lmin = ""; save(); renderLodging(); refreshLight(); closePop(); toast("Added. Enter the real price."); return;
  }
  const mk = { addvan: () => ({ type: "van", name: "Tallahassee vans", ...TDEF.van, miles: Math.round(routeMiles() * 2 + 60) }),
    addbus: () => ({ type: "bus", name: "Charter bus", ...TDEF.bus }), addfly: () => ({ type: "flight", name: "Flights TLH to RIC", ...TDEF.flight }) }[act];
  if (mk) { const t = { id: uid(), ...mk(), est: true }; S.transport.push(t); openCards.add(t.id); save(); renderTransport(); refreshLight(); closePop(); toast("Added. Enter the real price."); }
}
document.addEventListener("click", e => {
  const pin = e.target.closest("[data-pin]"); if (pin) { showPin(pin); return; }
  const a = e.target.closest("[data-pop]"); if (a) { popAction(a.dataset.pop); return; }
  const z = e.target.closest("[data-zoom]"); if (z) { zoom = +z.dataset.zoom; renderStayMap(); const n = document.querySelector(`[data-zoom="${zoom}"]`); if (n) n.focus({ preventScroll: true }); closePop(); return; }
  if (e.target.closest("[data-refresh]")) { discover(); return; }
  if (!e.target.closest("#mapPop")) closePop();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closePop();
  const g = e.target.closest && e.target.closest("g[data-pin]");
  if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); showPin(g); }
});

/* ---------- add an Airbnb by link ---------- */
async function geoStay(addr) {
  const r = await getJSON(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`);
  if (!r.length) throw new Error("none");
  const lat = +r[0].lat, lon = +r[0].lon; let miles, mins;
  try { const rt = (await getJSON(`https://router.project-osrm.org/route/v1/driving/${lon},${lat};${VENUE.lon},${VENUE.lat}?overview=false`)).routes[0]; miles = +(rt.distance / 1609.34).toFixed(1); mins = Math.round(rt.duration / 60); }
  catch (e) { miles = +(hav(lat, lon, VENUE.lat, VENUE.lon) * 1.3).toFixed(1); mins = Math.round(miles / .4); }
  return { lat, lon, miles, mins };
}
function openStayDlg() {
  const f = $("#stayForm");
  f.innerHTML = `<h2>Add Airbnb</h2><div class="grid" style="grid-template-columns:1fr">
      <label class="field">Airbnb link<input type="url" name="url" required placeholder="https://www.airbnb.com/rooms/…"></label>
      <label class="field">Address or area<input type="text" name="addr" placeholder="Street, Richmond, VA"></label>
      <label class="field">Name<input type="text" name="name"></label></div>
    <div class="grid" style="margin-top:12px"><label class="field">Nightly rate ($)<input type="number" min="0" step="any" name="nightly" value="300"></label>
      <label class="field">Cleaning fee ($)<input type="number" min="0" step="any" name="cleaning" value="100"></label>
      <label class="field">Service fee ($)<input type="number" min="0" step="any" name="service" value="100"></label>
      <label class="field">Sleeps (people)<input type="number" min="1" name="sleeps" value="8"></label></div>
    <div class="row" style="margin-top:18px;justify-content:flex-end"><button type="button" class="btn" id="stayCancel">Cancel</button><button type="submit" class="btn pri" id="staySave">Add to trip</button></div>`;
  $("#stayCancel").onclick = () => $("#stayDlg").close();
  f.onsubmit = async ev => {
    ev.preventDefault();
    const d = new FormData(f), url = fullUrl(String(d.get("url")).trim());
    if (!/airbnb\./i.test(url)) { toast("Paste an Airbnb link."); return; }
    const btn = $("#staySave"); btn.disabled = true; btn.textContent = "Adding";
    let geo = null; const addr = String(d.get("addr")).trim();
    if (addr) { try { geo = await geoStay(addr); } catch (e) {} }
    const l = { id: uid(), name: String(d.get("name")).trim() || addr || "Airbnb", url, nightly: num(d.get("nightly")), cleaning: num(d.get("cleaning")), service: num(d.get("service")), tax: 12,
      sleeps: Math.max(1, num(d.get("sleeps"))), miles: geo ? geo.miles : null, mins: geo ? geo.mins : null, lat: geo ? geo.lat : null, lon: geo ? geo.lon : null, src: "airbnb" };
    S.lodging.push(l); openCards.add(l.id); S.lmin = ""; save(); $("#stayDlg").close(); renderLodging(); refreshLight();
    toast(geo ? "Added to the trip and the map." : "Added. Add the miles to the venue to place it on the map.");
  };
  $("#stayDlg").showModal();
}
