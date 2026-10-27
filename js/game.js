// Tindahan ni Winnie: a sari-sari store math game.
// Plain JavaScript with no build step, so it runs on GitHub Pages or straight from a folder.
(function () {
  "use strict";

  const D = window.GAME_DATA;
  const SAVE_KEY = "tindahan-ni-winnie-v1";
  const BEST_KEY = "tindahan-ni-winnie-best";
  const app = document.getElementById("app");

  const SKILLS = {
    add: "Pagdagdag ng presyo (Adding prices)",
    change: "Pagsusukli (Giving change)",
    fare: "Pamasahe (Fares and rates)",
    percent: "Porsyento at patong (Percent and markup)",
    divide: "Paghahati at proporsyon (Division and proportion)",
    profit: "Tubo at lugi (Profit and loss)"
  };

  let S = null; // saved game state
  let ui = {}; // state for the current screen only

  // ---------- helpers ----------

  const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const product = (id) => D.products.find((p) => p.id === id);
  const ceilPeso = (n) => Math.ceil(r2(n) - 1e-9);

  function peso(n) {
    n = r2(n);
    const whole = Number.isInteger(n);
    return "₱" + n.toLocaleString("en-PH", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function parseNum(str) {
    const n = parseFloat(String(str).replace(/[₱,\s]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage may be blocked */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  }

  function record(skill, correct) {
    const st = S.stats[skill] || (S.stats[skill] = { right: 0, total: 0 });
    st.total += 1;
    if (correct) st.right += 1;
  }

  function addRep(n) { S.rep = clamp(S.rep + n, 0, 100); }

  function isTyphoonTime() { return S.day >= D.typhoonDay; }

  function fareFor(km) {
    const f = D.fare;
    return km <= f.baseKm ? f.base : r2(f.base + (km - f.baseKm) * f.perKm);
  }

  function supplierPackPrice(p, supplier) {
    return Math.round(p.packPrice * (1 - supplier.discount));
  }

  function sellPrice(id) {
    const st = S.stock[id];
    return ceilPeso(st.avgCost * (1 + S.markup));
  }

  // ---------- rendering ----------

  function stars(rep) {
    const n = Math.round(rep / 20);
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function hud() {
    if (!S) return "";
    return `<header class="hud">
      <span>Araw ${Math.min(S.day, D.days)} ng ${D.days}</span>
      <span class="cash">${peso(S.cash)}</span>
      <span class="rep" title="Tiwala ng suki (Customer trust)">${stars(S.rep)}</span>
    </header>`;
  }

  function show(sceneFn) {
    ui.scene = sceneFn;
    rerender();
  }

  function rerender() {
    app.innerHTML = hud() + `<main class="scene">${ui.scene()}</main>`;
    const input = app.querySelector("input[autofocus]");
    if (input) input.focus();
    window.scrollTo(0, 0);
  }

  function say(face, name, line) {
    return `<div class="speech"><div class="face">${face}</div>
      <div class="bubble"><b>${esc(name)}</b><p>${line}</p></div></div>`;
  }

  // A question: { skill, prompt, answer (number or function), tol, explain(answer), next(correct), check?() }
  function ask(q) {
    ui.q = q;
    ui.qDone = null;
    ui.qError = null;
  }

  function questionBlock() {
    const q = ui.q;
    if (!q) return "";
    if (ui.qDone) {
      const d = ui.qDone;
      return `<div class="feedback ${d.correct ? "good" : "bad"}" aria-live="polite">
        <p class="verdict">${d.correct ? "✅ Tama!" : "❌ Hindi pa tama."} ${d.extra || ""}</p>
        ${d.correct ? "" : `<p>Sagot mo: ${esc(d.given)} · Tamang sagot: <b>${q.format ? q.format(d.answer) : peso(d.answer)}</b></p>`}
        <div class="explain">${q.explain(d.answer)}</div>
        <button class="btn primary" data-act="qnext">Tuloy →</button>
      </div>`;
    }
    return `<form class="question" data-submit="answer">
      <label for="ans">${q.prompt}</label>
      <div class="answer-row">
        <input id="ans" name="ans" inputmode="decimal" autocomplete="off" placeholder="${q.placeholder || "₱"}" autofocus>
        <button class="btn primary" type="submit">${q.button || "Sagot"}</button>
      </div>
      ${ui.qError ? `<p class="error" role="alert">${ui.qError}</p>` : ""}
    </form>`;
  }

  // ---------- title and setup ----------

  function titleScreen() {
    S = null;
    const saved = load();
    let best = null;
    try { best = JSON.parse(localStorage.getItem(BEST_KEY) || "null"); } catch (e) { /* ignore */ }
    ui = {};
    ui.scene = () => `<div class="title">
        <div class="sign">🏪</div>
        <h1>Tindahan ni Winnie</h1>
        <p class="tag">Isang sari-sari store math game sa Baclaran</p>
        ${saved ? `<button class="btn primary big" data-act="continue">Ituloy ang laro (Araw ${Math.min(saved.day, D.days)})</button>` : ""}
        <form class="setup" data-submit="start">
          <label>Pangalan mo <input name="name" maxlength="20" placeholder="Hal. Juan" required></label>
          <fieldset><legend>Baitang (Grade)</legend>
            <label class="choice"><input type="radio" name="grade" value="7" checked> Grade 7</label>
            <label class="choice"><input type="radio" name="grade" value="8"> Grade 8</label>
          </fieldset>
          <button class="btn ${saved ? "" : "primary"} big" type="submit">Bagong laro</button>
        </form>
        ${best ? `<p class="best">Pinakamataas na score: ${best.score} (${esc(best.name)})</p>` : ""}
        <button class="link" data-act="help">Paano laruin?</button>
      </div>`;
    rerender();
  }

  function helpScreen() {
    show(() => `<h2>Paano laruin</h2>
      <p>Si Winnie ay magbabakasyon at ikaw muna ang bahala sa tindahan niya sa Baclaran nang ${D.days} araw.</p>
      <ol class="steps">
        <li>🚌 <b>Biyahe:</b> Pumili kung saan mamimili at kuwentahin ang pamasahe sa jeep.</li>
        <li>🛒 <b>Pamimili:</b> Bumili ng paninda. Kuwentahin ang kabuuan para may diskwento.</li>
        <li>🏷️ <b>Presyo:</b> Pumili ng patong (markup) at kuwentahin ang presyo.</li>
        <li>🙋 <b>Tindahan:</b> Kuwentahin ang binili ng suki at ibigay ang tamang sukli.</li>
        <li>📒 <b>Listahan:</b> Kuwentahin ang tubo sa gabi.</li>
      </ol>
      <p>Tamang sagot = mas maraming suki at mas malaking kita. Mali = lugi o galit na suki!</p>
      <p class="muted">Ang mga presyo at pamasahe sa laro ay halimbawa lamang.</p>
      <button class="btn primary" data-act="title">Bumalik</button>`);
  }

  function newGame(name, grade) {
    S = {
      name: name || "Bata",
      grade: grade,
      day: 1,
      cash: D.startCash,
      rep: 60,
      stock: {},
      markup: 0.2,
      fareSpent: 0,
      today: null,
      typhoonDone: false,
      stats: {}
    };
    D.products.forEach((p) => { S.stock[p.id] = { qty: 0, avgCost: p.packPrice / p.size }; });
    ui = {};
    show(introScene);
  }

  function introScene() {
    return `${say("👩", "Winnie", `Uy, ${esc(S.name)}! Salamat sa pagbabantay ng tindahan ko habang nasa probinsya ako.
        Heto ang <b>${peso(S.cash)}</b> na puhunan. Bantayan mo ang kita, ha? Huwag kang magpapalugi!`)}
      ${say("👩", "Winnie", "Tandaan: maraming suki dito sa Baclaran, lalo na pag Miyerkules. Bilisan mo ang kuwenta pero siguraduhing tama!")}
      <button class="btn primary" data-act="startDay">Simulan ang Araw 1 →</button>`;
  }

  // ---------- day flow ----------

  function startDay() {
    S.today = { sales: 0, cogs: 0, fare: 0, served: 0, lost: 0 };
    save();
    ui = {};
    if (S.day === D.typhoonDay && !S.typhoonDone) typhoonStart();
    else travelStart();
  }

  // Typhoon warning event, before the day's trip.
  function typhoonStart() {
    const unit = pick([{ id: "kandila", price: 6 }, { id: "sardinas", price: 26 }, { id: "canton", price: 16 }]);
    const budget = randInt(10, 20) * 10;
    const p = product(unit.id);
    const answer = Math.floor(budget / unit.price);
    ask({
      skill: "divide",
      prompt: `Ang barangay ay may <b>${peso(budget)}</b> para sa ${p.emoji} ${p.name}, na <b>${peso(unit.price)}</b> bawat isa.
        Ilan ang <b>pinakamaraming</b> mabibili?`,
      placeholder: "ilan?",
      format: (n) => `${n} piraso`,
      answer: answer,
      tol: 0,
      explain: (a) => `${peso(budget)} ÷ ${peso(unit.price)} = ${r2(budget / unit.price)}. Hindi puwedeng bumili ng bahagi ng piraso, kaya <b>${a}</b> lang.`,
      next: (ok) => { if (ok) addRep(3); typhoonPacks(); }
    });
    show(() => `<div class="news">📻 <b>BALITA:</b> Itinaas na ang <b>Signal No. 2</b> sa Metro Manila. Inaasahang lalakas ang ulan bukas.</div>
      ${say("🧑‍🦱", "Kapitan ng barangay", `${esc(S.name)}, tulungan mo kaming maghanda ng relief packs para sa mga pamilya malapit sa baybay ng Manila Bay.`)}
      ${questionBlock()}`);
  }

  function typhoonPacks() {
    const fams = randInt(12, 25);
    const perFam = { sardinas: 2, canton: 3 };
    let q;
    if (S.grade >= 8) {
      const used = fams * perFam.canton;
      q = {
        prompt: `Bawat relief pack ay may <b>2 sardinas</b> at <b>3 pancit canton</b>. Nakagamit kayo ng <b>${used} pancit canton</b>.
          Ilang pamilya ang nabigyan?`,
        answer: fams,
        explain: (a) => `Bawat pamilya = 3 pancit canton. ${used} ÷ 3 = <b>${a}</b> pamilya.`
      };
    } else {
      q = {
        prompt: `Bawat relief pack ay may <b>2 sardinas</b> at <b>3 pancit canton</b>. May <b>${fams} pamilya</b>.
          Ilang <b>sardinas</b> ang kailangan?`,
        answer: fams * perFam.sardinas,
        explain: (a) => `${fams} pamilya × 2 sardinas = <b>${a}</b> sardinas.`
      };
    }
    ask(Object.assign({
      skill: "divide",
      placeholder: "ilan?",
      format: (n) => String(n),
      tol: 0,
      next: (ok) => {
        if (ok) addRep(3);
        S.typhoonDone = true;
        ui.q = null;
        show(() => `${say("🧑‍🦱", "Kapitan ng barangay", "Maraming salamat! Malaking tulong ka sa barangay.")}
          <div class="tip">💡 Habang may bagyo, mas maraming bibili ng <b>kandila, sardinas at pancit canton</b>. Siguraduhing may stock ka!</div>
          <button class="btn primary" data-act="travel">Pumunta sa palengke →</button>`);
      }
    }, q));
    rerender();
  }

  // Choose where to buy stock and compute the jeepney fare.
  function travelStart() {
    ui = {};
    show(() => {
      const f = D.fare;
      return `<h2>🚌 Saan ka mamimili ngayon?</h2>
        <p class="muted">Pamasahe sa jeep: <b>${peso(f.base)}</b> sa unang ${f.baseKm} km, dagdag na <b>${peso(f.perKm)}</b> bawat km pagkatapos.
        ${S.grade >= 8 ? `Estudyante ka, kaya may <b>${f.studentDiscount * 100}% discount</b>.` : ""}</p>
        <div class="cards">
          ${D.suppliers.map((s) => `<button class="card" data-act="pickSupplier" data-arg="${s.id}">
            <b>${s.name}</b><span>${s.km} km mula Baclaran</span><span class="muted">${s.note}</span></button>`).join("")}
        </div>
        <button class="link" data-act="skipTravel">Hindi muna mamimili ngayon</button>`;
    });
  }

  function pickSupplier(id) {
    const s = D.suppliers.find((x) => x.id === id);
    ui.supplier = s;
    const f = D.fare;
    const regular = fareFor(s.km);
    const student = S.grade >= 8;
    const answer = student ? r2(regular * (1 - f.studentDiscount)) : regular;
    const extraKm = Math.max(0, s.km - f.baseKm);
    ask({
      skill: "fare",
      prompt: `Magkano ang ${student ? "<b>student fare</b>" : "pamasahe"} mo papuntang <b>${s.name}</b> (${s.km} km), isang sakay lang?`,
      answer: answer,
      tol: 0.01,
      explain: () => {
        let lines = extraKm > 0
          ? `${peso(f.base)} + (${s.km} − ${f.baseKm}) km × ${peso(f.perKm)} = ${peso(f.base)} + ${extraKm} × ${peso(f.perKm)} = <b>${peso(regular)}</b>`
          : `${s.km} km ay pasok sa unang ${f.baseKm} km, kaya <b>${peso(regular)}</b> lang.`;
        if (student) lines += `<br>Student discount: ${peso(regular)} × (1 − 0.20) = ${peso(regular)} × 0.80 = <b>${peso(answer)}</b>`;
        return lines;
      },
      next: () => {
        const roundTrip = r2(answer * 2);
        S.cash = r2(S.cash - roundTrip);
        S.today.fare = roundTrip;
        S.fareSpent = r2(S.fareSpent + roundTrip);
        ui.q = null;
        ui.note = `Nagbayad ka ng ${peso(roundTrip)} para sa balikan (round trip).`;
        restockStart();
      }
    });
    show(() => `<h2>🚌 Papuntang ${s.name}</h2>
      ${say("🧔", "Drayber", "Bayad po! Paki-abot na lang.")}
      ${questionBlock()}`);
  }

  // ---------- restock ----------

  function restockStart() {
    ui.cart = {};
    ui.q = null;
    ask({
      skill: "add",
      prompt: "Magkano <b>lahat</b> ng bibilhin mo?",
      button: "Bayaran",
      answer: cartTotal,
      tol: 0,
      check: () => {
        const total = cartTotal();
        if (total === 0) return "Wala ka pang napiling paninda. Pindutin ang + para pumili.";
        if (total > S.cash) return `Kulang ang pera mo (${peso(S.cash)}). Bawasan ang bibilhin.`;
        return null;
      },
      explain: () => cartLines().map((l) => `${l.n} × ${peso(l.price)} = ${peso(l.n * l.price)}`).join("<br>") +
        `<br>Kabuuan: <b>${peso(cartTotal())}</b>`,
      onAnswer: (ok) => {
        const total = cartTotal();
        const bonus = ok && total >= 100 ? 10 : 0;
        S.cash = r2(S.cash - total + bonus);
        cartLines().forEach((l) => {
          const st = S.stock[l.p.id];
          const addQty = l.n * l.p.size;
          const unit = l.price / l.p.size;
          st.avgCost = r2((st.qty * st.avgCost + addQty * unit) / (st.qty + addQty));
          st.qty += addQty;
        });
        ui.boughtToday = cartLines();
        return bonus ? `Tuwang-tuwa ang tindera, may <b>${peso(bonus)} na diskwento</b> ka!` : "";
      },
      next: () => priceStart()
    });
    show(restockScene);
  }

  function cartLines() {
    return D.products
      .filter((p) => ui.cart[p.id] > 0)
      .map((p) => ({ p: p, n: ui.cart[p.id], price: supplierPackPrice(p, ui.supplier) }));
  }

  function cartTotal() {
    return cartLines().reduce((sum, l) => sum + l.n * l.price, 0);
  }

  function restockScene() {
    const locked = !!ui.qDone;
    const s = ui.supplier;
    return `<h2>🛒 Pamimili sa ${s.name}</h2>
      ${ui.note ? `<p class="muted">${ui.note}</p>` : ""}
      ${say("👩‍🦳", "Aling Rosa (tindera)", "Bili na, suki! Kung makukuwenta mo nang tama ang kabuuan, may diskwento ka.")}
      <table class="shop">
        <thead><tr><th>Paninda</th><th>Bawat pack</th><th>Stock mo</th><th>Bibilhin</th></tr></thead>
        <tbody>${D.products.map((p) => {
          const n = ui.cart[p.id] || 0;
          return `<tr${S.day >= D.typhoonDay && D.typhoonItems.includes(p.id) ? ' class="hot"' : ""}>
            <td>${p.emoji} ${p.name}<br><small>${p.pack}</small></td>
            <td>${peso(supplierPackPrice(p, s))}</td>
            <td>${S.stock[p.id].qty}</td>
            <td class="stepper">${locked ? n : `<button class="btn small" data-act="cart" data-arg="${p.id}:-1" aria-label="Bawasan">−</button>
              <span>${n}</span>
              <button class="btn small" data-act="cart" data-arg="${p.id}:1" aria-label="Dagdagan">+</button>`}</td>
          </tr>`;
        }).join("")}</tbody>
      </table>
      <div class="list"><b>📝 Listahan</b><br>${cartLines().map((l) => `${l.n} pack ${l.p.name} × ${peso(l.price)}`).join("<br>") || "<span class='muted'>Wala pa</span>"}</div>
      <p>Pera mo: <b>${peso(S.cash)}</b></p>
      ${questionBlock()}
      ${locked ? "" : `<button class="link" data-act="skipBuying">Hindi na bibili ngayon</button>`}`;
  }

  // ---------- pricing ----------

  function priceStart() {
    ui.q = null;
    show(() => `<h2>🏷️ Patong (Markup)</h2>
      <p>Gaano kalaki ang ipapatong mo sa puhunan ngayong araw?</p>
      <div class="cards">${D.markups.map((m) => `<button class="card" data-act="pickMarkup" data-arg="${m.value}">
        <b>${m.label}</b><span class="muted">${m.note}</span></button>`).join("")}</div>`);
  }

  function pickMarkup(value) {
    S.markup = Number(value);
    const inStock = D.products.filter((p) => S.stock[p.id].qty > 0);
    if (!inStock.length) { serveStart(); return; }
    const pct = Math.round(S.markup * 100);
    const bought = (ui.boughtToday || []).filter((l) => S.stock[l.p.id].qty > 0);
    let q;
    if (S.grade >= 8 && bought.length) {
      const l = pick(bought);
      const unit = r2(l.price / l.p.size);
      const avg = S.stock[l.p.id].avgCost;
      const answer = ceilPeso(avg * (1 + S.markup));
      // Mixed old and new stock changes the average, so only ask the two-step version when it matches today's pack.
      if (Math.abs(avg - unit) < 0.005) {
        q = {
          prompt: `Binili mo ang ${l.p.emoji} ${l.p.name} sa <b>${peso(l.price)}</b> para sa <b>${l.p.size}</b> piraso.
            Kung <b>${pct}%</b> ang patong, magkano ang presyo ng <b>isang piraso</b>? (I-round up sa buong piso.)`,
          answer: answer,
          explain: (a) => `Puhunan bawat piraso: ${peso(l.price)} ÷ ${l.p.size} = ${peso(unit)}<br>
            May patong: ${peso(unit)} × ${1 + S.markup} = ${peso(r2(unit * (1 + S.markup)))} → round up = <b>${peso(a)}</b>`
        };
      }
    }
    if (!q) {
      const p = pick(inStock);
      const avg = S.stock[p.id].avgCost;
      const answer = ceilPeso(avg * (1 + S.markup));
      q = {
        prompt: `Ang puhunan sa isang ${p.emoji} ${p.name} ay <b>${peso(avg)}</b>.
          Kung <b>${pct}%</b> ang patong, magkano ang ibebenta mo? (I-round up sa buong piso.)`,
        answer: answer,
        explain: (a) => `Patong: ${peso(avg)} × ${pct}% = ${peso(r2(avg * S.markup))}<br>
          Presyo: ${peso(avg)} + ${peso(r2(avg * S.markup))} = ${peso(r2(avg * (1 + S.markup)))} → round up = <b>${peso(a)}</b>`
      };
    }
    ask(Object.assign({ skill: "percent", tol: 0, next: () => serveStart() }, q));
    show(() => `<h2>🏷️ Pagpepresyo</h2>${questionBlock()}`);
  }

  // ---------- serving customers ----------

  function serveStart() {
    S.prices = {};
    D.products.forEach((p) => { S.prices[p.id] = sellPrice(p.id); });
    const m = D.markups.find((x) => x.value === S.markup) || D.markups[1];
    let count = Math.round(5 * m.demand * (0.6 + S.rep / 125));
    if (S.day === D.typhoonDay) count += 2;
    if (S.day === 3) count += 1; // Wednesday crowd at Baclaran
    ui = { queue: clamp(count, 3, 10), served: 0 };
    nextCustomer();
  }

  function nextCustomer() {
    if (ui.served >= ui.queue) { ledgerStart(); return; }
    ui.served += 1;
    const c = pick(D.customers);
    const available = D.products.filter((p) => S.stock[p.id].qty > 0);
    ui.cust = c;
    ui.greet = pick(D.greetings);
    ui.q = null;
    ui.tray = [];
    ui.phase = "order";

    if (!available.length) {
      const want = pick(D.products);
      S.today.lost += 1;
      addRep(-2);
      ui.phase = "lost";
      ui.order = [];
      ui.lostItem = want;
      show(serveScene);
      return;
    }

    // Weighted pick so typhoon items sell more during the storm.
    const pool = [];
    available.forEach((p) => {
      const w = isTyphoonTime() && D.typhoonItems.includes(p.id) ? 3 : 1;
      for (let i = 0; i < w; i++) pool.push(p);
    });
    const kinds = randInt(1, Math.min(3, available.length));
    const chosen = [];
    while (chosen.length < kinds) {
      const p = pick(pool);
      if (!chosen.includes(p)) chosen.push(p);
    }
    ui.order = chosen.map((p) => {
      const maxQty = p.id === "itlog" ? 6 : 3;
      return { p: p, n: Math.min(randInt(1, maxQty), S.stock[p.id].qty), price: S.prices[p.id] };
    });
    const total = orderTotal();
    ui.pay = choosePayment(total);

    ask({
      skill: "add",
      prompt: "Magkano lahat?",
      answer: total,
      tol: 0,
      explain: () => ui.order.map((o) => `${o.n} × ${peso(o.price)} = ${peso(o.n * o.price)}`).join("<br>") + `<br>Kabuuan: <b>${peso(total)}</b>`,
      onAnswer: (ok) => { if (!ok) addRep(-2); return ok ? "" : `${esc(c.name)}: "${peso(total)} po dapat 'yan!"`; },
      next: () => { ui.q = null; ui.phase = "change"; rerender(); }
    });
    show(serveScene);
  }

  function orderTotal() {
    return ui.order.reduce((s, o) => s + o.n * o.price, 0);
  }

  function choosePayment(total) {
    const bills = [20, 50, 100, 200, 500, 1000];
    if (Math.random() < 0.1 || total > 1000) return total;
    let i = bills.findIndex((b) => b >= total);
    if (i < 0) i = bills.length - 1;
    if (Math.random() < 0.25 && i < bills.length - 1) i += 1;
    let pay = bills[i];
    if (Math.random() < 0.3 && total % 5 !== 0) pay += total % 5; // "May barya ako" for rounder change
    return pay;
  }

  function trayTotal() { return ui.tray.reduce((a, b) => a + b, 0); }

  function orderText() {
    return ui.order.map((o) => `${o.n} ${o.p.name}`).join(", ");
  }

  function priceBoard() {
    return `<aside class="board"><b>Presyo</b>${D.products.map((p) =>
      `<div class="${S.stock[p.id].qty ? "" : "out"}"><span>${p.emoji} ${p.name}</span><span>${peso(S.prices[p.id])}</span><small>${S.stock[p.id].qty} natitira</small></div>`).join("")}</aside>`;
  }

  function serveScene() {
    const c = ui.cust;
    let body;
    if (ui.phase === "lost") {
      body = `${say(c.face, c.name, `May ${ui.lostItem.name} po kayo? Wala? Sige, sa iba na lang ako.`)}
        <p class="bad-text">Nawalan ka ng benta. Kailangan mong mamili ng paninda!</p>
        <button class="btn primary" data-act="nextCustomer">Susunod →</button>`;
    } else if (ui.phase === "order") {
      body = `${say(c.face, c.name, `${ui.greet} <b>${orderText()}</b>.`)}${questionBlock()}`;
    } else if (ui.phase === "change") {
      const total = orderTotal();
      body = `${say(c.face, c.name, ui.pay === total ? `Heto po, ${peso(ui.pay)}. Sakto!` : `Heto po ang bayad ko: <b>${peso(ui.pay)}</b>.`)}
        <p>Kabuuan: <b>${peso(total)}</b> · Bayad: <b>${peso(ui.pay)}</b></p>
        <p>Ibigay ang sukli. Pindutin ang pera:</p>
        <div class="money">${D.denominations.map((d) => `<button class="coin ${d >= 20 && d !== 20 ? "bill" : ""}" data-act="tray" data-arg="${d}">₱${d}</button>`).join("")}</div>
        <div class="tray" aria-live="polite">Sukli: ${ui.tray.length ? ui.tray.map((d) => `<span class="chip">₱${d}</span>`).join("") : "<span class='muted'>(wala pa)</span>"}
          <b>= ${peso(trayTotal())}</b></div>
        <div class="row">
          <button class="btn" data-act="trayUndo">↶ Bawi</button>
          <button class="btn primary" data-act="giveChange">Ibigay ang sukli</button>
        </div>`;
    } else {
      body = `${say(c.face, c.name, ui.reaction)}
        <div class="feedback ${ui.changeOk ? "good" : "bad"}"><p>${ui.changeNote}</p></div>
        <button class="btn primary" data-act="nextCustomer">Susunod →</button>`;
    }
    return `<div class="shopfront"><div class="main">
        <h2>🙋 Suki ${ui.served} ng ${ui.queue}</h2>${body}</div>${priceBoard()}</div>`;
  }

  function giveChange() {
    const total = orderTotal();
    const need = ui.pay - total;
    const given = trayTotal();
    const c = ui.cust;
    const ok = given === need;
    record("change", ok);
    S.cash = r2(S.cash + total);
    S.today.sales += total;
    ui.order.forEach((o) => {
      const st = S.stock[o.p.id];
      st.qty -= o.n;
      S.today.cogs = r2(S.today.cogs + o.n * st.avgCost);
    });
    S.today.served += 1;
    if (ok) {
      addRep(2);
      ui.reaction = pick(["Salamat po!", "Ang bilis mo, ah! Salamat.", "Babalik ako bukas!", "Salamat, suki!"]);
      ui.changeNote = `✅ Tamang sukli: ${peso(ui.pay)} − ${peso(total)} = ${peso(need)}`;
    } else if (given > need) {
      const extra = given - need;
      if (c.honest) {
        ui.reaction = `Naku, sobra po ng ${peso(extra)} ang sukli. Ibabalik ko po.`;
        ui.changeNote = `❌ Sobra ang sukli mo. Buti na lang tapat si ${esc(c.name)}! Dapat: ${peso(ui.pay)} − ${peso(total)} = ${peso(need)}`;
      } else {
        S.cash = r2(S.cash - extra);
        ui.reaction = "Salamat! 😏";
        ui.changeNote = `❌ Sobra ang sukli mo ng ${peso(extra)}, at hindi na ito ibinalik. Lugi ka! Dapat: ${peso(ui.pay)} − ${peso(total)} = ${peso(need)}`;
      }
    } else {
      addRep(-3);
      ui.reaction = `Kulang po ng ${peso(need - given)} ang sukli ko!`;
      ui.changeNote = `❌ Kulang ang sukli. Dapat: ${peso(ui.pay)} − ${peso(total)} = ${peso(need)}`;
    }
    ui.changeOk = ok;
    ui.phase = "done";
    rerender();
  }

  // ---------- end of day ----------

  function ledgerStart() {
    const t = S.today;
    const profit = r2(t.sales - t.cogs);
    ui = {};
    ask({
      skill: "profit",
      prompt: `Benta ngayong araw: <b>${peso(t.sales)}</b>. Puhunan ng mga nabenta: <b>${peso(t.cogs)}</b>.<br>Magkano ang <b>tubo</b>?`,
      answer: profit,
      tol: 0.01,
      explain: (a) => `Tubo = Benta − Puhunan = ${peso(t.sales)} − ${peso(t.cogs)} = <b>${peso(a)}</b>`,
      next: () => {
        if (S.grade >= 8 && t.cogs > 0) ledgerPercent(profit);
        else ledgerSummary();
      }
    });
    show(() => `<h2>📒 Listahan sa gabi</h2>
      <p>Nakapagsilbi ka ng <b>${t.served}</b> suki${t.lost ? ` at may <b>${t.lost}</b> umalis dahil walang paninda` : ""}.</p>
      ${questionBlock()}`);
  }

  function ledgerPercent(profit) {
    const t = S.today;
    const answer = Math.round((profit / t.cogs) * 100);
    ask({
      skill: "percent",
      prompt: `Ang tubo mo ay <b>${peso(profit)}</b> at ang puhunan ay <b>${peso(t.cogs)}</b>. Ilang <b>porsyento</b> ng puhunan ang tubo mo? (I-round sa buong numero.)`,
      placeholder: "%",
      format: (n) => `${n}%`,
      answer: answer,
      tol: 1,
      explain: (a) => `${peso(profit)} ÷ ${peso(t.cogs)} × 100 = ${r2((profit / t.cogs) * 100)}% ≈ <b>${a}%</b>`,
      next: () => ledgerSummary()
    });
    rerender();
  }

  function ledgerSummary() {
    const t = S.today;
    const net = r2(t.sales - t.cogs - t.fare);
    ui.q = null;
    show(() => `<h2>📒 Buod ng Araw ${S.day}</h2>
      <table class="summary">
        <tr><td>Benta</td><td>${peso(t.sales)}</td></tr>
        <tr><td>Puhunan ng nabenta</td><td>− ${peso(t.cogs)}</td></tr>
        <tr><td>Pamasahe</td><td>− ${peso(t.fare)}</td></tr>
        <tr class="total"><td>Netong kita</td><td>${peso(net)}</td></tr>
      </table>
      <p>Pera mo ngayon: <b>${peso(S.cash)}</b></p>
      ${S.day === D.typhoonDay - 1 ? `<div class="tip">📻 May balita: may bagyong papalapit. Maghanda ng kandila, sardinas at pancit canton!</div>` : ""}
      <button class="btn primary" data-act="endDay">${S.day >= D.days ? "Tingnan ang report card →" : `Matulog at simulan ang Araw ${S.day + 1} →`}</button>`);
  }

  function endDay() {
    S.day += 1;
    if (S.day > D.days) { reportScene(); return; }
    startDay();
  }

  // ---------- report card ----------

  function reportScene() {
    const stockValue = r2(D.products.reduce((s, p) => s + S.stock[p.id].qty * S.stock[p.id].avgCost, 0));
    const worth = r2(S.cash + stockValue);
    const gain = r2(worth - D.startCash);
    let right = 0, total = 0;
    Object.values(S.stats).forEach((s) => { right += s.right; total += s.total; });
    const acc = total ? Math.round((right / total) * 100) : 0;
    const score = Math.max(0, Math.round(acc * 10 + gain + S.rep * 5));
    const title = acc >= 90 ? "Negosyanteng Henyo 🏆" : acc >= 75 ? "Maaasahang Tindero 🥇" : acc >= 50 ? "Masipag na Katulong 👍" : "Nag-aaral pa 📚";
    try {
      const best = JSON.parse(localStorage.getItem(BEST_KEY) || "null");
      if (!best || score > best.score) localStorage.setItem(BEST_KEY, JSON.stringify({ score: score, name: S.name }));
    } catch (e) { /* ignore */ }
    clearSave();
    const rows = Object.keys(SKILLS).filter((k) => S.stats[k]).map((k) => {
      const s = S.stats[k];
      const pct = Math.round((s.right / s.total) * 100);
      return `<tr><td>${SKILLS[k]}</td><td>${s.right}/${s.total}</td><td><div class="bar"><i style="width:${pct}%"></i></div>${pct}%</td></tr>`;
    }).join("");
    const final = S;
    ui = {};
    ui.scene = () => `<h2>📜 Report card ni ${esc(final.name)}</h2>
      <p class="rank">${title}</p>
      ${say("👩", "Winnie", gain >= 0
        ? `Nakabalik na ako! Wow, tumubo tayo ng <b>${peso(gain)}</b>. Salamat, ${esc(final.name)}!`
        : `Nakabalik na ako. Lugi tayo ng <b>${peso(-gain)}</b>, pero okay lang. Matututo ka pa!`)}
      <table class="summary">
        <tr><td>Pera</td><td>${peso(final.cash)}</td></tr>
        <tr><td>Halaga ng natirang paninda</td><td>${peso(stockValue)}</td></tr>
        <tr class="total"><td>Kabuuang halaga (vs ${peso(D.startCash)} na puhunan)</td><td>${peso(worth)}</td></tr>
        <tr><td>Tiwala ng suki</td><td>${stars(final.rep)}</td></tr>
        <tr><td>Katumpakan (accuracy)</td><td>${acc}%</td></tr>
        <tr class="total"><td>Score</td><td>${score}</td></tr>
      </table>
      <h3>Mga kasanayan (Skills)</h3>
      <table class="skills"><thead><tr><th>Kasanayan</th><th>Tama</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      <p class="muted">I-screenshot ito at ipakita sa iyong guro.</p>
      <button class="btn primary big" data-act="title">Maglaro ulit</button>`;
    S = null;
    rerender();
  }

  // ---------- input handling ----------

  const ACT = {
    title: () => titleScreen(),
    help: () => helpScreen(),
    continue: () => { S = load(); if (S) startDay(); else titleScreen(); },
    startDay: () => startDay(),
    travel: () => travelStart(),
    skipTravel: () => {
      ui.supplier = null;
      ui.boughtToday = [];
      priceStart();
    },
    skipBuying: () => {
      ui.boughtToday = [];
      priceStart();
    },
    pickSupplier: (id) => pickSupplier(id),
    cart: (arg) => {
      const parts = arg.split(":");
      const id = parts[0];
      ui.cart[id] = Math.max(0, (ui.cart[id] || 0) + Number(parts[1]));
      ui.qError = null;
      rerender();
    },
    pickMarkup: (v) => pickMarkup(v),
    nextCustomer: () => nextCustomer(),
    tray: (d) => { ui.tray.push(Number(d)); rerender(); },
    trayUndo: () => { ui.tray.pop(); rerender(); },
    giveChange: () => giveChange(),
    qnext: () => {
      const q = ui.q;
      const ok = ui.qDone && ui.qDone.correct;
      q.next(ok);
    },
    endDay: () => endDay()
  };

  const SUBMIT = {
    start: (form) => {
      const data = new FormData(form);
      newGame(String(data.get("name") || "").trim(), Number(data.get("grade")));
    },
    answer: (form) => {
      const q = ui.q;
      const given = parseNum(form.ans.value);
      if (given === null) {
        ui.qError = "Maglagay ng numero.";
        rerender();
        return;
      }
      if (q.check) {
        const problem = q.check();
        if (problem) { ui.qError = problem; rerender(); return; }
      }
      const answer = typeof q.answer === "function" ? q.answer() : q.answer;
      const correct = Math.abs(given - answer) <= (q.tol || 0) + 1e-9;
      record(q.skill, correct);
      const extra = q.onAnswer ? q.onAnswer(correct) : "";
      ui.qDone = { correct: correct, given: form.ans.value, answer: answer, extra: extra };
      rerender();
    }
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    e.preventDefault();
    const fn = ACT[el.dataset.act];
    if (fn) fn(el.dataset.arg);
  });

  document.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-submit]");
    if (!form) return;
    e.preventDefault();
    const fn = SUBMIT[form.dataset.submit];
    if (fn) fn(form);
  });

  // Test hook for automated playthroughs; only exists when the page is opened with #debug.
  if (location.hash === "#debug") {
    window.__tnw = {
      answer: () => ui.q && (typeof ui.q.answer === "function" ? ui.q.answer() : ui.q.answer),
      change: () => ui.pay - orderTotal(),
      state: () => S
    };
  }

  titleScreen();
})();
