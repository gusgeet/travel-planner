const CACHE_NAME = "travel-planner-v1"
const APP_SHELL = ["/", "/manifest.webmanifest", "/placeholder-logo.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse
      return fetch(event.request)
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const destination = event.notification.data?.url || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(destination)
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(destination)
      }
    })
  )
})
