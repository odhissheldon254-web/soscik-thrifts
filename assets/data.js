// Sosick Thrifts: everything the public site reads lives here.
// Change a value, save, refresh. No other file needs touching.
window.SOSICK = {
  brand: "Sosick Thrifts",
  owner: "VosteyArts",
  whatsapp: "254112275881",        // international format for wa.me links
  whatsappDisplay: "0112 275 881", // how it shows on the page
  city: "Nairobi",

  // Supabase (VosteyArts' own account). This key is the PUBLIC one; it is
  // meant to be in the website. Database rules decide what it can do.
  supabaseUrl: "https://esluujzrscwswxjehkrm.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbHV1anpyc2N3c3d4amVoa3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NzgyODIsImV4cCI6MjEwODQ1NDI4Mn0.sSMmIE7bRZX3EXCRZnrG6HCS4BZRGeTev99EExuigSI",

  // Delivery is always charged. Put the starting price here once VosteyArts
  // settles it (e.g. 150) and the site shows "from KES 150". Leave null to
  // just say the fee is confirmed on WhatsApp.
  deliveryFeeFrom: null,

  // Extra charges (service fee, rush, late-night, per km) stay off until
  // VosteyArts switches them on in the admin. Then set this to true so the
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

  categories: [
    { id: "denim",   label: "Denim & Jeans",   words: ["jeans", "denim", "trouser", "trousers", "jorts"] },
    { id: "kicks",   label: "Sneakers & Shoes", words: ["sneakers", "shoes", "kicks", "sneaker", "airforce", "af1", "jordans", "boots", "sandals"] },
    { id: "tops",    label: "Tees, Shirts & Hoodies", words: ["tshirt", "t-shirt", "tee", "shirt", "hoodie", "sweater", "top", "tops", "jacket", "jackets"] },
    { id: "dresses", label: "Dresses & Skirts", words: ["dress", "dresses", "skirt", "skirts", "gown"] },
    { id: "bags",    label: "Bags & Accessories", words: ["bag", "bags", "handbag", "backpack", "cap", "caps", "belt", "watch", "jewellery", "jewelry"] },
    { id: "phones",  label: "Phones & Gadgets", words: ["phone", "phones", "earphones", "airpods", "charger", "gadget", "laptop"] },
    { id: "beauty",  label: "Beauty & Grooming", words: ["perfume", "makeup", "skincare", "lotion", "hair", "wig", "wigs"] },
    { id: "home",    label: "Home & Hostel", words: ["duvet", "bedsheet", "curtain", "curtains", "cooker", "hostel", "home"] }
  ],

  // Verified Plugs. Only add a seller here after they pass all five checks
  // of the Sosick Test. The admin portal has a "Copy for website" button
  // that produces entries in exactly this shape.
  //
  // { name, category, area, sells, link, tested: "2026-11-02", level: "verified" | "trusted" | "top" }
  plugs: []
};
