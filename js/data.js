// Game content. Teachers can edit prices, places and lines here without touching the game logic.
// Prices are sample values for the game, close to Metro Manila prices in 2026.
window.GAME_DATA = {
  startCash: 1000,
  days: 5,
  typhoonDay: 4,

  products: [
    { id: "kape",    name: "Kape 3-in-1",    emoji: "☕", pack: "10 sachet",     size: 10, packPrice: 90 },
    { id: "canton",  name: "Pancit canton",  emoji: "🍜", pack: "6 piraso",      size: 6,  packPrice: 96 },
    { id: "sardinas",name: "Sardinas",       emoji: "🥫", pack: "6 lata",        size: 6,  packPrice: 156 },
    { id: "itlog",   name: "Itlog",          emoji: "🥚", pack: "1 tray (30)",   size: 30, packPrice: 240 },
    { id: "juice",   name: "Juice drink",    emoji: "🧃", pack: "10 piraso",     size: 10, packPrice: 100 },
    { id: "biskwit", name: "Biskwit",        emoji: "🍪", pack: "10 piraso",     size: 10, packPrice: 70 },
    { id: "shampoo", name: "Shampoo sachet", emoji: "🧴", pack: "12 sachet",     size: 12, packPrice: 78 },
    { id: "kandila", name: "Kandila",        emoji: "🕯️", pack: "12 piraso",     size: 12, packPrice: 72 }
  ],

  // Jeepney fare used in the game: base fare covers the first 4 km, then a fixed rate per extra km.
  fare: { base: 13, baseKm: 4, perKm: 1.8, studentDiscount: 0.2 },

  suppliers: [
    { id: "libertad", name: "Libertad Market", km: 3,  discount: 0,    note: "Malapit, karaniwang presyo." },
    { id: "divisoria", name: "Divisoria",      km: 10, discount: 0.1,  note: "Malayo, pero 10% mas mura ang bultuhan." }
  ],

  markups: [
    { value: 0.1, label: "10%", demand: 1.25, note: "Mura, maraming bibili" },
    { value: 0.2, label: "20%", demand: 1.0,  note: "Katamtaman" },
    { value: 0.3, label: "30%", demand: 0.75, note: "Mahal, kaunti ang bibili" }
  ],

  customers: [
    { name: "Aling Nena", face: "👵", honest: true },
    { name: "Mang Ben",   face: "👴", honest: true },
    { name: "Kuya Jun",   face: "👨", honest: false },
    { name: "Ate Joy",    face: "👩", honest: true },
    { name: "Totoy",      face: "👦", honest: false },
    { name: "Inday",      face: "👧", honest: true },
    { name: "Ate Grace",  face: "👩‍🦱", honest: false },
    { name: "Kuya Rey",   face: "🧔", honest: true },
    { name: "Lola Caring",face: "👵", honest: true },
    { name: "Sir Mark",   face: "👨‍🏫", honest: true }
  ],

  greetings: ["Pabili po!", "Tao po! Pabili.", "Ate, pabili ako.", "Kuya, pabili!", "Magandang umaga! Pabili po."],

  // Items people buy more of when a typhoon is coming.
  typhoonItems: ["kandila", "sardinas", "canton"],

  denominations: [1, 5, 10, 20, 50, 100, 200]
};
