const CACHE_NAME = 'game-count-to-100-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './countdown.png'
];

// On install, cache all static resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting()) // Activate worker immediately
    );
});

// Clean up old caches on activate
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of all pages immediately
    );
});

// Network-first strategy for HTML and JS files, cache-first for other resources
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                const requestURL = new URL(event.request.url);
                const isHTML = event.request.headers.get('accept')?.includes('text/html');
                const isJS = requestURL.pathname.endsWith('.js');
                
                // For HTML and JS files, always fetch from network first
                if (isHTML || isJS) {
                    // Clone the response before using it to update cache
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    return networkResponse;
                }
                
                // For other files, update cache in background
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                return networkResponse;
            })
            .catch(() => {
                // If network fetch fails, try to return from cache
                return caches.match(event.request);
            })
    );
}); 