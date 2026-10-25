// Service Worker for PWA Install
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());
self.addEventListener('fetch', () => {}); // Ye line sabse zaroori hai