// Sosick Outfit Match: pick a vibe and budget, get a full fit, lock what you
// love, shuffle the rest, then order it or share it. No prices are invented:
// the budget travels with the order and the team quotes within it.
(function () {
  "use strict";
  var S = window.SOSICK;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function waLink(text, toUs) { return "https://wa.me/" + (toUs ? S.whatsapp : "") + "?text=" + encodeURIComponent(text); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  // Each piece is [name, category id]. Category ids match data.js so pieces
  // can be matched to live Verified Plugs.
  var SLOTS = [
    { key: "top", label: "Top", emoji: "👕" },
    { key: "bottom", label: "Bottom", emoji: "👖" },
    { key: "shoes", label: "Shoes", emoji: "👟" },
    { key: "extra", label: "Extra", emoji: "✨" }
  ];
  var VIBES = [
    { id: "campus", name: "Campus Drip", emoji: "🎓", tile: "#3B6FE0", line: "Lecture at 8, hangout at 4.",
      top: [["Oversized vintage tee", "tops"], ["Graphic band tee", "tops"], ["Boxy hoodie", "tops"], ["Flannel shirt", "tops"]],
      bottom: [["Baggy light-wash jeans", "denim"], ["Black cargo pants", "denim"], ["Track pants", "denim"], ["Denim jorts", "denim"]],
      shoes: [["White AF1s", "kicks"], ["Chunky dad sneakers", "kicks"], ["Converse high-tops", "kicks"]],
      extra: [["Bucket hat", "bags"], ["Crossbody bag", "bags"], ["Silver chain", "bags"], ["Canvas tote", "bags"]] },
    { id: "sunday", name: "Sunday Best", emoji: "⛪", tile: "#8B5CF6", line: "Clean enough for church, sharp enough for lunch after.",
      top: [["Crisp white shirt", "tops"], ["Knit polo", "tops"], ["Satin blouse", "tops"], ["Light blazer", "tops"]],
      bottom: [["Pleated trousers", "denim"], ["A-line midi skirt", "dresses"], ["Tailored chinos", "denim"], ["Flowy maxi dress", "dresses"]],
      shoes: [["Leather loafers", "kicks"], ["Block heels", "kicks"], ["Clean derbies", "kicks"], ["Ballet flats", "kicks"]],
      extra: [["Leather belt", "bags"], ["Vintage watch", "bags"], ["Pearl studs", "bags"], ["Structured handbag", "bags"]] },
    { id: "westlands", name: "Westlands Saturday", emoji: "🍸", tile: "#D6458F", line: "Rooftop, then wherever the night goes.",
      top: [["Cropped leather jacket", "tops"], ["Silk shirt", "tops"], ["Ribbed tank", "tops"], ["Mesh top", "tops"]],
      bottom: [["Wide-leg trousers", "denim"], ["Mini skirt", "dresses"], ["Straight black jeans", "denim"]],
      shoes: [["Chunky boots", "kicks"], ["Strappy heels", "kicks"], ["Retro runners", "kicks"]],
      extra: [["Rimless shades", "bags"], ["Mini bag", "bags"], ["Layered chains", "bags"], ["A good perfume", "beauty"]] },
    { id: "date", name: "Date Night", emoji: "🌹", tile: "#C0362C", line: "Effort that looks effortless.",
      top: [["Fitted knit", "tops"], ["Satin shirt", "tops"], ["Little black top", "tops"]],
      bottom: [["Tailored trousers", "denim"], ["Slip skirt", "dresses"], ["Dark-wash jeans", "denim"], ["Wrap dress", "dresses"]],
      shoes: [["Chelsea boots", "kicks"], ["Heels", "kicks"], ["Clean white sneakers", "kicks"]],
      extra: [["Signature perfume", "beauty"], ["Thin gold chain", "bags"], ["Small clutch", "bags"]] },
    { id: "office", name: "Office Smart", emoji: "💼", tile: "#111110", line: "Monday-ready without looking stiff.",
      top: [["Oxford shirt", "tops"], ["Turtleneck", "tops"], ["Unstructured blazer", "tops"]],
      bottom: [["Tailored trousers", "denim"], ["Pencil skirt", "dresses"], ["Slim chinos", "denim"]],
      shoes: [["Loafers", "kicks"], ["Oxfords", "kicks"], ["Pointed flats", "kicks"]],
      extra: [["Laptop bag", "bags"], ["Classic watch", "bags"], ["Leather belt", "bags"]] },
    { id: "vintage", name: "Gikomba Vintage", emoji: "🧥", tile: "#F28C28", line: "One-of-one pieces nobody else has.",
      top: [["90s windbreaker", "tops"], ["Denim jacket", "tops"], ["Knit sweater vest", "tops"], ["Retro football jersey", "tops"]],
      bottom: [["Mom jeans", "denim"], ["Corduroy trousers", "denim"], ["Pleated skirt", "dresses"]],
      shoes: [["Timbs", "kicks"], ["Retro runners", "kicks"], ["Leather boots", "kicks"]],
      extra: [["Beanie", "bags"], ["Vintage watch", "bags"], ["Round shades", "bags"]] },
    { id: "gym", name: "Gym Rat", emoji: "🏋️", tile: "#22A65A", line: "Train hard, look like you meant it.",
      top: [["Oversized gym tee", "tops"], ["Cropped hoodie", "tops"], ["Compression top", "tops"]],
      bottom: [["Joggers", "denim"], ["Bike shorts", "denim"], ["Mesh shorts", "denim"]],
      shoes: [["Training shoes", "kicks"], ["Retro runners", "kicks"]],
      extra: [["Duffel bag", "bags"], ["Cap", "bags"], ["Shaker bottle", "home"]] },
    { id: "coast", name: "Mombasa Trip", emoji: "🌴", tile: "#0EA5A4", line: "Coast heat, holiday energy.",
      top: [["Linen shirt", "tops"], ["Printed holiday shirt", "tops"], ["Kitenge top", "tops"], ["Tank top", "tops"]],
      bottom: [["Linen shorts", "denim"], ["Flowy skirt", "dresses"], ["Denim jorts", "denim"]],
      shoes: [["Sandals", "kicks"], ["Slides", "kicks"], ["Canvas sneakers", "kicks"]],
      extra: [["Straw hat", "bags"], ["Sunglasses", "bags"], ["Beach tote", "bags"]] }
  ];
  var BUDGETS = [
    { id: "low", label: "Under KES 2,000" },
    { id: "mid", label: "KES 2,000 – 5,000" },
    { id: "high", label: "KES 5,000+" },
    { id: "any", label: "Surprise me" }
  ];
  var ADJ = ["Main Character", "Certified", "Silent Flex", "No Cap", "Soft Life", "Matatu", "Rooftop", "Campus Legend", "Clean", "Unbothered", "Big Budget", "Low-Key"];
  var NOUN = ["Energy", "Era", "Drip", "Moment", "Starter Pack", "Season", "Mode", "Agenda"];

  var state = { vibe: null, budget: "any", picks: {}, locked: {}, name: "" };
  var plugs = S.plugs || [];

  function vibe() { return VIBES.filter(function (v) { return v.id === state.vibe; })[0]; }
  function plugFor(piece) {
    var word = piece[0].toLowerCase().split(" ").slice(-1)[0];
    var inCat = plugs.filter(function (p) { return p.category === piece[1]; });
    return inCat.filter(function (p) { return (p.sells || "").toLowerCase().indexOf(word) !== -1; })[0] || inCat[0] || null;
  }

  /* ---------- step 1 & 2: choosing ---------- */
  $("vibeGrid").innerHTML = VIBES.map(function (v) {
    return '<button type="button" class="vibe" data-vibe="' + v.id + '" style="--tile:' + v.tile + '" aria-pressed="false">' +
      '<span class="vibe-emoji" aria-hidden="true">' + v.emoji + '</span><span class="vibe-name">' + esc(v.name) + "</span>" +
      '<span class="vibe-line">' + esc(v.line) + "</span></button>";
  }).join("");
  $("budgetChips").innerHTML = BUDGETS.map(function (b) {
    return '<label class="chip"><input type="radio" name="budget" value="' + b.id + '"' + (b.id === "any" ? " checked" : "") + "><span>" + esc(b.label) + "</span></label>";
  }).join("");

  function chooseVibe(id) {
    state.vibe = id;
    document.querySelectorAll(".vibe").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-vibe") === id)); });
    $("matchBtn").disabled = false;
    $("matchHint").textContent = vibe().emoji + " " + vibe().name + " it is.";
  }
  $("vibeGrid").addEventListener("click", function (e) {
    var b = e.target.closest(".vibe"); if (!b) return;
    chooseVibe(b.getAttribute("data-vibe"));
    state.locked = {};
  });
  $("budgetChips").addEventListener("change", function (e) { state.budget = e.target.value; });

  /* ---------- the fit ---------- */
  function rollSlot(key) {
    var pool = vibe()[key], cur = state.picks[key], next;
    do { next = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && next === cur);
    state.picks[key] = next;
  }
  function piece(key) { return vibe()[key][state.picks[key]]; }

  function card(slot) {
    var p = piece(slot.key), plug = plugFor(p), locked = !!state.locked[slot.key];
    return '<article class="fit-card' + (locked ? " is-locked" : "") + '" data-slot="' + slot.key + '">' +
      '<div class="fit-card-top"><span class="fit-slot">' + slot.emoji + " " + slot.label + "</span>" +
      '<span class="fit-tools"><button type="button" class="fit-tool" data-act="lock" aria-pressed="' + locked + '" title="' + (locked ? "Unlock" : "Lock this piece") + '">' + (locked ? "🔒" : "🔓") + "</button>" +
      '<button type="button" class="fit-tool" data-act="swap" title="Swap this piece"' + (locked ? " disabled" : "") + ">🔄</button></span></div>" +
      '<p class="fit-piece">' + esc(p[0]) + "</p>" +
      (plug ? '<p class="fit-plug">✓ From <b>' + esc(plug.name) + "</b>" + (plug.area ? " · " + esc(plug.area) : "") + "</p>"
            : '<p class="fit-plug fit-plug-hunt">We\'ll hunt this one</p>') +
      "</article>";
  }
  function render(spin) {
    var v = vibe();
    $("fitVibe").textContent = v.emoji + " " + v.name;
    $("fitName").textContent = state.name;
    $("fitCards").innerHTML = SLOTS.map(card).join("");
    $("fitResult").hidden = false;
    $("fitResult").style.setProperty("--tile", v.tile);
    writeUrl();
    if (spin) spinCards(spin);
  }

  // Slot-machine effect: unlocked cards flick through pieces before landing.
  function spinCards(keys) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    keys.forEach(function (key, i) {
      var el = document.querySelector('.fit-card[data-slot="' + key + '"] .fit-piece');
      if (!el) return;
      var final = el.textContent, pool = vibe()[key], n = 0;
      el.parentNode.classList.add("is-spinning");
      var t = setInterval(function () {
        el.textContent = pool[n++ % pool.length][0];
        if (n > 7 + i * 3) { clearInterval(t); el.textContent = final; el.parentNode.classList.remove("is-spinning"); el.parentNode.classList.add("is-landed"); }
      }, 70);
    });
  }

  function newName() { state.name = pick(ADJ) + " " + pick(NOUN); }
  function matchMe() {
    if (!state.vibe) return;
    var rolled = SLOTS.map(function (s) { return s.key; }).filter(function (k) { return !state.locked[k]; });
    rolled.forEach(rollSlot);
    if (rolled.length) newName();
    render(rolled);
    $("fitResult").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $("matchBtn").addEventListener("click", matchMe);
  $("shuffleBtn").addEventListener("click", function () {
    var rolled = SLOTS.map(function (s) { return s.key; }).filter(function (k) { return !state.locked[k]; });
    if (!rolled.length) { $("fitMsg").textContent = "Everything's locked. Unlock a piece to shuffle it."; return; }
    $("fitMsg").textContent = "";
    rolled.forEach(rollSlot); newName(); render(rolled);
  });
  $("fitCards").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b) return;
    var key = b.closest(".fit-card").getAttribute("data-slot");
    if (b.getAttribute("data-act") === "lock") { state.locked[key] = !state.locked[key]; render(); }
    else { rollSlot(key); render([key]); }
  });

  /* ---------- order + share ---------- */
  function sizes() {
    var parts = [["Top", $("szTop").value], ["Waist", $("szWaist").value], ["Shoes", $("szShoe").value]]
      .filter(function (p) { return p[1].trim(); }).map(function (p) { return p[0] + " " + p[1].trim(); });
    return parts.join(", ");
  }
  function budgetLabel() { return BUDGETS.filter(function (b) { return b.id === state.budget; })[0].label; }
  function summary() {
    var list = SLOTS.map(function (s) { var p = piece(s.key), plug = plugFor(p); return p[0] + (plug ? " (" + plug.name + ")" : ""); });
    var sz = sizes();
    return "Outfit Match – " + vibe().name + ": " + list.join(" + ") + ". Budget: " + budgetLabel() + "." + (sz ? " Sizes: " + sz + "." : "");
  }
  function shareUrl() {
    return location.origin + location.pathname + "?vibe=" + state.vibe + "&fit=" + SLOTS.map(function (s) { return state.picks[s.key]; }).join(".") + "&name=" + encodeURIComponent(state.name);
  }
  function writeUrl() { try { history.replaceState(null, "", shareUrl().replace(location.origin, "")); } catch (e) {} }

  $("orderFit").addEventListener("click", function () {
    location.href = "./?item=" + encodeURIComponent(summary()) + "#order";
  });
  $("askFit").addEventListener("click", function () {
    window.open(waLink("Hi Sosick! I matched this fit on your site and want it:\n" + summary() + "\n" + shareUrl(), true), "_blank", "noopener");
  });
  $("shareFit").addEventListener("click", function () {
    var text = "My Sosick fit: " + state.name + " " + vibe().emoji + "\n" +
      SLOTS.map(function (s) { return s.emoji + " " + piece(s.key)[0]; }).join("\n") +
      "\nBuild yours 👉 " + shareUrl();
    window.open(waLink(text, false), "_blank", "noopener");
  });

  /* ---------- open a shared fit ---------- */
  (function () {
    var q = new URLSearchParams(location.search), v = q.get("vibe"), fit = (q.get("fit") || "").split(".");
    if (!v || !VIBES.some(function (x) { return x.id === v; })) return;
    chooseVibe(v);
    var ok = fit.length === SLOTS.length && SLOTS.every(function (s, i) { var n = +fit[i]; return n >= 0 && n < vibe()[s.key].length && fit[i] !== ""; });
    if (!ok) return;
    SLOTS.forEach(function (s, i) { state.picks[s.key] = +fit[i]; });
    state.name = (q.get("name") || "").slice(0, 40) || (pick(ADJ) + " " + pick(NOUN));
    render();
  })();

  /* ---------- live plugs ---------- */
  if (S.supabaseUrl) {
    fetch(S.supabaseUrl + "/rest/v1/plugs?select=name,category,area,sells,level&status=eq.live", {
      headers: { apikey: S.supabaseKey, Authorization: "Bearer " + S.supabaseKey }
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) { if (rows) { plugs = rows; if (!$("fitResult").hidden) render(); } })
      .catch(function () {});
  }
  document.querySelectorAll(".wa-link").forEach(function (a) { a.href = waLink(a.getAttribute("data-wa") || "Hi Sosick", true); });
  var y = $("year"); if (y) y.textContent = new Date().getFullYear();
})();
