const fighterPortraits = {
    Astra: 'resources/fighters/fighter-1.png',
    Kite: 'resources/fighters/fighter-2.png',
    Vex: 'resources/fighters/fighter-3.png',
    Brute: 'resources/fighters/fighter-4.png',
    Nova: 'resources/fighters/fighter-1.png',
    Rift: 'resources/fighters/fighter-1.png'
};

const fighterBattleSprites = {
    'resources/fighters/fighter-1.png': {
        source: 'resources/fighters/fighter-1-sprite.png',
        sheetWidth: 764,
        sheetHeight: 1024,
        cellWidth: 128,
        cellHeight: 204,
        poses: {
            idle: { row: 0, frames: 6, duration: 1200, loop: true },
            block: { row: 1, frames: 5, duration: 220, loop: false },
            punch: { row: 2, frames: 4, duration: 280, loop: false },
            kick: { row: 3, frames: 3, duration: 280, loop: false },
            victory: { row: 4, frames: 5, duration: 1400, loop: true }
        }
    }
};

const battleBackgrounds = [
    { key: 'steampunk', src: 'resources/backgrounds/background-1.jpg' },
    { key: 'crystal', src: 'resources/backgrounds/background-2.jpg' },
    { key: 'lantern', src: 'resources/backgrounds/background-3.jpg' }
];

export function getFighterSource(fighter = {}) {
    return (
        fighterPortraits[fighter.name] || fighter.source || fighter.image || fighter.sprite || fighterPortraits.Astra
    );
}

export function getBattleSpriteConfig(fighter = {}) {
    const source = getFighterSource(fighter);

    return fighterBattleSprites[source] || null;
}

export function getRandomBattleBackground() {
    return battleBackgrounds[Math.floor(Math.random() * battleBackgrounds.length)];
}
