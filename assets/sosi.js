// Sosi: the Sosick helper. A cheeky little shopping bag.
// Rule-based (no paid AI yet): it reads keywords, keeps a tiny bit of
// memory per chat, runs a guided order flow, searches Verified Plugs,
// checks delivery areas and has two mini games. Everything it can't
// handle goes to the Sosick team on WhatsApp.
(function () {
  "use strict";
  var S = window.SOSICK, K = window.Sosick;
  var $ = function (id) { return document.getElementById(id); };
  var log = $("sosiLog"), panel = $("sosiPanel"), fab = $("sosiFab"), chipsEl = $("sosiChips");
  var faces = document.querySelectorAll(".sosi-face");

  var sheng = true;
  try { sheng = localStorage.getItem("sosi.sheng") !== "off"; } catch (e) {}

  var state = { mode: null, order: {}, game: null, name: "" };
  var opened = false;

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  // say("plain English", "sheng version"): Sosi speaks the one that matches the toggle
  function t(plain, sh) { return sheng && sh ? sh : plain; }

  /* ---------------- chat rendering ---------------- */
  function bubble(html, who) {
    var d = document.createElement("div");
    d.className = "msg " + (who === "me" ? "msg-me" : "msg-bot");
    d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  var queue = Promise.resolve();
  function bot(html, chips) {
    queue = queue.then(function () {
      return new Promise(function (resolve) {
        mood("thinking");
        var typing = bubble("<i></i><i></i><i></i>");
        typing.classList.add("msg-typing");
        var wait = Math.min(1400, 380 + String(html).replace(/<[^>]+>/g, "").length * 9);
        setTimeout(function () {
          typing.remove();
          bubble(html);
          mood("idle");
          if (chips) setChips(chips);
          resolve();
        }, wait);
      });
    });
  }

  function setChips(list) {
    chipsEl.innerHTML = "";
    list.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = c;
      b.addEventListener("click", function () { userSays(c); });
      chipsEl.appendChild(b);
    });
  }

  function mood(m) {
    faces.forEach(function (f) {
      f.classList.toggle("is-thinking", m === "thinking");
      if (m === "happy") { f.classList.remove("is-happy"); void f.offsetWidth; f.classList.add("is-happy"); }
    });
    $("sosiMood").textContent = m === "thinking" ? t("typing…", "inapiga hesabu…") : "Sosick's helper bot · online";
  }

  function waBtn(label, text) {
    return '<a class="btn btn-ink btn-sm" href="' + K.esc(K.waLink(text)) + '" target="_blank" rel="noopener">' + K.esc(label) + "</a>";
  }

  var mainChips = ["🛵 Order something", "🔌 Find a plug", "📍 Do you deliver to me?", "💸 Charges?", "🎲 Fit dice", "🤝 Haggle game"];

  /* ---------------- brain ---------------- */
  function has(text, words) {
    for (var i = 0; i < words.length; i++) {
      if (new RegExp("(^|[^a-z])" + words[i] + "([^a-z]|$)").test(text)) return true;
    }
    return false;
  }

  function handleText(raw) {
    var text = String(raw || "").trim();
    if (!text) return;
    bubble(K.esc(text), "me");
    chipsEl.innerHTML = "";
    var low = text.toLowerCase();

    if (has(low, ["cancel", "stop", "exit", "menu", "start over", "back"]) && (state.mode || state.game)) {
      state.mode = null; state.game = null; state.order = {};
      return bot(t("Sawa, cancelled. What next?", "Poa, tumeachana na hiyo. Tufanye nini sasa?"), mainChips);
    }
    if (state.game) return gameTurn(low, text);
    if (state.mode === "order") return orderTurn(text, low);

    route(low, text);
  }

  function route(low, text) {
    var cat = K.catForText(low);
    var place = K.findPlace(low);

    if (has(low, ["hi", "hello", "hey", "niaje", "sasa", "mambo", "vipi", "hola", "yo", "sup", "habari"]) && low.length < 22) {
      return bot(pick([
        t("Hey! I'm Sosi, Sosick's shopping-bag helper. What can I get you?", "Niaje niaje! 👋 Mimi ni Sosi, the bag that knows every plug. Unataka nini leo?"),
        t("Hello! Ready when you are. Order, find a plug, or play a game?", "Mambo! Sosi yuko on duty. Tuku-order kitu, ama tukutafutie plug?"),
      ]), mainChips);
    }
    if (has(low, ["charge", "charges", "fee", "fees", "price", "cost", "how much", "pesa", "bei", "ngapi", "free"])) {
      return fees();
    }
    if (has(low, ["seller", "my shop", "list my", "get tested", "biashara", "i sell"]) || /i'm a seller|im a seller/.test(low)) {
      return bot(t("Love that. Send us your shop name and page. If you pass the Sosick Test, you get the badge and the spotlight.",
        "Aaah boss wa biashara! 😎 Tuma shop name na page yako kwetu. Ukipita Sosick Test, unapata badge na comrades wote wanakuona.") +
        '<div class="msg-card">' + waBtn("Get my shop tested", "Hi Sosick! I'd like my shop tested for the Sosick Verified badge. Shop name:") + "</div>", ["🔌 Find a plug", "😂 Tell me a joke"]);
    }
    if (has(low, ["job", "jobs", "work", "rider", "employ", "hire", "hiring", "kazi", "boda"])) {
      return bot(t("Sosick is building its team: riders, plug testers and more. Send us your name, area and what you'd love to do.",
        "Unatafuta kazi? Respect 💪 Sosick inajenga team: riders, plug testers na wengine. Tuma jina, area na skill yako kwetu.") +
        '<div class="msg-card">' + waBtn("Apply on WhatsApp", "Hi Sosick! I'd like to work with Sosick. Name: , Area: , Role I want: ") + "</div>", mainChips);
    }
    if (has(low, ["track", "where is my", "status", "iko wapi", "late"])) {
      return bot(t("Let's find your rider! 🛵 You need your order code (SOS-1234, it's on your WhatsApp slip) and the last 4 digits of your phone.",
        "Twende tumtafute rider wako! 🛵 Unahitaji order code (SOS-1234, iko kwa slip yako ya WhatsApp) na digits 4 za mwisho za simu yako.") +
        '<div class="msg-card"><button class="btn btn-ink btn-sm" type="button" data-sosi-track>Open the tracker</button></div>', mainChips);
    }
    if (has(low, ["order", "deliver", "send", "pick", "pickup", "bring", "letea", "nileteeni", "buy for me", "errand"]) && !/do you deliver|mna deliver|you deliver to/.test(low)) {
      return startOrder(text, cat, place);
    }
    if (/where can i (get|find|buy)|plug|nitapata|natafuta|looking for|who sells/.test(low) || (cat && !place)) {
      return findPlug(low, cat);
    }
    if (/do you deliver|mna deliver|deliver to|mnafika|you reach|reach /.test(low) || (place && low.length < 40)) {
      return checkArea(low, place);
    }
    if (has(low, ["verified", "verify", "trust", "legit", "scam", "test", "badge", "proven"])) {
      return bot(t(
        "Every Verified Plug passed the <b>Sosick Test</b>: we buy from them in secret, check the item matches the photos, check the price is honest, time the delivery and see how they handle problems. Fail one check and there's no badge.",
        "Every Verified Plug amepita <b>Sosick Test</b>: tunanunua kwa siri kama customer, tunacheck kama picha = kitu, bei ni honest, wanafika on time na wanasort issues. Ukifeli moja? Hakuna badge. Simple."
      ), ["🔌 Find a plug", "🏪 I'm a seller", "🛵 Order something"]);
    }
    if (has(low, ["human", "person", "agent", "owner", "boss", "call", "contact", "number", "whatsapp"])) {
      return humanHandoff();
    }
    if (has(low, ["joke", "funny", "bored", "laugh", "cheka"])) return joke();
    if (/fit dice|dice|outfit|what should i wear|fit check/.test(low)) return fitDice();
    if (/haggle|game|play|bargain|pamba/.test(low)) return startHaggle();
    if (has(low, ["thanks", "thank", "asante", "shukran", "poa", "nice", "cool"])) {
      mood("happy");
      return bot(pick([t("Anytime! 💛", "Kama kawa! 💛"), t("That's what I'm here for.", "Ndio kazi yangu hiyo 😌"), t("Pleasure! Shout if you need anything else.", "Sawa sawa, ukihitaji kitu nishtue.")]), mainChips);
    }
    if (has(low, ["bye", "later", "baadaye", "see you"])) {
      return bot(t("Later! Sosi will be right here bouncing. 🛍️", "Baadaye! Sosi atabaki hapa akiruka ruka 🛍️"));
    }
    if (/who are you|what are you|are you (a )?(bot|ai|robot|human)|wewe ni nani/.test(low)) {
      return bot(t("I'm Sosi, Sosick's helper bot. I'm a friendly bag of rules, not a person. For real humans, the Sosick team is one tap away.",
        "Mimi ni Sosi, helper bot wa Sosick. Sio mtu, ni bag yenye akili kidogo 😅 Ukitaka mtu halisi, team ya Sosick iko WhatsApp."), mainChips);
    }
    if (place) return checkArea(low, place);

    bot(pick([
      t("Hmm, I didn't catch that. Try one of these, or ask the Sosick team directly.", "Eish, hiyo imenipita kidogo 🙈 Jaribu moja ya hizi, ama uongee na team ya Sosick direct."),
      t("I'm still learning! Here's what I'm good at:", "Bado nasoma! 📚 Hizi ndio nazijua vizuri:"),
    ]), mainChips.concat(["🙋 Talk to a human"]));
  }

  /* ---------------- order flow ---------------- */
  function startOrder(text, cat, place) {
    state.mode = "order";
    state.order = { code: K.newCode() };
    // If they already said what they want ("bring me jeans to Chiromo"), keep it.
    var guess = text.replace(/^(i want to |i want |please |can you |nataka |)(order|deliver|bring|send|pick( up)?|letea|nileteeni)( me)?\s*/i, "").trim();
    guess = guess.replace(/^(to|in|at)\s+.*$/i, "");
    if (cat || (guess && guess.length > 3 && guess.toLowerCase() !== "something" && guess !== text)) state.order.item = guess;
    if (place) { state.order.dropArea = place; if (state.order.item) state.order.item = state.order.item.replace(/\s+(to|in|at|kwa)\s+.*$/i, ""); }
    askNext();
  }

  function askNext() {
    var o = state.order;
    if (!o.item) return bot(t("Let's go! 🛵 What do you need us to get?", "Twende kazi! 🛵 Tukuletee nini? Andika kama: <i>black jeans size 32</i>"), ["Cancel"]);
    if (o.pickup === undefined) return bot(t("Where do we pick it up? A shop, market, plug or stage. Or tap <b>Find it for me</b>.",
      "Tukichukue wapi? Shop, market, plug ama stage. Ama bonyeza <b>Find it for me</b>."), ["Find it for me", "Gikomba", "Toi Market", "CBD", "Cancel"]);
    if (!o.dropArea) return bot(t("Where should we drop it? Area or campus works.", "Tukuletee wapi? Area ama campus inatosha."), ["UoN Chiromo", "KU", "Westlands", "Rongai", "Cancel"]);
    if (o.landmark === undefined) return bot(t("Any landmark for the rider? e.g. <i>blue gate opposite Shell, Hall 5</i>", "Landmark yoyote ya rider? Mfano <i>gate ya blue opposite Shell, Hall 5</i>"), ["Skip", "Cancel"]);
    if (!o.name) return bot(t("And your name?", "Na jina lako boss?"), ["Cancel"]);
    if (!o.phone) return bot(t("Last one: your phone number (07… or 01…)", "Last kabisa: number yako ya simu (07… ama 01…)"));
    finishOrder();
  }

  function orderTurn(text, low) {
    var o = state.order;
    if (!o.item) { o.item = text; }
    else if (o.pickup === undefined) { o.pickup = /find it|not sure|sijui|anywhere/.test(low) ? "" : text; }
    else if (!o.dropArea) {
      var pl = K.findPlace(low);
      o.dropArea = pl || text;
      if (pl && S.campuses.indexOf(pl) !== -1) bot(t("Comrade spotted! 🎓", "Comrade ameonekana! 🎓 Respect."));
      else if (!pl) bot(t("I don't have that area on my list yet, but we'll confirm if a rider can reach you.", "Hiyo area sina kwa list bado, but tutakuconfirmia kama rider anafika."));
    }
    else if (o.landmark === undefined) { o.landmark = /^skip$/i.test(text) ? "" : text; }
    else if (!o.name) { o.name = text.replace(/^(i'm|im|i am|my name is|naitwa|ni)\s+/i, ""); state.name = o.name.split(" ")[0]; }
    else if (!o.phone) {
      var p = K.normalisePhone(text);
      if (!p) return bot(t("That number looks off. Try 07XX XXX XXX or 01XX XXX XXX.", "Hiyo number inaonekana fake kidogo 👀 Jaribu 07XX XXX XXX ama 01XX XXX XXX."));
      o.phone = p;
    }
    askNext();
  }

  function finishOrder() {
    var o = state.order;
    o.when = "As soon as possible";
    o.pay = "M-Pesa on delivery";
    var msg = K.buildOrderMessage(o);
    state.mode = null;
    mood("happy");
    bot(t("Done, " + K.esc(state.name || "friend") + "! Here's your slip. Tap send and it goes straight to the Sosick team. 🟡",
      "Imeisha, " + K.esc(state.name || "boss") + "! 🔥 Hii hapa slip yako. Bonyeza send, inafika kwetu direct. 🟡") +
      '<div class="msg-card"><div class="mono">' + K.esc(msg) + "</div>" +
      '<a class="btn btn-ink btn-sm" href="' + K.esc(K.waLink(msg)) + '" target="_blank" rel="noopener">Send on WhatsApp</a></div>',
      ["✏️ Edit in the form", "🔌 Find a plug", "😂 Tell me a joke"]);
    state.lastOrder = o;
  }

  /* ---------------- plugs, areas, fees ---------------- */
  function findPlug(low, cat) {
    if (!cat && /^(🔌 )?find a plug$/.test(low)) {
      return bot(t("What are you hunting for?", "Unawinda nini? 🕵️"), ["Jeans", "Sneakers", "Hoodies", "Perfume", "Phones", "Bags"]);
    }
    var q = cat ? cat.words[0] : low.replace(/where can i (get|find|buy)|plug( for)?|natafuta|nitapata wapi|looking for|who sells|\?/g, "").trim();
    var hits = K.searchPlugs(q, cat ? cat.id : "all");
    var what = cat ? cat.label.toLowerCase() : (q || "that");
    if (hits.length) {
      mood("happy");
      var cards = hits.slice(0, 3).map(function (p) {
        return '<div class="msg-card"><b>' + K.esc(p.name) + "</b><span>" + K.esc(p.sells) + " · " + K.esc(p.area) + "</span>" +
          (p.link ? '<a class="btn btn-ink btn-sm" href="' + K.esc(p.link) + '" target="_blank" rel="noopener">Visit their page</a>' : "") + "</div>";
      }).join("");
      return bot(t("Found " + hits.length + " verified plug" + (hits.length > 1 ? "s" : "") + " for " + K.esc(what) + ":", "Nimekupatia plug " + hits.length + " za " + K.esc(what) + " 🔌🔥") + cards,
        ["🛵 Order something", "🔌 Find a plug"]);
    }
    bot(t("No verified plug for " + K.esc(what) + " yet. We're still testing sellers. But we can hunt it down and deliver it to you!",
      "Bado hatuna verified plug ya " + K.esc(what) + " 😤 Bado tunatest sellers. But tunaweza kukuwindia na kukuletea!") +
      '<div class="msg-card">' + waBtn("Hunt it for me", "Hi Sosick! Please find me a solid plug for " + what + ". My area:") + "</div>",
      ["🛵 Order something", "🏪 I'm a seller", "📍 Do you deliver to me?"]);
  }

  function checkArea(low, place) {
    var soon = S.nextCities.filter(function (c) { return low.indexOf(c.toLowerCase()) !== -1; })[0];
    if (!place && soon) return bot(t(soon + " is next on our list! We're starting in Nairobi and going countrywide soon. 🇰🇪", soon + " iko next kwa list! Tunaanza Nairobi, then countrywide soon 🇰🇪"), ["🛵 Order something", "🙋 Talk to a human"]);
    if (!place) return bot(t("Which area or campus are you in?", "Uko area gani ama campus gani?"), ["Chiromo", "KU", "Kilimani", "Rongai", "Kitengela"]);
    var campus = S.campuses.indexOf(place) !== -1;
    mood("happy");
    bot(t("Yes! " + K.esc(place) + " is in our Nairobi launch zone. " + (campus ? "Comrades get first-class treatment. 🎓" : ""),
      "Ndio sana! " + K.esc(place) + " iko kwa launch zone yetu. " + (campus ? "Comrades tunawapenda sana 🎓💛" : "Tunafika bila stress.")),
      ["🛵 Order something", "💸 Charges?"]);
  }

  function fees() {
    var from = S.deliveryFeeFrom ? " (from KES " + Number(S.deliveryFeeFrom).toLocaleString("en-KE") + ")" : "";
    if (!S.extraFees) {
      return bot(t("You pay for the item plus a <b>delivery fee</b>" + from + ". That's it: <b>no service fee, no extra charges</b>. We confirm both prices on WhatsApp before pickup, so no surprises.",
        "Unalipa bei ya kitu plus <b>delivery fee</b>" + from + ". Basi! <b>Hakuna service fee, hakuna extra charges</b> 💛 Tunakuconfirmia bei zote kwa WhatsApp kabla ya pickup, hakuna surprise."),
        ["🛵 Order something", "🔌 Find a plug"]);
    }
    bot(t("Delivery charges depend on distance. We confirm the exact fee with you on WhatsApp before pickup, so there are no surprises.",
      "Delivery fee inategemea distance. Tutakuambia fee exact kwa WhatsApp kabla ya pickup, hakuna surprise."), ["🛵 Order something"]);
  }

  function humanHandoff() {
    bot(t("Talk to the Sosick team on WhatsApp: <b>" + S.whatsappDisplay + "</b>",
      "Team ya Sosick iko ready 😎 Tushtue WhatsApp: <b>" + S.whatsappDisplay + "</b>") +
      '<div class="msg-card">' + waBtn("Chat with Sosick", "Hi Sosick! I was chatting with Sosi and ") + "</div>", mainChips);
  }

  /* ---------------- fun ---------------- */
  var jokes = [
    ["Why did the jeans go to therapy? Too many issues with their fly.", "Mbona jeans ilienda therapy? Ilikuwa na stress za zip 😩"],
    ["I asked a hoodie for advice. It said: just chill and zip it.", "Niliuliza hoodie ushauri. Ikasema: tulia, zip mdomo 🤐"],
    ["My budget said no. Gikomba said: hold my mtumba.", "Budget ilisema no. Gikomba ikasema: shika mtumba yangu 😂"],
    ["Comrade life: HELB is coming, the outfit is already here.", "Comrade life: HELB bado inakuja, fit tayari imefika 🎓💸"],
    ["I'm a bag, so I carry everything. Except your ex's sweater. Return it.", "Mimi ni bag, nabeba kila kitu. Isipokuwa sweater ya ex wako. Irudishe 💀"],
  ];
  function joke() {
    var j = pick(jokes);
    mood("happy");
    bot(t(j[0], j[1]), ["😂 Another one", "🎲 Fit dice", "🛵 Order something"]);
  }

  var tops = ["oversized vintage tee", "boxy denim jacket", "90s windbreaker", "plain white tee", "flannel shirt", "cropped hoodie", "graphic band tee", "knit sweater vest"];
  var bottoms = ["baggy light-wash jeans", "black cargo pants", "pleated trousers", "denim jorts", "wide-leg khakis", "flowy midi skirt", "track pants"];
  var shoes = ["white AF1s", "chunky dad sneakers", "Converse high-tops", "loafers with white socks", "retro runners", "Timbs"];
  var extras = ["bucket hat", "silver chain", "tote bag", "rimless shades", "beanie", "vintage watch", "crossbody bag"];
  var vibes = ["Westlands Saturday", "CBD Main Character", "Chiromo Lecture Drip", "Kilimani Brunch", "Gikomba Treasure Hunter", "Rongai Matatu Royalty"];
  function fitDice() {
    var fit = [pick(tops), pick(bottoms), pick(shoes), pick(extras)];
    mood("happy");
    bot(t("🎲 Rolling… your fit: ", "🎲 Narusha dice… fit yako ni: ") +
      '<div class="msg-card"><b>' + pick(vibes) + "</b><span>👕 " + fit[0] + "<br>👖 " + fit[1] + "<br>👟 " + fit[2] + "<br>✨ " + fit[3] + "</span></div>" +
      t("Want the full version? Pick a vibe, lock pieces, order the whole fit:", "Unataka version kamili? Chagua vibe, lock pieces, order fit nzima:") +
      '<div class="msg-card"><a class="btn btn-ink btn-sm" href="outfit.html">🎲 Open Outfit Match</a></div>', ["🎲 Roll again", "🛵 Order something", "🔌 Find a plug"]);
  }

  // Haggle game: pure fun, nothing here is a real price or a real discount.
  var haggleItems = [
    { name: "Vintage Levi's denim jacket", ask: 2800 },
    { name: "Retro Nike windbreaker", ask: 2200 },
    { name: "Thick knit grandpa cardigan", ask: 1500 },
    { name: "Air Force 1s, barely worn", ask: 3500 },
  ];
  function startHaggle() {
    var it = pick(haggleItems);
    var floor = Math.round(it.ask * (0.55 + Math.random() * 0.15) / 50) * 50;
    state.game = { item: it, price: it.ask, floor: floor, rounds: 0, patience: 100 };
    bot(t("🤝 <b>HAGGLE GAME</b> (just for fun, no real prices!)<br>I'm a tough Gikomba seller. Item: <b>" + it.name + "</b>. My price: <b>KES " + it.ask.toLocaleString() + "</b>. Make me an offer. Go too low and I'll walk away. You get 5 rounds.",
      "🤝 <b>HAGGLE GAME</b> (ni mchezo tu, sio bei za kweli!)<br>Mimi ni seller mgumu wa Gikomba 😤 Kitu: <b>" + it.name + "</b>. Bei yangu: <b>KES " + it.ask.toLocaleString() + "</b>. Nipe offer yako. Ukinitusi na bei ya chini sana, naenda. Una rounds 5.") +
      meterHtml(100), ["KES " + Math.round(it.ask * 0.5), "KES " + Math.round(it.ask * 0.7), "Quit game"]);
  }
  function meterHtml(p) {
    return '<div class="meter" title="Seller patience"><i style="width:' + Math.max(0, p) + '%"></i></div><small>' + t("Seller patience", "Uvumilivu wa seller") + "</small>";
  }
  function gameTurn(low) {
    var g = state.game;
    if (/quit|give up|nimeachana/.test(low)) { state.game = null; return bot(t("Game over. Respect for trying! 😂", "Umekimbia! 😂 Respect anyway."), mainChips); }
    var n = parseInt(low.replace(/[^0-9]/g, ""), 10);
    if (!n) return bot(t("Give me a number, like 1500.", "Nipe number bana, kama 1500 😤"));
    g.rounds++;
    if (n >= g.price) {
      state.game = null; mood("happy");
      return bot(t("Deal at KES " + g.price.toLocaleString() + "… wait, you offered MORE than my price? 😂 Easiest customer ever. Score: 0/10 haggle skills.",
        "Deal! Lakini ulikuwa unanipea zaidi ya bei yangu? 😂 Customer rahisi kabisa. Score: 0/10 kwa haggle."), ["🤝 Play again", "🛵 Order something"]);
    }
    if (n < g.floor * 0.6) g.patience -= 45; else if (n < g.floor) g.patience -= 22; else g.patience -= 8;
    if (g.patience <= 0) {
      state.game = null;
      return bot(t("That's it, I'm closing my stall! 🙄 You pushed too hard. Tip: start at about 60% of the asking price.",
        "Nimefunga duka! 🙄 Umeniumiza roho. Tip: anza karibu 60% ya bei. Jaribu tena?") + meterHtml(0), ["🤝 Play again", "😂 Tell me a joke"]);
    }
    if (n >= g.floor) {
      var score = Math.max(1, Math.min(10, Math.round(10 * (g.item.ask - n) / (g.item.ask - g.floor) * 0.8 + (5 - g.rounds))));
      state.game = null; mood("happy");
      return bot(t("Sawa sawa! DEAL at <b>KES " + n.toLocaleString() + "</b> in " + g.rounds + " round" + (g.rounds > 1 ? "s" : "") + ". Haggle score: <b>" + score + "/10</b> 🏆<br><small>Real thrift prices are set by our Verified Plugs. This was just a game!</small>",
        "Haya basi! DEAL kwa <b>KES " + n.toLocaleString() + "</b> ndani ya rounds " + g.rounds + ". Haggle score: <b>" + score + "/10</b> 🏆<br><small>Bei za kweli ziko kwa Verified Plugs. Hii ilikuwa mchezo tu!</small>"),
        ["🤝 Play again", "🔌 Find a plug", "🛵 Order something"]);
    }
    if (g.rounds >= 5) {
      state.game = null;
      return bot(t("Out of rounds! I'm keeping my jacket. 😤 My lowest was KES " + g.floor.toLocaleString() + ".",
        "Rounds zimeisha! Jacket nabaki nayo 😤 Ningekubali KES " + g.floor.toLocaleString() + "."), ["🤝 Play again", "😂 Tell me a joke"]);
    }
    g.price = Math.max(g.floor, Math.round((g.price - (g.price - Math.max(n, g.floor)) * 0.35) / 50) * 50);
    bot(pick([
      t("KES " + n.toLocaleString() + "?! My grandmother wore this. Give me KES " + g.price.toLocaleString() + ".", "KES " + n.toLocaleString() + "?! Hii ni ya cucu yangu bana 😩 Nipe KES " + g.price.toLocaleString() + "."),
      t("Haha, very funny. KES " + g.price.toLocaleString() + " and I'll throw in a smile.", "Wacha jokes 😂 KES " + g.price.toLocaleString() + " na nakuongezea smile."),
      t("You're hurting me… KES " + g.price.toLocaleString() + ", final final.", "Unaniumiza… KES " + g.price.toLocaleString() + ", ya mwisho mwisho."),
    ]) + meterHtml(g.patience), ["KES " + Math.round((n + g.price) / 2 / 50) * 50, "Quit game"]);
  }

  /* ---------------- chips that need special handling ---------------- */
  function userSays(raw) {
    var map = {
      "🛵 Order something": "I want to order",
      "🔌 Find a plug": "find a plug",
      "📍 Do you deliver to me?": "do you deliver to",
      "💸 Charges?": "charges",
      "🎲 Fit dice": "fit dice", "🎲 Roll again": "fit dice",
      "🤝 Haggle game": "haggle", "🤝 Play again": "haggle",
      "😂 Tell me a joke": "joke", "😂 Another one": "joke",
      "🏪 I'm a seller": "i'm a seller",
      "🙋 Talk to a human": "human",
    };
    if (raw === "✏️ Edit in the form") {
      bubble(K.esc(raw), "me");
      K.fillOrderForm(state.lastOrder || {});
      close();
      return;
    }
    if (map[raw]) {
      bubble(K.esc(raw), "me");
      chipsEl.innerHTML = "";
      var low = map[raw];
      if (state.game && /haggle/.test(low)) state.game = null;
      if (low === "I want to order") return startOrder("", null, null);
      if (low === "find a plug") return findPlug("find a plug", null);
      if (low === "do you deliver to") return checkArea("", null);
      return route(low, raw);
    }
    handleText(raw);
  }

  /* ---------------- open / close ---------------- */
  function open(intent) {
    panel.hidden = false;
    fab.hidden = true;
    fab.setAttribute("aria-expanded", "true");
    $("sosiNudge").classList.add("is-gone");
    if (!opened) {
      opened = true;
      var hour = new Date().getHours();
      var greet = hour < 12 ? t("Good morning", "Morning boss") : hour < 17 ? t("Good afternoon", "Sasa") : t("Good evening", "Niaje, evening vibes");
      bot(greet + "! " + t("I'm <b>Sosi</b>, the Sosick helper. 🛍️ I can take your order, find you a verified plug, check if we reach your area, or entertain you. What's up?",
        "Mimi ni <b>Sosi</b>, bag ya Sosick 🛍️ Naweza kukuchukulia order, kukutafutia verified plug, kucheck kama tunafika kwako, ama kukuchekesha tu. Sema!"),
        intent ? null : mainChips);
    }
    if (intent === "order") startOrder("", null, null);
    if (intent === "fit") fitDice();
    setTimeout(function () { $("sosiText").focus(); }, 50);
  }
  function close() {
    panel.hidden = true;
    fab.hidden = false;
    fab.setAttribute("aria-expanded", "false");
    fab.focus();
  }

  fab.addEventListener("click", function () { open(); });
  log.addEventListener("click", function (e) {
    if (!e.target.closest("[data-sosi-track]")) return;
    close();
    K.openTracker(true);
  });
  $("sosiClose").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });
  // Delegated, because category tiles are redrawn after plugs load.
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-open-sosi]");
    if (b) open(b.getAttribute("data-open-sosi"));
  });
  $("sosiForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("sosiText");
    userSays(input.value);
    input.value = "";
  });

  var toggle = $("shengToggle");
  function paintToggle() { toggle.textContent = "Sheng: " + (sheng ? "ON" : "OFF"); toggle.setAttribute("aria-pressed", String(sheng)); }
  paintToggle();
  toggle.addEventListener("click", function () {
    sheng = !sheng;
    try { localStorage.setItem("sosi.sheng", sheng ? "on" : "off"); } catch (e) {}
    paintToggle();
    bot(sheng ? "Sheng mode imewaka 🔥 Sasa tunaongea kama watu wa mtaa." : "Plain English mode on. I'll keep it simple.");
  });

  // A gentle nudge bubble that changes now and then, then hides.
  var nudges = ["Niaje! Need something? 👀", "No plug? I got you 🔌", "Wanna haggle? 🤝", "No extra charges, comrade 💛"];
  var ni = 0;
  var nudgeTimer = setInterval(function () {
    if (opened) { clearInterval(nudgeTimer); return; }
    ni = (ni + 1) % nudges.length;
    $("sosiNudge").textContent = sheng ? nudges[ni] : ["Need something?", "No plug? I can help", "Fancy a haggle game?", "No extra charges, just delivery"][ni];
  }, 6000);
  setTimeout(function () { $("sosiNudge").classList.add("is-gone"); clearInterval(nudgeTimer); }, 45000);
})();
