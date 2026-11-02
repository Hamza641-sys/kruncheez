// ═══════════════════════════════════════════════════════
//   KRUNCHEEZ PRINTER AGENT — CONFIGURATION
// ═══════════════════════════════════════════════════════

module.exports = {

  // ── Firebase Config ───────────────────────────────────
  firebase: {
    apiKey: "AIzaSyC0dgHGMjbWeurlKAGNBakp3R-Eg8EIx7Y",
    authDomain: "kruncheez-pos.firebaseapp.com",
    projectId: "kruncheez-pos",
    storageBucket: "kruncheez-pos.firebasestorage.app",
    messagingSenderId: "328549789635",
    appId: "1:328549789635:web:5e3470128cecbcc7a5d776",
  },

  // ── Printer Names (exact Windows names) ──────────────
  counterPrinter: "Counter Printer",   // Customer bill
  kitchenPrinter: "Kitchen Printer",   // Kitchen slip

  // ── Paper Settings ────────────────────────────────────
  paperWidth: 80,
  charsPerLine: 42,

  // ── Print trigger ─────────────────────────────────────
  // Print when order status changes to this value
  printOnStatus: "pending",

  // ── Restaurant Info ───────────────────────────────────
  restaurant: {
    name: "THE KRUNCHEEZ",
    tagline: "Fast Food | Chinese | BBQ",
    address: "Peshawar, Pakistan",
    phone: "0317-7787648",
    website: "kruncheez-pos.web.app",
  },
};
