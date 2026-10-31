// Sosick: everything the public site reads lives here.
// Change a value, save, refresh. No other file needs touching.
window.SOSICK = {
  brand: "Sosick",
  whatsapp: "254112275881",        // international format for wa.me links
  whatsappDisplay: "0112 275 881", // how it shows on the page
  city: "Nairobi",

  // Supabase (the owner's own account). This key is the PUBLIC one; it is
  // meant to be in the website. Database rules decide what it can do.
  supabaseUrl: "https://esluujzrscwswxjehkrm.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbHV1anpyc2N3c3d4amVoa3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NzgyODIsImV4cCI6MjEwODQ1NDI4Mn0.sSMmIE7bRZX3EXCRZnrG6HCS4BZRGeTev99EExuigSI",

  // Delivery is always charged. Put the starting price here once the owner
  // settles it (e.g. 150) and the site shows "from KES 150". Leave null to
  // just say the fee is confirmed on WhatsApp.
  deliveryFeeFrom: null,

  // Extra charges (service fee, rush, late-night, per km) stay off until
  // the owner switches them on in the admin. Then set this to true so the
  // site stops saying "no extra charges".
  extraFees: false,

  // Where we deliver at launch. Campuses are tagged so Sosi can cheer comrades on.
  areas: [
    "CBD", "Westlands", "Parklands", "Ngara", "Pangani", "Eastleigh",
    "Kilimani", "Kileleshwa", "Lavington", "Hurlingham", "Upper Hill", "Ngong Road",
    "Karen", "Lang'ata", "Madaraka", "Nairobi West", "South B", "South C",
    "Kibera", "Kawangware", "Kangemi", "Dagoretti", "Riruta",
    "Embakasi", "Donholm", "Buruburu", "Umoja", "Kayole", "Pipeline", "Fedha", "Utawala",
    "Roysambu", "Kasarani", "Zimmerman", "Githurai", "Kahawa", "Mwiki", "Thome",
    "Muthaiga", "Gigiri", "Runda", "Ruaka", "Kitisuru", "Spring Valley", "Loresho",
    "Gikomba", "Kariobangi", "Huruma", "Mathare", "Ruaraka",
    "Rongai", "Kitengela", "Syokimau", "Ruiru", "Juja"
  ],
  campuses: [
    "UoN Main Campus", "UoN Chiromo", "Kenyatta University (KU)", "JKUAT Juja",
    "Strathmore", "USIU-Africa", "Daystar Valley Road", "TU-K", "MMU Rongai",
    "CUEA Lang'ata", "KCA University", "Zetech Ruiru", "Multimedia Uni", "KMTC Nairobi"
  ],
  nextCities: ["Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Machakos"],

  // Categories. `id` and `label` are also used by the admin and the database,
  // so don't rename an id once plugs use it. The rest is how the tile looks.
  // Add a category = add one line here; its page works automatically.
  categories: [
    { id: "kicks",   label: "Sneakers & Shoes", short: "Kicks", emoji: "👟", tile: "#FF5A36", tagline: "AF1s, dad shoes, Timbs, sandals. Fresh or barely worn.", item: "Sneakers, size ", words: ["sneakers", "shoes", "kicks", "sneaker", "airforce", "af1", "jordans", "boots", "sandals"] },
    { id: "denim",   label: "Denim & Jeans",   short: "Denim", emoji: "👖", tile: "#3B6FE0", tagline: "Baggy, straight, ripped, jorts. Every wash, every size.", item: "Jeans, size ", words: ["jeans", "denim", "trouser", "trousers", "jorts"] },
    { id: "tops",    label: "Tees, Shirts & Hoodies", short: "Tops & Hoodies", emoji: "👕", tile: "#22A65A", tagline: "Vintage tees, hoodies, jackets and shirts for every mood.", item: "Hoodie, size ", words: ["tshirt", "t-shirt", "tee", "shirt", "hoodie", "sweater", "top", "tops", "jacket", "jackets"] },
    { id: "dresses", label: "Dresses & Skirts", short: "Dresses", emoji: "👗", tile: "#D6458F", tagline: "From Sunday best to Saturday out.", item: "Dress, size ", words: ["dress", "dresses", "skirt", "skirts", "gown"] },
    { id: "bags",    label: "Bags & Accessories", short: "Bags & Extras", emoji: "👜", tile: "#8B5CF6", tagline: "Totes, caps, chains, watches. The finishing touch.", item: "Bag: ", words: ["bag", "bags", "handbag", "backpack", "cap", "caps", "belt", "watch", "jewellery", "jewelry"] },
    { id: "phones",  label: "Phones & Gadgets", short: "Gadgets", emoji: "📱", tile: "#111110", tagline: "Phones, earbuds, chargers. Tested before you pay.", item: "Phone / gadget: ", words: ["phone", "phones", "earphones", "airpods", "charger", "gadget", "laptop"] },
    { id: "beauty",  label: "Beauty & Grooming", short: "Beauty", emoji: "💄", tile: "#F28C28", tagline: "Perfume, skincare, hair and wigs from sellers we trust.", item: "Beauty: ", words: ["perfume", "makeup", "skincare", "lotion", "hair", "wig", "wigs"] },
    { id: "home",    label: "Home & Hostel", short: "Hostel & Home", emoji: "🛏️", tile: "#0EA5A4", tagline: "Duvets, curtains, cookers. Make the room feel like home.", item: "For my room: ", words: ["duvet", "bedsheet", "curtain", "curtains", "cooker", "hostel", "home"] }
  ],

  // Verified Plugs. Only add a seller here after they pass all five checks
  // of the Sosick Test. The admin portal has a "Copy for website" button
  // that produces entries in exactly this shape.
  //
  // { name, category, area, sells, link, tested: "2026-11-02", level: "verified" | "trusted" | "top" }
  plugs: []
};
