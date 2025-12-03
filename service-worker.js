// Service Worker для PWA
const CACHE_NAME = 'ucheban5-plus-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Файлы для кэширования при установке
const STATIC_FILES = [
    '/',
    '/index.html',
    '/column-math.html',
    '/notes.html',
    '/activate.html',
    '/buy-key.html',
    '/style.css',
    '/app.js',
    '/equation-solver.js',
    '/column-math.js',
    '/notes-manager.js',
    '/key-system.js',
    '/manifest.json'
];

// Иконки для кэширования
const ICONS = [
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Установка');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Кэширование статических файлов');
                return cache.addAll([...STATIC_FILES, ...ICONS]);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Активация');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Очистка старого кэша', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    // Пропускаем запросы к API и внешним ресурсам
    if (event.request.url.includes('api.') || 
        event.request.url.includes('googleapis') ||
        event.request.url.includes('gstatic')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем из кэша если есть
                if (response) {
                    return response;
                }
                
                // Иначе делаем запрос
                return fetch(event.request)
                    .then(fetchResponse => {
                        // Клонируем ответ
                        const responseToCache = fetchResponse.clone();
                        
                        // Кэшируем динамические данные
                        if (event.request.method === 'GET') {
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        
                        return fetchResponse;
                    })
                    .catch(error => {
                        // Для HTML страниц возвращаем оффлайн страницу
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        
                        // Для других типов возвращаем заглушку
                        return new Response('Оффлайн режим', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Фоновая синхронизация (если понадобится в будущем)
self.addEventListener('sync', event => {
    console.log('Service Worker: Фоновая синхронизация', event.tag);
});

// Push-уведомления (если понадобится в будущем)
self.addEventListener('push', event => {
    console.log('Service Worker: Push уведомление', event);
    
    const title = 'УчебаНа5+';
    const options = {
        body: 'Новое уведомление',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Клик по уведомлению');
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});
