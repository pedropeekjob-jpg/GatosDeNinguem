// Notifications for "Avisem-me quando chegarem gatos". Only shows what the API sends; caches nothing.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* not JSON */ }
  const title = data.title || "Gatos de Ninguém";
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || "Há um gato novo para adoção.",
    icon: "/icon-192.png",
    image: data.image,
    lang: "pt-PT",
    data: { url: data.url || "/adotar" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/adotar";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url === url && "focus" in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
