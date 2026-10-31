// Sosick: page behaviour (order slip, plugs, areas).
// Shared helpers hang off window.Sosick so Sosi (sosi.js) can reuse them.
(function () {
  "use strict";
  var S = window.SOSICK;
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function waLink(text) {
    return "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(text);
  }

  // Kenyan mobile: 07XXXXXXXX, 01XXXXXXXX, +2547..., 2541...
  function normalisePhone(raw) {
    var p = String(raw || "").replace(/[\s\-()]/g, "");
    if (/^\+?254[17]\d{8}$/.test(p)) return "0" + p.replace(/^\+?254/, "");
    if (/^0[17]\d{8}$/.test(p)) return p;
    return null;
  }

  function newCode() {
    return "SOS-" + String(Math.floor(1000 + Math.random() * 9000));
  }

  var allPlaces = S.campuses.concat(S.areas);
  function findPlace(text) {
    var t = String(text || "").toLowerCase();
    if (!t) return null;
    for (var i = 0; i < allPlaces.length; i++) {
      var p = allPlaces[i].toLowerCase();
      var short = p.replace(/\s*\(.*\)/, "");
      if (t.indexOf(short) !== -1) return allPlaces[i];
      var abbr = (allPlaces[i].match(/\(([^)]+)\)/) || [])[1];
      if (abbr && new RegExp("\\b" + abbr.toLowerCase() + "\\b").test(t)) return allPlaces[i];
    }
    return null;
  }

  function buildOrderMessage(o) {
    var lines = [
      "🟡 SOSICK ORDER " + o.code,
      "",
      "Item: " + o.item,
      "Pick up from: " + (o.pickup || "Not sure. Please find it for me"),
      "Deliver to: " + o.dropArea + (o.landmark ? " (" + o.landmark + ")" : ""),
    ];
    if (o.pin) lines.push("My location pin: " + o.pin);
    lines.push(
      "Name: " + o.name,
      "Phone: " + o.phone,
      "When: " + o.when,
      "Pay: " + o.pay
    );
    return lines.join("\n");
  }

  /* ---------------- order slip ---------------- */
  var form = $("orderForm");
  var code = newCode();
  var pin = "";
  $("orderCode").textContent = code;

  var feeText = S.deliveryFeeFrom ? "from KES " + Number(S.deliveryFeeFrom).toLocaleString("en-KE") : "confirmed on WhatsApp";
  $("feeLine").innerHTML = "Delivery fee: <strong>" + esc(feeText) + "</strong> before pickup." + (S.extraFees ? "" : " No extra charges.");
  if (S.extraFees) $("comradeSticker").textContent = "Now delivering across Nairobi";

  $("placesList").innerHTML = allPlaces.map(function (p) {
    return '<option value="' + esc(p) + '"></option>';
  }).join("");

  $("locBtn").addEventListener("click", function () {
    var st = $("locStatus");
    st.className = "loc-status";
    if (!navigator.geolocation) { st.textContent = "Your browser can't share location. Type a landmark instead."; return; }
    st.textContent = "Finding you…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude.toFixed(5), lng = pos.coords.longitude.toFixed(5);
      pin = "https://maps.google.com/?q=" + lat + "," + lng;
      st.textContent = "✓ Location pinned. The rider gets a map link.";
      st.className = "loc-status ok";
    }, function () {
      st.textContent = "Location blocked. No worries, just type a landmark.";
    }, { enableHighAccuracy: true, timeout: 12000 });
  });

  function radio(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("formError");
    var checks = [
      ["item", "Tell us what you need."],
      ["dropArea", "Where should we deliver it?"],
      ["custName", "Add your name so the rider knows who to ask for."],
    ];
    form.querySelectorAll(".is-bad").forEach(function (el) { el.classList.remove("is-bad"); });
    for (var i = 0; i < checks.length; i++) {
      var el = $(checks[i][0]);
      if (!el.value.trim()) { return fail(el, checks[i][1]); }
    }
    var phone = normalisePhone($("custPhone").value);
    if (!phone) return fail($("custPhone"), "That phone number doesn't look right. Use 07XX XXX XXX or 01XX XXX XXX.");

    err.hidden = true;
    var order = {
      code: code,
      item: $("item").value.trim(),
      pickup: $("pickup").value.trim(),
      dropArea: $("dropArea").value.trim(),
      landmark: $("landmark").value.trim(),
      pin: pin,
      name: $("custName").value.trim(),
      phone: phone,
      when: radio("when"),
      pay: radio("pay"),
    };
    var msg = buildOrderMessage(order);
    var link = waLink(msg);
    $("sentMsg").textContent = msg;
    $("sentWa").href = link;
    form.hidden = true;
    $("sentCard").hidden = false;
    window.open(link, "_blank", "noopener");
    saveOrderOnline(order);
    rememberOrder(order);

    function fail(el, text) {
      el.classList.add("is-bad");
      el.focus();
      err.textContent = text;
      err.hidden = false;
    }
  });

  $("copyMsg").addEventListener("click", function () {
    var btn = this, text = $("sentMsg").textContent;
    var done = function () { btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = "Copy message"; }, 1800); };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(done, selectMsg);
    } else selectMsg();
    function selectMsg() {
      var r = document.createRange(); r.selectNodeContents($("sentMsg"));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  });

  $("newOrder").addEventListener("click", function () {
    form.reset(); pin = "";
    $("locStatus").textContent = "";
    code = newCode(); $("orderCode").textContent = code;
    $("sentCard").hidden = true; form.hidden = false;
    $("item").focus();
  });

  function fillOrderForm(o) {
    if (o.item) $("item").value = o.item;
    if (o.pickup) $("pickup").value = o.pickup;
    if (o.dropArea) $("dropArea").value = o.dropArea;
    if (o.landmark) $("landmark").value = o.landmark;
    if (o.name) $("custName").value = o.name;
    if (o.phone) $("custPhone").value = o.phone;
    $("sentCard").hidden = true; form.hidden = false;
    document.getElementById("order").scrollIntoView({ behavior: "smooth" });
  }

  /* ---------------- Supabase (public key, read-only except new orders) ---------------- */
  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ apikey: S.supabaseKey, Authorization: "Bearer " + S.supabaseKey }, opts.headers || {});
    return fetch(S.supabaseUrl + "/rest/v1/" + path, opts);
  }

  // A copy of each website order goes straight into the admin's order list.
  // WhatsApp stays the main channel, so a failure here is silent.
  function saveOrderOnline(o) {
    if (!S.supabaseUrl) return;
    try {
      api("orders", {
        method: "POST", keepalive: true,
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          code: o.code, customer: o.name.slice(0, 80), phone: o.phone, item: o.item.slice(0, 500),
          pickup: o.pickup.slice(0, 200), drop_to: (o.dropArea + (o.landmark ? " (" + o.landmark + ")" : "")).slice(0, 300),
          pin: o.pin, when_wanted: o.when, pay: o.pay, source: "website"
        })
      }).catch(function () {});
    } catch (e) {}
  }

  function applyCharges(rows) {
    S.extraFees = rows.some(function (c) { return c.is_on && c.id !== "base"; });
    var feeText = S.deliveryFeeFrom ? "from KES " + Number(S.deliveryFeeFrom).toLocaleString("en-KE") : "confirmed on WhatsApp";
    $("feeLine").innerHTML = "Delivery fee: <strong>" + esc(feeText) + "</strong> before pickup." + (S.extraFees ? "" : " No extra charges.");
    $("comradeSticker").textContent = S.extraFees ? "Now delivering across Nairobi" : "Comrade launch · just delivery, no extra charges";
  }

  function loadLive() {
    if (!S.supabaseUrl) return;
    api("plugs?select=name,category,area,sells,link,level,tested&status=eq.live&order=tested.desc.nullslast")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) { if (rows) { S.plugs = rows; renderPlugs(); } })
      .catch(function () {});
    api("charges?select=id,is_on&seller=eq.false")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) { if (rows) applyCharges(rows); })
      .catch(function () {});
  }

  /* ---------------- order tracker ---------------- */
  var STOPS = ["new", "picked", "way", "done"];
  var STATUS_TEXT = {
    new: ["Order received", "We've got it. We'll confirm the price with you on WhatsApp, then a rider heads out."],
    picked: ["Picked up", "Your rider has it and is getting ready to move."],
    way: ["On the way", "Your rider is heading to you. Keep your phone close."],
    done: ["Delivered", "Enjoy! Anything wrong with it? Message us on WhatsApp."],
    cancel: ["Cancelled", "This order was cancelled. Questions? Message us on WhatsApp."]
  };
  var trackTimer = null;

  // Remember the last order on this phone so tracking is one tap.
  function rememberOrder(o) {
    try { localStorage.setItem("sosick.lastOrder", JSON.stringify({ code: o.code, phone4: o.phone.slice(-4) })); } catch (e) {}
  }
  function lastOrder() {
    try { return JSON.parse(localStorage.getItem("sosick.lastOrder")) || null; } catch (e) { return null; }
  }

  function trackError(text) { var e = $("tError"); e.textContent = text; e.hidden = !text; }
  function timeOf(iso) {
    if (!iso) return "";
    var d = new Date(iso), today = new Date().toDateString() === d.toDateString();
    return (today ? "" : d.toLocaleDateString("en-KE", { day: "numeric", month: "short" }) + ", ") + d.toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" });
  }

  function showTracking(o) {
    var cancelled = o.status === "cancel";
    var idx = cancelled ? Math.max(0, STOPS.filter(function (s) { return o.timeline && o.timeline[s]; }).length - 1) : STOPS.indexOf(o.status);
    var pct = Math.max(0, idx) / (STOPS.length - 1) * 100;
    var text = STATUS_TEXT[o.status] || STATUS_TEXT.new;
    $("trCode").textContent = o.code;
    $("trArea").textContent = o.drop_area ? "To " + o.drop_area : "";
    $("trStatus").textContent = text[0];
    $("trStatus").className = "tracker-status" + (o.status === "done" ? " is-done" : cancelled ? " is-cancel" : "");
    $("trNote").textContent = text[1];
    var road = $("trRoad");
    road.className = "road" + (o.status === "done" ? " is-done" : cancelled ? " is-cancel" : "");
    $("trFill").style.width = "calc(" + pct + "% + " + (pct ? 0 : 34) + "px)";
    $("trRider").style.left = pct + "%";
    road.querySelectorAll("[data-stop]").forEach(function (li, i) {
      var stop = li.getAttribute("data-stop");
      li.classList.toggle("reached", i <= idx);
      li.querySelector("small").textContent = timeOf(o.timeline && o.timeline[stop]);
    });
    $("tracker").hidden = false;
  }

  function lookUp(code, phone4, quiet) {
    if (!S.supabaseUrl) return Promise.resolve();
    return api("rpc/track_order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ p_code: code, p_phone4: phone4 })
    }).then(function (r) {
      if (r.status === 404) throw { kind: "off" };
      if (!r.ok) throw { kind: "net" };
      return r.json();
    }).then(function (rows) {
      if (!rows.length) {
        if (!quiet) { $("tracker").hidden = true; trackError("We couldn't find that order. Check the code and the last 4 digits of the phone you ordered with."); }
        return;
      }
      trackError(""); showTracking(rows[0]);
      clearInterval(trackTimer);
      if (rows[0].status !== "done" && rows[0].status !== "cancel") {
        trackTimer = setInterval(function () { if (document.visibilityState === "visible") lookUp(code, phone4, true); }, 20000);
      }
    }).catch(function (err) {
      if (quiet) return;
      trackError(err && err.kind === "off"
        ? "Tracking is switching on. For now, send your order code to us on WhatsApp and we'll update you."
        : "No connection. Check your internet and try again.");
    });
  }

  $("trackForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var raw = $("tCode").value.trim().toUpperCase().replace(/\s/g, "");
    var m = raw.match(/^(?:SOS-?)?(\d{4})$/);
    var phone4 = $("tPhone").value.replace(/\D/g, "");
    if (!m) { trackError("Order codes look like SOS-1234. You'll find yours on your WhatsApp order slip."); $("tCode").focus(); return; }
    if (phone4.length !== 4) { trackError("Type the last 4 digits of the phone number you ordered with."); $("tPhone").focus(); return; }
    var code = "SOS-" + m[1];
    $("tCode").value = code;
    var btn = $("tBtn"); btn.disabled = true; btn.textContent = "Checking…";
    lookUp(code, phone4).then(function () { btn.disabled = false; btn.textContent = "Track it"; });
  });

  function openTracker(auto) {
    var last = lastOrder();
    if (last) { $("tCode").value = last.code; $("tPhone").value = last.phone4; }
    document.getElementById("track").scrollIntoView({ behavior: "smooth" });
    if (last && auto) $("trackForm").requestSubmit();
    else setTimeout(function () { (last ? $("tBtn") : $("tCode")).focus({ preventScroll: true }); }, 500);
  }
  $("trackThis").addEventListener("click", function (e) { e.preventDefault(); openTracker(true); });
  (function () { var last = lastOrder(); if (last) { $("tCode").value = last.code; $("tPhone").value = last.phone4; } })();

  /* ---------------- WhatsApp links ---------------- */
  document.querySelectorAll(".wa-link").forEach(function (a) {
    a.href = waLink(a.getAttribute("data-wa") || "Hi Sosick");
  });
  document.querySelectorAll(".wa-number").forEach(function (el) { el.textContent = S.whatsappDisplay; });

  /* ---------------- ticker + areas ---------------- */
  var tickerWords = ["Pick up", "Delivery", "Verified Plugs"].concat(S.campuses.slice(0, 6), S.areas.slice(0, 14));
  var tick = tickerWords.map(function (w) { return "<span>" + esc(w) + "</span>"; }).join("");
  $("ticker").innerHTML = tick + tick; // doubled so the loop is seamless

  function pills(list) { return list.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join(""); }
  $("campusList").innerHTML = pills(S.campuses);
  $("areaList").innerHTML = pills(S.areas);
  $("nextList").innerHTML = pills(S.nextCities);
  $("year").textContent = new Date().getFullYear();

  /* ---------------- verified plugs ---------------- */
  var activeCat = "all";
  var badgeHtml = {
    verified: '<span class="badge badge-verified">✓ Verified</span>',
    trusted: '<span class="badge badge-trusted">★ Trusted</span>',
    top: '<span class="badge badge-top">♛ Top Plug</span>',
  };
  function catLabel(id) {
    var c = S.categories.filter(function (c) { return c.id === id; })[0];
    return c ? c.label : id;
  }

  // Which category does a free-text query point at? ("jeans" → denim)
  function catForText(q) {
    var words = String(q || "").toLowerCase().split(/[^a-z0-9-]+/);
    for (var i = 0; i < S.categories.length; i++) {
      for (var j = 0; j < words.length; j++) {
        if (words[j] && S.categories[i].words.indexOf(words[j]) !== -1) return S.categories[i];
      }
    }
    return null;
  }

  function searchPlugs(q, cat) {
    q = String(q || "").toLowerCase().trim();
    var hit = catForText(q);
    return S.plugs.filter(function (p) {
      if (cat && cat !== "all" && p.category !== cat) return false;
      if (!q) return true;
      var hay = [p.name, p.sells, p.area, catLabel(p.category)].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1 || (hit && p.category === hit.id);
    });
  }

  function plugCard(p) {
    var since = p.tested ? new Date(p.tested + "T00:00:00").toLocaleDateString("en-KE", { month: "short", year: "numeric" }) : "";
    return '<article class="plug">' +
      (badgeHtml[p.level] || badgeHtml.verified) +
      "<h3>" + esc(p.name) + "</h3>" +
      '<div class="plug-meta">' + esc(catLabel(p.category)) + " · " + esc(p.area) + (since ? " · Tested " + esc(since) : "") + "</div>" +
      "<p>" + esc(p.sells) + "</p>" +
      '<div class="plug-actions">' +
        (p.link ? '<a class="btn btn-sun btn-sm" href="' + esc(p.link) + '" target="_blank" rel="noopener">Visit their page</a>' : "") +
        '<a class="btn btn-outline-sun btn-sm" href="' + esc(waLink("Hi Sosick! Please pick up from " + p.name + " for me. I want: ")) + '" target="_blank" rel="noopener">Deliver from here</a>' +
      "</div></article>";
  }

  function renderPlugs() {
    var q = $("plugSearch").value;
    var list = searchPlugs(q, activeCat);
    var grid = $("plugGrid");
    grid.classList.toggle("is-empty", !list.length);
    if (list.length) { grid.innerHTML = list.map(plugCard).join(""); return; }

    var hunting = q.trim() || (activeCat !== "all" ? catLabel(activeCat) : "");
    var huntMsg = "Hi Sosick! I'm looking for a solid plug for " + (hunting || "something") + ". Can Sosick find one for me?";
    var title = S.plugs.length === 0 ? "First plugs drop soon" : "No verified plug for that yet";
    var body = S.plugs.length === 0
      ? "We're putting Nairobi sellers through the Sosick Test right now. Only the ones that pass get listed here."
      : "We haven't tested a seller for " + esc(hunting) + " yet.";
    grid.innerHTML =
      '<div class="empty-plugs"><h3>' + title + "</h3><p>" + body +
      " Need it today? We'll hunt it down and deliver it.</p>" +
      '<a class="btn btn-sun" href="' + esc(waLink(huntMsg)) + '" target="_blank" rel="noopener">Ask Sosick to find ' + (hunting ? esc(hunting) : "it") + "</a></div>" +
      '<article class="plug plug-sample"><span class="badge badge-verified">✓ Verified</span>' +
      "<h3>Your shop could be here</h3>" +
      '<div class="plug-meta">Any category · Nairobi</div>' +
      "<p>Sell honest stuff? Let us test you. Pass the Sosick Test and comrades across Nairobi find you here.</p>" +
      '<div class="plug-actions"><a class="btn btn-sun btn-sm" href="' + esc(waLink("Hi Sosick! I'd like my shop tested for the Sosick Verified badge. Shop name:")) + '" target="_blank" rel="noopener">Get tested</a></div></article>';
  }

  var chipsHtml = '<button type="button" data-cat="all" aria-pressed="true">All</button>' +
    S.categories.map(function (c) { return '<button type="button" data-cat="' + c.id + '" aria-pressed="false">' + esc(c.label) + "</button>"; }).join("");
  $("catChips").innerHTML = chipsHtml;
  $("catChips").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    activeCat = b.getAttribute("data-cat");
    this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    renderPlugs();
  });
  $("plugSearch").addEventListener("input", renderPlugs);
  renderPlugs();
  loadLive();

  function showPlugSearch(q) {
    $("plugSearch").value = q;
    renderPlugs();
    document.getElementById("plugs").scrollIntoView({ behavior: "smooth" });
  }

  window.Sosick = {
    esc: esc, waLink: waLink, normalisePhone: normalisePhone, newCode: newCode,
    findPlace: findPlace, buildOrderMessage: buildOrderMessage, fillOrderForm: fillOrderForm,
    searchPlugs: searchPlugs, catForText: catForText, showPlugSearch: showPlugSearch, openTracker: openTracker,
  };
})();
