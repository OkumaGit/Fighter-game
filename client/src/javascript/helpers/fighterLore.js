import { getFighterSource } from './fighterAssets';

export const FIGHTER_LORE = {
    '1': {
        id: '1',
        name: 'Astra',
        ruName: 'Астра',
        element: 'Огонь',
        elementEn: 'Fire',
        elementIcon: '🔥',
        color: '#f97316',
        gradient: 'linear-gradient(135deg, #ea580c, #f97316, #fbbf24)',
        specialName: 'Огненный шар (Fireball)',
        specialDesc: 'Дальнобойный сгусток огненной стихии, наносящий урон при взрыве.',
        superName: 'Инфернальный вихрь (Inferno Storm)',
        superDesc: 'Сокрушительный вихрь первородного огня. Пробивает любой блок (24 ед. урона).'
    },
    '2': {
        id: '2',
        name: 'Kite',
        ruName: 'Кайт',
        element: 'Плазма',
        elementEn: 'Plasma',
        elementIcon: '⚡',
        color: '#38bdf8',
        gradient: 'linear-gradient(135deg, #0284c7, #38bdf8, #a5f3fc)',
        specialName: 'Плазменный сгусток (Plasma Bolt)',
        specialDesc: 'Высокоскоростной ионизированный заряд концентрированной плазмы.',
        superName: 'Плазменный коллапс (Plasma Core)',
        superDesc: 'Сверхмощный энергетический взрыв термоядерной плазмы (24 ед. урона).'
    },
    '3': {
        id: '3',
        name: 'Vex',
        ruName: 'Векс',
        element: 'Железо',
        elementEn: 'Iron / Metal',
        elementIcon: '⚙',
        color: '#c084fc',
        gradient: 'linear-gradient(135deg, #7e22ce, #c084fc, #e9d5ff)',
        specialName: 'Теневой блинк (Shadow Blink)',
        specialDesc: 'Мгновенная пространственная телепортация за спину соперника.',
        superName: 'Железный катаклизм (Iron Cataclysm)',
        superDesc: 'Магический выброс стальных клинков и металлической ауры (24 ед. урона).'
    },
    '4': {
        id: '4',
        name: 'Brute',
        ruName: 'Брут',
        element: 'Воздух',
        elementEn: 'Air Dragon',
        elementIcon: '🌪',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #047857, #10b981, #6ee7b7)',
        specialName: 'Дыхание Дракона (Dragon Gale)',
        specialDesc: 'Смертоносный порыв драконьего ветра, сбивающий противника с ног.',
        superName: 'Буря Воздушного Дракона (Dragon Tempest)',
        superDesc: 'Неукротимый воздушный циклон Ярости Дракона (24 ед. урона).'
    },
    '5': {
        id: '5',
        name: 'Nova',
        ruName: 'Нова',
        element: 'Песок',
        elementEn: 'Sand',
        elementIcon: '⏳',
        color: '#eab308',
        gradient: 'linear-gradient(135deg, #b45309, #eab308, #fef08a)',
        specialName: 'Песчаный рывок (Sand Surge)',
        specialDesc: 'Стремительный скользящий рывок сквозь песок с сокрушительным ударом.',
        superName: 'Песчаный шквал (Sandstorm Oblivion)',
        superDesc: 'Песчаная буря древней пустыни, стирающая защиту в пыль (24 ед. урона).'
    },
    '6': {
        id: '6',
        name: 'Rift',
        ruName: 'Рифт',
        element: 'Электричество',
        elementEn: 'Electricity',
        elementIcon: '⚡',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6, #c4b5fd)',
        specialName: 'Разряд молнии (Lightning Discharge)',
        specialDesc: 'Шаровая молния высокого напряжения, парализующая врага.',
        superName: 'Громовой овердрайв (Thunder Overdrive)',
        superDesc: 'Гигантский разряд электрической дуги колоссальной мощи (24 ед. урона).'
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
