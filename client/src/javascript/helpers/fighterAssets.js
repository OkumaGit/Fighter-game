const fighterPortraits = {
    Astra: '/resources/fighters/fighter-1.png',
    Kite: '/resources/fighters/fighter-2.png',
    Vex: '/resources/fighters/fighter-3.png',
    Brute: '/resources/fighters/fighter-4.png',
    Nova: '/resources/fighters/fighter-5.png',
    Rift: '/resources/fighters/fighter-6.png'
};

const battleSpritePoses = {
    idle: { file: 'idle.webp', folder: 'Idle', prefix: 'Idle', frames: 8, duration: 1200, loop: true },
    walk: { file: 'walk.webp', folder: 'Walk', prefix: 'Walk', frames: 8, duration: 800, loop: true },
    jab: { file: 'jab.webp', folder: 'Jab', prefix: 'Jab', frames: 8, duration: 360, loop: false },
    kick: { file: 'kick.webp', folder: 'Kick', prefix: 'Kick', frames: 8, duration: 420, loop: false },
    uppercut: { file: 'uppercut.webp', folder: 'Uppercut', prefix: 'Uppercut', frames: 8, duration: 450, loop: false },
    sweep: { file: 'sweep.webp', folder: 'Sweep', prefix: 'Sweep', frames: 8, duration: 450, loop: false },
    special: { file: 'special.webp', folder: 'Special', prefix: 'Special', frames: 8, duration: 500, loop: false },
    jump: { file: 'jump.webp', folder: 'Jump', prefix: 'Jump', frames: 8, duration: 420, loop: false },
    jumpkick: { file: 'jumpkick.webp', folder: 'JumpKick', prefix: 'JumpKick', frames: 8, duration: 420, loop: false },
    block: { file: 'block.webp', folder: 'Block', prefix: 'Block', frames: 8, duration: 260, loop: false },
    hit: { file: 'hit.webp', folder: 'Hit', prefix: 'Hit', frames: 8, duration: 320, loop: false },
    fall: { file: 'fall.webp', folder: 'Fall', prefix: 'Fall', frames: 8, duration: 600, loop: false },
    getup: { file: 'getup.webp', folder: 'GetUp', prefix: 'GetUp', frames: 8, duration: 450, loop: false },
    death: { file: 'death.webp', folder: 'Death', prefix: 'Death', frames: 8, duration: 700, loop: false },
    dizzy: { file: 'dizzy.webp', folder: 'Dizzy', prefix: 'Dizzy', frames: 8, duration: 900, loop: true },
    super: { file: 'super.webp', folder: 'Super', prefix: 'Super', frames: 8, duration: 800, loop: false }
};

const battleSpritePaths = {
    '1': '/resources/fighters/fighter_1_sprite',
    '2': '/resources/fighters/fighter_2_sprite',
    '3': '/resources/fighters/fighter_3_sprite',
    '4': '/resources/fighters/fighter_4_sprite',
    '5': '/resources/fighters/fighter_5_sprite',
    '6': '/resources/fighters/fighter_6_sprite'
};

const defaultBattleSprite = {
    basePath: battleSpritePaths['1'],
    poses: {
        ...battleSpritePoses
    }
};

const battleBackgrounds = [
    { key: 'steampunk', src: '/resources/backgrounds/background-1.jpg' },
    { key: 'crystal', src: '/resources/backgrounds/background-2.jpg' },
    { key: 'lantern', src: '/resources/backgrounds/background-3.jpg' }
];

const fighterIdToPortrait = {
    '1': '/resources/fighters/fighter-1.png',
    '2': '/resources/fighters/fighter-2.png',
    '3': '/resources/fighters/fighter-3.png',
    '4': '/resources/fighters/fighter-4.png',
    '5': '/resources/fighters/fighter-5.png',
    '6': '/resources/fighters/fighter-6.png'
};

const fighterNameToId = {
    Astra: '1',
    Kite: '2',
    Vex: '3',
    Brute: '4',
    Nova: '5',
    Rift: '6'
};

export function getFighterSource(fighter = {}) {
    if (!fighter) return fighterPortraits.Astra;
    if (fighter.name && fighterPortraits[fighter.name]) {
        return fighterPortraits[fighter.name];
    }
    const fighterId = String(fighter._id ?? fighter.id ?? fighterNameToId[fighter.name] ?? '');
    if (fighterId && fighterIdToPortrait[fighterId]) {
        return fighterIdToPortrait[fighterId];
    }
    if (fighter.name) {
        const foundKey = Object.keys(fighterPortraits).find(k => k.toLowerCase() === fighter.name.toLowerCase());
        if (foundKey) return fighterPortraits[foundKey];
    }
    return fighter.source || fighter.image || fighter.sprite || fighterPortraits.Astra;
}

export function getFighterVideoSource() {
    return null;
}

export function getBattleSpriteConfig(fighter = {}) {
    const fighterId = String(fighter._id ?? fighter.id ?? fighterNameToId[fighter.name] ?? '1');
    const basePath = battleSpritePaths[fighterId] || defaultBattleSprite.basePath;

    return {
        basePath,
        poses: battleSpritePoses
    };
}

export function getBattleSpriteSheetSource(fighter, pose) {
    const config = getBattleSpriteConfig(fighter);
    const animation = config.poses[pose] || config.poses.idle;
    const filename = animation.file || `${pose.toLowerCase()}.webp`;
    return `${config.basePath}/${filename}`;
}

export function getBattleFrameSource(fighter, pose, frame) {
    const config = getBattleSpriteConfig(fighter);
    const animation = config.poses[pose] || config.poses.idle;
    return `${config.basePath}/${animation.folder}/${animation.prefix}_${frame + 1}.png`;
}

export function getRandomBattleBackground() {
    return battleBackgrounds[Math.floor(Math.random() * battleBackgrounds.length)];
}
