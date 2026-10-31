// Sosick categories: the tile grid (homepage + category pages) and the
// category page itself (category.html?c=kicks).
(function () {
  "use strict";
  var S = window.SOSICK;
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function waLink(text) { return "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(text); }
  function byId(id) { return S.categories.filter(function (c) { return c.id === id; })[0]; }
  function countFor(plugs, id) { return plugs.filter(function (p) { return p.category === id; }).length; }

  function tile(c, n, href) {
    return '<a class="cat-tile" href="' + esc(href || "category.html?c=" + c.id) + '" style="--tile:' + esc(c.tile) + '">' +
      '<span class="cat-emoji" aria-hidden="true">' + c.emoji + "</span>" +
      '<span class="cat-count">' + (n ? n + " plug" + (n > 1 ? "s" : "") : "Hunt it") + "</span>" +
      '<span class="cat-name">' + esc(c.short) + "</span></a>";
  }
  // The fun extra tile: Outfit Match has its own page.
  function matchTile() {
    return '<a class="cat-tile cat-tile-match" href="outfit.html" style="--tile:#FFD21F">' +
      '<span class="cat-emoji" aria-hidden="true">🎲</span>' +
      '<span class="cat-count">New</span>' +
      '<span class="cat-name">Outfit Match</span></a>';
  }
  function grid(el, plugs, skipId, withMatch) {
    if (!el) return;
    el.innerHTML = S.categories.filter(function (c) { return c.id !== skipId; })
      .map(function (c) { return tile(c, countFor(plugs, c.id)); }).join("") + (withMatch ? matchTile() : "");
  }

  window.SosickCats = { grid: grid, byId: byId };

  /* ---------------- category page ---------------- */
  var page = document.getElementById("catPage");
  if (!page) return;

  var id = new URLSearchParams(location.search).get("c");
  var c = byId(id);
  if (!c) { location.replace("./#categories"); return; }

  document.title = c.short + " · Sosick";
  document.documentElement.style.setProperty("--tile", c.tile);
  document.getElementById("cEmoji").textContent = c.emoji;
  document.getElementById("cTitle").textContent = c.short;
  document.getElementById("cTag").textContent = c.tagline;
  document.getElementById("cPlugsTitle").textContent = "Verified Plugs for " + c.short.toLowerCase();
  document.getElementById("cOrder").href = "./?item=" + encodeURIComponent(c.item) + "#order";
  document.getElementById("cOrder").textContent = "Order " + c.short.toLowerCase() + " from any shop";
  document.getElementById("cHunt").href = waLink("Hi Sosick! I'm looking for " + c.label.toLowerCase() + ". Can you find me a good plug? I want: ");
  document.querySelectorAll(".wa-link").forEach(function (a) { a.href = waLink(a.getAttribute("data-wa") || "Hi Sosick"); });

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
  function show(plugs) {
    var mine = plugs.filter(function (p) { return p.category === c.id; });
    var box = document.getElementById("cPlugs");
    box.classList.toggle("is-empty", !mine.length);
    box.innerHTML = mine.length ? mine.map(plugCard).join("") :
      '<div class="empty-plugs"><h3>No ' + esc(c.short.toLowerCase()) + " plug yet</h3>" +
      "<p>We're still putting " + esc(c.label.toLowerCase()) + " sellers through the Sosick Test. Need something today? Tell us what you want and we'll hunt it down and deliver it.</p>" +
      '<a class="btn btn-sun" href="' + esc(waLink("Hi Sosick! Please hunt " + c.label.toLowerCase() + " for me. I want: ")) + '" target="_blank" rel="noopener">Hunt it for me</a></div>';
    grid(document.getElementById("cOthers"), plugs, c.id, false);
  }

  show(S.plugs || []);
  if (S.supabaseUrl) {
    fetch(S.supabaseUrl + "/rest/v1/plugs?select=name,category,area,sells,link,level,tested&status=eq.live&order=tested.desc.nullslast", {
      headers: { apikey: S.supabaseKey, Authorization: "Bearer " + S.supabaseKey }
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) { if (rows) show(rows); })
      .catch(function () {});
  }
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
})();
