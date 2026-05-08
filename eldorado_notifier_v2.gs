// ─── CONFIG ───────────────────────────────────────────────────────────────────
const WEBHOOK_URL  = "IL_TUO_NUOVO_DISCORD_WEBHOOK_QUI";
const SERVER_URL   = "IL_TUO_SERVER_RAILWAY_URL_QUI"; // es. https://eldorado-notifier.up.railway.app
const LABEL_NAME   = "eldorado-notified";
// ──────────────────────────────────────────────────────────────────────────────

function checkOrders() {
  const threads = GmailApp.search(
    'from:noreply@eldorado.gg subject:"New Order" -label:' + LABEL_NAME
  );
  if (threads.length === 0) return;

  let label = GmailApp.getUserLabelByName(LABEL_NAME);
  if (!label) label = GmailApp.createLabel(LABEL_NAME);

  for (const thread of threads) {
    const messages = thread.getMessages();
    const msg      = messages[messages.length - 1];
    const body     = msg.getPlainBody();
    const date     = msg.getDate().toLocaleString("it-IT");

    const orderInfo = parseOrderEmail(body);

    const discordOk = sendToDiscord(orderInfo, date);
    sendToApp(orderInfo, date); // send to PWA server (non-blocking)

    if (discordOk) {
      thread.addLabel(label);
    }
  }
}

function parseOrderEmail(body) {
  const orderId  = (body.match(/Order ID:\s*([^\r\n]+)/i)    || [])[1]?.trim() || "N/A";
  const category = (body.match(/Category:\s*([^\r\n]+)/i)    || [])[1]?.trim() || "N/A";
  const game     = (body.match(/Game:\s*([^\r\n]+)/i)        || [])[1]?.trim() || "N/A";
  const price    = (body.match(/Order price:\s*([^\r\n]+)/i) || [])[1]?.trim() || "N/A";
  const shortId  = orderId !== "N/A" ? orderId.split("-")[0].toUpperCase() : "N/A";
  return { orderId, shortId, category, game, price };
}

function sendToDiscord(order, date) {
  const parsed = order.orderId !== "N/A";
  const embed = {
    username: "Eldorado Orders",
    avatar_url: "https://i.imgur.com/ehFf9uf.png",
    content: "@here",
    embeds: [{
      title:  "🛒 New Order Received!",
      color:  parsed ? 0x00C853 : 0xFFD600,
      fields: parsed
        ? [
            { name: "🪪 Order ID",  value: `\`${order.shortId}\``, inline: true },
            { name: "💰 Price",     value: order.price,            inline: true },
            { name: "🕒 Time",      value: date,                   inline: true },
            { name: "🎮 Game",      value: order.game,             inline: true },
            { name: "📂 Category",  value: order.category,         inline: true },
          ]
        : [{ name: "⚠️ Parse failed", value: "Controlla Gmail.", inline: false }],
      footer: { text: "Eldorado.gg · " + (parsed ? `Full ID: ${order.orderId}` : "Auto-notifier") }
    }]
  };

  const response = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post", contentType: "application/json",
    payload: JSON.stringify(embed), muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  if (code !== 204) { Logger.log("Discord error " + code); return false; }
  return true;
}

function sendToApp(order, date) {
  if (!SERVER_URL || SERVER_URL.includes("IL_TUO")) return; // skip if not configured
  try {
    UrlFetchApp.fetch(SERVER_URL + "/api/order", {
      method: "post", contentType: "application/json",
      payload: JSON.stringify({ ...order, date }),
      muteHttpExceptions: true
    });
  } catch(e) {
    Logger.log("App server error: " + e);
  }
}

function testWebhook() {
  const fakeOrder = {
    orderId: "857be37a-1a31-488c-8fbb-7b0376093780",
    shortId: "857BE37A", category: "Accounts", game: "Roblox", price: "9.90 USD"
  };
  sendToDiscord(fakeOrder, new Date().toLocaleString("it-IT"));
  sendToApp(fakeOrder, new Date().toLocaleString("it-IT"));
  Logger.log("Test inviato!");
}
