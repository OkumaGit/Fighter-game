import { getFighterSource } from './fighterAssets';

export const FIGHTER_LORE = {
    '1': {
        id: '1',
        name: 'Astra',
        element: 'Fire Magic',
        elementIcon: '🔥',
        color: '#f97316',
        gradient: 'linear-gradient(135deg, #ea580c, #f97316, #fbbf24)',
        specialName: 'Fireball',
        specialDesc: 'Long-range fiery projectile that detonates on impact.',
        superName: 'Inferno Storm',
        superDesc: 'Devastating vortex of primordial flame. Unblockable (24 DMG).'
    },
    '2': {
        id: '2',
        name: 'Kite',
        element: 'Plasma Magic',
        elementIcon: '⚡',
        color: '#38bdf8',
        gradient: 'linear-gradient(135deg, #0284c7, #38bdf8, #a5f3fc)',
        specialName: 'Plasma Bolt',
        specialDesc: 'High-velocity ionized energy sphere of hyper plasma.',
        superName: 'Plasma Core Overload',
        superDesc: 'Thermonuclear plasma explosion breaking all defenses. Unblockable (24 DMG).'
    },
    '3': {
        id: '3',
        name: 'Vex',
        element: 'Iron Magic',
        elementIcon: '⚙',
        color: '#c084fc',
        gradient: 'linear-gradient(135deg, #7e22ce, #c084fc, #e9d5ff)',
        specialName: 'Shadow Blink',
        specialDesc: 'Instant spatial blink teleporting behind the opponent.',
        superName: 'Iron Tempest Cataclysm',
        superDesc: 'Cataclysmic surge of metallic blades and dark aura. Unblockable (24 DMG).'
    },
    '4': {
        id: '4',
        name: 'Brute',
        element: 'Air Dragon Magic',
        elementIcon: '🌪',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #047857, #10b981, #6ee7b7)',
        specialName: 'Dragon Gale',
        specialDesc: 'Fierce gale of dragon wind that knocks down foes.',
        superName: 'Dragon Tempest Cyclone',
        superDesc: 'Unstoppable dragon rage tornado ripping through guard. Unblockable (24 DMG).'
    },
    '5': {
        id: '5',
        name: 'Nova',
        element: 'Sand Magic',
        elementIcon: '⏳',
        color: '#eab308',
        gradient: 'linear-gradient(135deg, #b45309, #eab308, #fef08a)',
        specialName: 'Sand Surge',
        specialDesc: 'Blistering slide through desert sand delivering a crushing strike.',
        superName: 'Sandstorm Oblivion',
        superDesc: 'Ancient desert tempest eroding all defense to dust. Unblockable (24 DMG).'
    },
    '6': {
        id: '6',
        name: 'Rift',
        element: 'Lightning Magic',
        elementIcon: '⚡',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6, #c4b5fd)',
        specialName: 'Lightning Discharge',
        specialDesc: 'High-voltage ball lightning that shocks and paralyzes on hit.',
        superName: 'Thunder Overdrive Surge',
        superDesc: 'Colossal electric arc discharge with extreme voltage. Unblockable (24 DMG).'
    }
};

const nameToId = {
    Astra: '1',
    Kite: '2',
    Vex: '3',
    Brute: '4',
    Nova: '5',
    Rift: '6'
};

export function getFighterLore(fighter = {}) {
    const rawId = String(fighter._id ?? fighter.id ?? nameToId[fighter.name] ?? '1');
    const baseLore = FIGHTER_LORE[rawId] || FIGHTER_LORE['1'];
    return {
        ...baseLore,
        portrait: getFighterSource(fighter)
    };
}
