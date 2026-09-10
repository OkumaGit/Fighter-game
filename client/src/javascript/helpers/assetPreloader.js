const CRITICAL_ASSETS = [
    '/resources/backgrounds/arena-bg.jpg',
    '/resources/backgrounds/arena-bg.webp',
    '/resources/backgrounds/arena-bg.png',
    '/resources/backgrounds/background-1.jpg',
    '/resources/backgrounds/background-2.jpg',
    '/resources/backgrounds/background-3.jpg',
    '/resources/fighters/fighter-1.png',
    '/resources/fighters/fighter-2.png',
    '/resources/fighters/fighter-3.png',
    '/resources/fighters/fighter-4.png',
    '/resources/fighters/fighter-5.png',
    '/resources/fighters/fighter-6.png'
];

export function preloadImage(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => resolve(url);
        img.src = url;
    });
}

export function preloadAllAssets() {
    return Promise.allSettled(CRITICAL_ASSETS.map(preloadImage));
}
