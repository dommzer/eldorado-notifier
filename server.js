const express = require("express");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// ─── DATA STORAGE ────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, "orders.json");
const SUBS_FILE = path.join(__dirname, "subscriptions.json");

function loadJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── WEB PUSH SETUP ──────────────────────────────────────────
// Generate VAPID keys once with: npx web-push generate-vapid-keys
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || "mailto:admin@eldorado-notifier.app";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// ─── ROUTES ──────────────────────────────────────────────────

// Google Apps Script calls this when a new order arrives
app.post("/api/order", (req, res) => {
  const { orderId, shortId, game, category, price, date } = req.body;
  if (!orderId) return res.status(400).json({ error: "Missing orderId" });

  const orders = loadJSON(DATA_FILE, []);

  // Avoid duplicates
  if (orders.find(o => o.orderId === orderId)) {
    return res.json({ status: "duplicate" });
  }

  const order = { orderId, shortId, game, category, price, date, receivedAt: new Date().toISOString() };
  orders.unshift(order); // newest first
  saveJSON(DATA_FILE, orders);

  // Send push notification to all subscribers
  const subs = loadJSON(SUBS_FILE, []);
  const payload = JSON.stringify({
    title: `🛒 Nuovo ordine — ${price}`,
    body: `${game} · ${category}`,
    orderId: shortId
  });

  subs.forEach(sub => {
    webpush.sendNotification(sub, payload).catch(err => {
      console.error("Push error:", err.statusCode);
    });
  });

  res.json({ status: "ok", order });
});

// Get all orders
app.get("/api/orders", (req, res) => {
  res.json(loadJSON(DATA_FILE, []));
});

// Save push subscription
app.post("/api/subscribe", (req, res) => {
  const sub = req.body;
  const subs = loadJSON(SUBS_FILE, []);
  const exists = subs.find(s => s.endpoint === sub.endpoint);
  if (!exists) {
    subs.push(sub);
    saveJSON(SUBS_FILE, subs);
  }
  res.json({ status: "subscribed" });
});

// Expose VAPID public key to client
app.get("/api/vapid-public", (req, res) => {
  res.json({ key: VAPID_PUBLIC });
});

// ─── START ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Eldorado Notifier running on port ${PORT}`));
