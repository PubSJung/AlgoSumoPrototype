
self.addEventListener("install", (ev) => {
    ev.waitUntil(caches.open("sw-cache").then(
        (cache) => {
            return cache.addAll([

                "/app-content/css/fonts/Nunito.ttf",
                "/app-content/css/fonts/Teko.ttf",
                "/app-content/css/theme/defaults/colors.css",
                "/app-content/css/theme/defaults/fonts.css",
                "/app-content/css/theme/bright-theme.css",
                "/app-content/css/master.css",

                "/app-frame/app-logo.png",
                "/app-frame/app-frame.css",
                "/app-frame/app-frame.js",

                "/favicon.ico",
                "/"

            ]);
        }
    ));
});

self.addEventListener("fetch", (ev) => {
    ev.respondWith(caches.match(ev.request).then((response) => {
        return response || fetch(ev.request);     
    }));
});
