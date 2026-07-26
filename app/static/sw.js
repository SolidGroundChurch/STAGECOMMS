/**
 * StageComms Service Worker
 * Enables offline functionality and caching for PWA
 */

const CACHE_NAME = 'stagecomms-v1';
const RUNTIME_CACHE = 'stagecomms-runtime-v1';
const AUDIO_CACHE = 'stagecomms-audio-v1';

const urlsToCache = [
    '/',
    '/static/css/main.css',
    '/static/js/app.js',
    '/static/manifest.json',
    '/static/favicon.svg',
];

// ============================================
// INSTALL
// ============================================

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// ============================================
// ACTIVATE
// ============================================

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== RUNTIME_CACHE && 
                            cacheName !== AUDIO_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ============================================
// FETCH
// ============================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip WebSocket requests
    if (url.protocol === 'ws:' || url.protocol === 'wss:') {
        return;
    }

    // Handle different request types
    if (request.method !== 'GET') {
        // Don't cache non-GET requests
        event.respondWith(
            fetch(request).catch(() => {
                return new Response('Offline - operation not available', {
                    status: 503,
                    statusText: 'Service Unavailable',
                });
            })
        );
        return;
    }

    // API requests - network first, fallback to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const cache = url.pathname.includes('/audio') ? AUDIO_CACHE : RUNTIME_CACHE;
                        caches.open(cache).then((c) => c.put(request, response.clone()));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then((response) => response || new Response('Offline - no cached data', {
                            status: 503,
                        }));
                })
        );
        return;
    }

    // Audio files - cache first, network fallback
    if (url.pathname.includes('/audio/') || url.pathname.includes('/uploads/')) {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) return response;
                    
                    return fetch(request)
                        .then((response) => {
                            if (!response || response.status !== 200) {
                                return response;
                            }
                            
                            const responseToCache = response.clone();
                            caches.open(AUDIO_CACHE)
                                .then((cache) => cache.put(request, responseToCache));
                            
                            return response;
                        })
                        .catch(() => {
                            return new Response('Audio not available offline', {
                                status: 503,
                            });
                        });
                })
        );
        return;
    }

    // Static assets - cache first, network fallback
    event.respondWith(
        caches.match(request)
            .then((response) => {
                if (response) return response;
                
                return fetch(request)
                    .then((response) => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(request, responseToCache));
                        
                        return response;
                    })
                    .catch(() => {
                        // Fallback responses
                        if (request.destination === 'document') {
                            return caches.match('/');
                        }
                        if (request.destination === 'style') {
                            return new Response('/* Offline */', {
                                headers: { 'Content-Type': 'text/css' },
                            });
                        }
                        if (request.destination === 'script') {
                            return new Response('// Offline', {
                                headers: { 'Content-Type': 'application/javascript' },
                            });
                        }
                    });
            })
    );
});

// ============================================
// MESSAGE HANDLING
// ============================================

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
