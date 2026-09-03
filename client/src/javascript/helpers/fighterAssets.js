const fighterPortraits = {
    Astra: 'resources/fighters/fighter-1.png',
    Kite: 'resources/fighters/fighter-2.png',
    Vex: 'resources/fighters/fighter-3.png',
    Brute: 'resources/fighters/fighter-4.png',
    Nova: 'resources/fighters/fighter-1.png',
    Rift: 'resources/fighters/fighter-1.png'
};

const astraBattleSprite = {
    basePath: 'resources/fighters/fighter_1_sprite',
    poses: {
        idle: { folder: 'Idle', prefix: 'Idle', frames: 5, duration: 1200, loop: true },
        jab: { folder: 'Jab', prefix: 'Jab', frames: 5, duration: 360, loop: false },
        kick: { folder: 'Kick', prefix: 'Kick', frames: 5, duration: 420, loop: false },
        block: { folder: 'Block', prefix: 'Block', frames: 4, duration: 260, loop: false },
        jump: { folder: 'Jump', prefix: 'Jump', frames: 5, duration: 420, loop: false }
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

export function getBattleSpriteConfig() {
    return astraBattleSprite;
}

export function getBattleFrameSource(pose, frame) {
    const animation = astraBattleSprite.poses[pose] || astraBattleSprite.poses.idle;
    return `${astraBattleSprite.basePath}/${animation.folder}/${animation.prefix}_${frame + 1}.png`;
}

export function getRandomBattleBackground() {
    return battleBackgrounds[Math.floor(Math.random() * battleBackgrounds.length)];
}
