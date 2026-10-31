// Sosick categories and products: the tile grid, product cards, the
// "Fresh from Sosick" strip and the category page (category.html?c=kicks).
// Categories and products come from the database (managed in the admin);
// data.js only provides a fallback list if the database can't be reached.
(function () {
  "use strict";
  var S = window.SOSICK;
  S.products = S.products || [];
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function waLink(text) { return "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(text); }
  function byId(id) { return S.categories.filter(function (c) { return c.id === id; })[0]; }
  function api(path) {
    return fetch(S.supabaseUrl + "/rest/v1/" + path, { headers: { apikey: S.supabaseKey, Authorization: "Bearer " + S.supabaseKey } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  // Database category -> the shape the site uses everywhere.
  function fromDb(c) {
    return { id: c.id, label: c.label || c.name, short: c.name, emoji: c.emoji, tile: c.tile, tagline: c.tagline,
      item: c.name + ": ", words: String(c.words || "").split(",").map(function (w) { return w.trim().toLowerCase(); }).filter(Boolean) };
  }
  function load() {
    if (!S.supabaseUrl) return Promise.resolve(false);
    return Promise.all([
      api("categories?select=id,name,label,emoji,tile,tagline,words,sort&visible=eq.true&order=sort.asc,name.asc"),
      api("products?select=id,category,name,description,price,photo,in_stock,created_at&visible=eq.true&order=sort.asc,created_at.desc")
    ]).then(function (r) {
      if (r[0].length) S.categories = r[0].map(fromDb);
      S.products = r[1];
      return true;
    }).catch(function () { return false; });
  }

  function countFor(id, plugs) {
    return S.products.filter(function (p) { return p.category === id; }).length +
      (plugs || []).filter(function (p) { return p.category === id; }).length;
  }
  function tile(c, n) {
    return '<a class="cat-tile" href="category.html?c=' + encodeURIComponent(c.id) + '" style="--tile:' + esc(c.tile) + '">' +
      '<span class="cat-emoji" aria-hidden="true">' + esc(c.emoji) + "</span>" +
      '<span class="cat-count">' + (n ? n + " item" + (n > 1 ? "s" : "") : "Hunt it") + "</span>" +
      '<span class="cat-name">' + esc(c.short) + "</span></a>";
  }
  function matchTile() {
    return '<a class="cat-tile cat-tile-match" href="outfit.html" style="--tile:#FFD21F">' +
      '<span class="cat-emoji" aria-hidden="true">🎲</span>' +
      '<span class="cat-count">New</span>' +
      '<span class="cat-name">Outfit Match</span></a>';
  }
  function grid(el, plugs, skipId, withMatch) {
    if (!el) return;
    el.innerHTML = S.categories.filter(function (c) { return c.id !== skipId; })
      .map(function (c) { return tile(c, countFor(c.id, plugs)); }).join("") + (withMatch ? matchTile() : "");
  }

  function price(p) { return p.price == null ? "Ask for price" : "KES " + Number(p.price).toLocaleString("en-KE"); }
  function orderHref(p) {
    return "./?item=" + encodeURIComponent(p.name + (p.price == null ? "" : " (KES " + Number(p.price).toLocaleString("en-KE") + ")") + " from Sosick") + "#order";
  }
  function productCard(p) {
    var c = byId(p.category);
    return '<article class="product' + (p.in_stock ? "" : " is-sold") + '">' +
      '<div class="product-photo"' + (c ? ' style="--tile:' + esc(c.tile) + '"' : "") + ">" +
        (p.photo ? '<img src="' + esc(p.photo) + '" alt="' + esc(p.name) + '" loading="lazy">' : '<span aria-hidden="true">' + esc(c ? c.emoji : "🛍️") + "</span>") +
        (p.in_stock ? "" : '<span class="product-sold">Sold out</span>') +
      "</div>" +
      '<div class="product-body">' +
        (c ? '<span class="product-cat">' + esc(c.short) + "</span>" : "") +
        "<h3>" + esc(p.name) + "</h3>" +
        (p.description ? "<p>" + esc(p.description) + "</p>" : "") +
        '<div class="product-foot"><b class="product-price">' + price(p) + "</b>" +
          (p.in_stock
            ? '<a class="btn btn-ink btn-sm" href="' + esc(orderHref(p)) + '">Order this</a>'
            : '<a class="btn btn-ghost btn-sm" href="' + esc(waLink("Hi Sosick! Will \"" + p.name + "\" be back in stock?")) + '" target="_blank" rel="noopener">Ask when</a>') +
        "</div>" +
      "</div></article>";
  }
  function products(el, list) { if (el) el.innerHTML = list.map(productCard).join(""); }

  window.SosickCats = { load: load, grid: grid, byId: byId, products: products };

  /* ---------------- category page ---------------- */
  var page = document.getElementById("catPage");
  if (!page) return;
  var id = new URLSearchParams(location.search).get("c");
  var plugs = S.plugs || [];
  var badge = {
    verified: '<span class="badge badge-verified">✓ Verified</span>',
    trusted: '<span class="badge badge-trusted">★ Trusted</span>',
    top: '<span class="badge badge-top">♛ Top Plug</span>'
  };
  function plugCard(p) {
    var since = p.tested ? new Date(p.tested + "T00:00:00").toLocaleDateString("en-KE", { month: "short", year: "numeric" }) : "";
    return '<article class="plug">' + (badge[p.level] || badge.verified) +
      "<h3>" + esc(p.name) + "</h3>" +
      '<div class="plug-meta">' + esc(p.area) + (since ? " · Tested " + esc(since) : "") + "</div>" +
      "<p>" + esc(p.sells) + "</p>" +
      '<div class="plug-actions">' +
        (p.link ? '<a class="btn btn-sun btn-sm" href="' + esc(p.link) + '" target="_blank" rel="noopener">Visit their page</a>' : "") +
        '<a class="btn btn-outline-sun btn-sm" href="' + esc(waLink("Hi Sosick! Please pick up from " + p.name + " for me. I want: ")) + '" target="_blank" rel="noopener">Deliver from here</a>' +
      "</div></article>";
  }
  function show() {
    var c = byId(id);
    if (!c) return false;
    document.title = c.short + " · Sosick";
    document.documentElement.style.setProperty("--tile", c.tile);
    document.getElementById("cEmoji").textContent = c.emoji;
    document.getElementById("cTitle").textContent = c.short;
    document.getElementById("cTag").textContent = c.tagline;
    document.getElementById("cPlugsTitle").textContent = "Verified Plugs for " + c.short.toLowerCase();
    document.getElementById("cOrder").href = "./?item=" + encodeURIComponent(c.item) + "#order";
    document.getElementById("cOrder").textContent = "Order " + c.short.toLowerCase() + " from any shop";
    document.getElementById("cHunt").href = waLink("Hi Sosick! I'm looking for " + c.label.toLowerCase() + ". Can you help? I want: ");

    var mine = S.products.filter(function (p) { return p.category === c.id; });
    document.getElementById("cProductsBand").hidden = !mine.length;
    products(document.getElementById("cProducts"), mine);

    var myPlugs = plugs.filter(function (p) { return p.category === c.id; });
    var box = document.getElementById("cPlugs");
    box.classList.toggle("is-empty", !myPlugs.length);
    box.innerHTML = myPlugs.length ? myPlugs.map(plugCard).join("") :
      '<div class="empty-plugs"><h3>No ' + esc(c.short.toLowerCase()) + " plug yet</h3>" +
      "<p>We're still putting " + esc(c.label.toLowerCase()) + " sellers through the Sosick Test. Need something today? Tell us what you want and we'll hunt it down and deliver it.</p>" +
      '<a class="btn btn-sun" href="' + esc(waLink("Hi Sosick! Please hunt " + c.label.toLowerCase() + " for me. I want: ")) + '" target="_blank" rel="noopener">Hunt it for me</a></div>';
    grid(document.getElementById("cOthers"), plugs, c.id, false);
    return true;
  }

  document.querySelectorAll(".wa-link").forEach(function (a) { a.href = waLink(a.getAttribute("data-wa") || "Hi Sosick"); });
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
  var shown = show();
  // A category he created in the admin isn't in data.js, so wait for the database before giving up.
  Promise.all([
    load(),
    S.supabaseUrl ? api("plugs?select=name,category,area,sells,link,level,tested&status=eq.live&order=tested.desc.nullslast").then(function (r) { plugs = r; }, function () {}) : null
  ]).then(function () {
    if (!show() && !shown) location.replace("./#categories");
  });
})();
