// Service worker de Avbakeryshop (generado por el AppEditor).
// Permite instalar la app en el celular (sin barra de dirección), da un respaldo
// offline básico y muestra las notificaciones push. Siempre intenta traer la
// versión más nueva de la red primero.
const CACHE_NAME = 'avbakeryshop-shell-2026-10-11.1';
const APP_TITLE = 'Avbakeryshop';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL).catch(function(){}); }));
  self.skipWaiting();
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  if(new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res && res.status === 200){ const clone = res.clone(); caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); }); }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(cached){ return cached || caches.match('./index.html'); });
    })
  );
});
// Notificaciones push: el Apps Script manda payloads "solo datos".
self.addEventListener('push', function(e){
  let payload = {};
  try{ payload = e.data ? e.data.json() : {}; }catch(err){ payload = {}; }
  const data = payload.data || payload || {};
  const title = data.title || APP_TITLE;
  e.waitUntil(self.registration.showNotification(title, {
    body: data.body || '', icon: './icon-192.png', badge: './icon-192.png', data: { screen: data.screen || 'home' }
  }));
});
self.addEventListener('notificationclick', function(e){
  const isCookTimer = e.notification.data && e.notification.data.type === 'cook-timer';
  if(isCookTimer && (e.action === 'cook-pause' || e.action === 'cook-resume' || e.action === 'cook-stop')){
    if(e.action === 'cook-stop') e.notification.close();
    e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
      list.forEach(function(c){ c.postMessage({ type:'app-cook-timer-action', action: e.action }); });
      if(!list.length && self.clients.openWindow) return self.clients.openWindow('./index.html?goto=home');
    }));
    return;
  }
  e.notification.close();
  const screen = (e.notification.data && e.notification.data.screen) || 'home';
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
    for(let i = 0; i < list.length; i++){
      if('focus' in list[i]){ list[i].postMessage({ type:'app-notification-nav', screen: screen }); return list[i].focus(); }
    }
    if(self.clients.openWindow) return self.clients.openWindow('./index.html?goto=' + encodeURIComponent(screen));
  }));
});
