// Service Worker for PWA
const CACHE_NAME = 'akash-erp-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Future mein offline support ke liye cache yahan use hoga
});