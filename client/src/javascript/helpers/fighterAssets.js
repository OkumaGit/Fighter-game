const fighterPortraits = {
    Astra: 'resources/fighters/fighter-1.png',
    Kite: 'resources/fighters/fighter-2.png',
    Vex: 'resources/fighters/fighter-3.png',
    Brute: 'resources/fighters/fighter-4.png',
    Nova: 'resources/fighters/fighter-5.png',
    Rift: 'resources/fighters/fighter-6.png'
};

const battleSpritePoses = {
    idle: { folder: 'Idle', prefix: 'Idle', frames: 8, duration: 1200, loop: true },
    jab: { folder: 'Jab', prefix: 'Jab', frames: 8, duration: 360, loop: false },
    kick: { folder: 'Kick', prefix: 'Kick', frames: 8, duration: 420, loop: false },
    block: { folder: 'Block', prefix: 'Block', frames: 8, duration: 260, loop: false },
    jump: { folder: 'Jump', prefix: 'Jump', frames: 8, duration: 420, loop: false }
};

const battleSpritePaths = {
    '1': 'resources/fighters/fighter_1_sprite',
    '2': 'resources/fighters/fighter_2_sprite',
    '3': 'resources/fighters/fighter_3_sprite',
    '4': 'resources/fighters/fighter_4_sprite',
    '5': 'resources/fighters/fighter_5_sprite',
    '6': 'resources/fighters/fighter_6_sprite'
};

const defaultBattleSprite = {
    basePath: battleSpritePaths['1'],
    poses: {
        ...battleSpritePoses
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
    const fighterId = String(fighter._id ?? fighter.id ?? '1');
    const basePath = battleSpritePaths[fighterId] || defaultBattleSprite.basePath;

    return {
        basePath,
        poses: battleSpritePoses
    };
}

export function getBattleFrameSource(fighter, pose, frame) {
    const config = getBattleSpriteConfig(fighter);
    const animation = config.poses[pose] || config.poses.idle;
    return `${config.basePath}/${animation.folder}/${animation.prefix}_${frame + 1}.png`;
}

export function getRandomBattleBackground() {
    return battleBackgrounds[Math.floor(Math.random() * battleBackgrounds.length)];
}
