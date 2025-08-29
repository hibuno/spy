// Service Worker for The Spy Project PWA
const CACHE_NAME = 'spy-project-v1.0.0';
const OFFLINE_URL = '/offline';

// Assets to cache immediately
const STATIC_CACHE_URLS = [
	'/',
	'/manifest.json',
	'/offline',
	'/globals.css',
	// Cache icons
	'/android/android-launchericon-192-192.png',
	'/android/android-launchericon-512-512.png',
	'/ios/180.png',
	'/logo/logo.png',
	// Cache fonts and other static assets
	'https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&display=swap',
	'https://fonts.googleapis.com/css2?family=Fira+Mono:wght@500&display=swap'
];

// API endpoints to cache with network-first strategy
const API_CACHE_URLS = [
	'/api/trending',
	'/api/paper',
	'/api/images'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
	console.log('[SW] Install event');
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			console.log('[SW] Caching static assets');
			await cache.addAll(STATIC_CACHE_URLS);
			// Skip waiting to activate immediately
			self.skipWaiting();
		})()
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	console.log('[SW] Activate event');
	event.waitUntil(
		(async () => {
			// Clean up old caches
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						console.log('[SW] Deleting old cache:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
			// Take control of all clients
			await self.clients.claim();
		})()
	);
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Handle different types of requests
	if (request.method !== 'GET') return;

	// API requests - Network first, fallback to cache
	if (API_CACHE_URLS.some(apiUrl => url.pathname.startsWith(apiUrl))) {
		event.respondWith(networkFirstStrategy(request));
		return;
	}

	// Static assets and pages - Cache first, fallback to network
	if (request.destination === 'document' ||
		request.destination === 'style' ||
		request.destination === 'script' ||
		request.destination === 'image' ||
		request.destination === 'font') {
		event.respondWith(cacheFirstStrategy(request));
		return;
	}

	// Default - Network first for other requests
	event.respondWith(networkFirstStrategy(request));
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
	try {
		const cachedResponse = await caches.match(request);
		if (cachedResponse) {
			return cachedResponse;
		}

		const networkResponse = await fetch(request);
		if (networkResponse.ok) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, networkResponse.clone());
		}
		return networkResponse;
	} catch (error) {
		console.log('[SW] Cache-first strategy failed:', error);
		// Return offline page for navigation requests
		if (request.mode === 'navigate') {
			const cache = await caches.open(CACHE_NAME);
			return cache.match(OFFLINE_URL);
		}
		throw error;
	}
}

// Network-first strategy for dynamic content
async function networkFirstStrategy(request) {
	try {
		const networkResponse = await fetch(request);
		if (networkResponse.ok) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, networkResponse.clone());
		}
		return networkResponse;
	} catch (error) {
		console.log('[SW] Network-first strategy failed, trying cache:', error);
		const cachedResponse = await caches.match(request);
		if (cachedResponse) {
			return cachedResponse;
		}

		// Return offline page for navigation requests
		if (request.mode === 'navigate') {
			const cache = await caches.open(CACHE_NAME);
			return cache.match(OFFLINE_URL);
		}

		throw error;
	}
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
	console.log('[SW] Background sync event:', event.tag);

	if (event.tag === 'background-sync') {
		event.waitUntil(doBackgroundSync());
	}
});

// Handle background sync
async function doBackgroundSync() {
	try {
		// Get pending actions from IndexedDB or similar
		const pendingActions = await getPendingActions();

		for (const action of pendingActions) {
			try {
				await fetch(action.url, action.options);
				// Remove from pending actions
				await removePendingAction(action.id);
			} catch (error) {
				console.log('[SW] Background sync failed for action:', action.id, error);
			}
		}
	} catch (error) {
		console.log('[SW] Background sync failed:', error);
	}
}

// Handle push notifications (if implemented)
self.addEventListener('push', (event) => {
	console.log('[SW] Push event received');

	if (event.data) {
		const data = event.data.json();
		const options = {
			body: data.body,
			icon: '/android/android-launchericon-192-192.png',
			badge: '/android/android-launchericon-96-96.png',
			vibrate: [100, 50, 100],
			data: {
				url: data.url || '/'
			}
		};

		event.waitUntil(
			self.registration.showNotification(data.title || 'The Spy Project', options)
		);
	}
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
	console.log('[SW] Notification click event');

	event.notification.close();

	event.waitUntil(
		clients.openWindow(event.notification.data?.url || '/')
	);
});

// Helper functions for pending actions (would use IndexedDB in production)
async function getPendingActions() {
	// In a real implementation, this would query IndexedDB
	return [];
}

async function removePendingAction(id) {
	// In a real implementation, this would remove from IndexedDB
	console.log('[SW] Would remove pending action:', id);
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
	console.log('[SW] Message received:', event.data);

	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	if (event.data && event.data.type === 'GET_VERSION') {
		event.ports[0].postMessage({ version: CACHE_NAME });
	}
});