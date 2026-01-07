// Service Worker for Mark's Narrative Pneumatology PWA
const CACHE_NAME = 'mark-pneumatology-v1';

// Files to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/components.css',
    '/css/visualizations.css',
    '/css/enhanced-components.css',
    '/js/utils/constants.js',
    '/js/utils/helpers.js',
    '/js/utils/api-client.js',
    '/js/data/conll-parser.js',
    '/js/components/enhanced-search.js',
    '/js/components/search-integration.js',
    '/js/components/greek-keyboard.js',
    '/js/components/network-visualization.js',
    '/js/components/timeline-visualization.js',
    '/js/components/text-viewer.js',
    '/js/components/analysis-panel.js',
    '/js/app.js',
    '/mark_complete.conllu',
    '/manifest.json'
];

// External resources (CDN) - cache with network-first strategy
const EXTERNAL_ASSETS = [
    'https://d3js.org/d3.v7.min.js',
    'https://unpkg.com/fuse.js@6.6.2'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.log('[SW] Cache failed:', err))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API requests (they need fresh data)
    if (url.pathname.includes('/api/') ||
        url.hostname.includes('api.anthropic.com') ||
        url.hostname.includes('api.openai.com') ||
        url.hostname.includes('generativelanguage.googleapis.com')) {
        return;
    }

    // For external CDN resources, use network-first strategy
    if (EXTERNAL_ASSETS.some(asset => event.request.url.includes(asset))) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // For local resources, use cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached version and update cache in background
                    fetch(event.request)
                        .then(response => {
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, response));
                        })
                        .catch(() => {});
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Cache successful responses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, responseClone));
                        }
                        return response;
                    })
                    .catch(() => {
                        // Offline fallback for HTML pages
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Handle messages from the main thread
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
