// Push notification handler
self.addEventListener('push', function (event) {
  // event.waitUntil(self.registration.showNotification("This is a test from hell!", { body: "this is the body of hell", icon: '/icon.png', data: { url: "https://dtech.vision"} }))
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: data.data,
      requireInteraction: true,
      actions: [{
        action: 'open',
        title: 'View'
      }]
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

// Notification click handler
self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const urlToOpen = event.notification.data.url || "https://super.sc"
  console.log('Opening URL:', urlToOpen)

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(urlToOpen)
    })
  )
})