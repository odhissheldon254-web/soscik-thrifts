// Sosick screens: the homepage is split into Home / Order / Track / Plugs / Info.
// The address (#order, #track…) decides which one shows, so the back button,
// shared links and links from other pages all keep working.
(function () {
  "use strict";
  // Which screen each anchor lives on.
  var VIEW_OF = { "": "home", top: "home", home: "home", categories: "home", fresh: "home",
    order: "order", track: "track", plugs: "plugs", info: "info", how: "info", areas: "info" };
  var current = null;

  function show() {
    var id = decodeURIComponent(location.hash.slice(1));
    var view = VIEW_OF[id] || "home";
    var changed = view !== current;
    current = view;
    document.querySelectorAll("[data-view]").forEach(function (v) { v.hidden = v.getAttribute("data-view") !== view; });
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    document.body.setAttribute("data-screen", view);
    // Land at the top of a new screen; for anchors inside a screen (e.g. #categories), go to them.
    var target = id && id !== view && id !== "top" ? document.getElementById(id) : null;
    if (target) requestAnimationFrame(function () { target.scrollIntoView({ block: "start" }); });
    else if (changed) window.scrollTo(0, 0);
  }

  // Go to a screen from code (works even when we're already on it).
  function go(id) {
    if (location.hash === "#" + id) show(); else location.hash = id;
  }

  window.addEventListener("hashchange", show);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show); else show();
  window.SosickViews = { go: go, show: show };
})();
