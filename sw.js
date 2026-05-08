// Service Worker — handles push notifications in background
self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Nuovo ordine Eldorado!";
  const options = {
    body: data.body || "Hai ricevuto un nuovo ordine.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: { orderId: data.orderId },
    actions: [{ action: "view", title: "Vedi ordine" }]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(clients.claim()));
