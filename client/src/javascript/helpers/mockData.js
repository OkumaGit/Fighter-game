const fighterSource = label => {
    const assets = {
        Astra: 'resources/fighters/fighter-1.png',
        Kite: 'resources/fighters/fighter-2.png',
        Vex: 'resources/fighters/fighter-3.png',
        Brute: 'resources/fighters/fighter-4.png',
        Nova: 'resources/fighters/fighter-5.png',
        Rift: 'resources/fighters/fighter-6.png'
    };

    return assets[label] || 'resources/fighters/fighter-1.png';
};

export const fighters = [
    {
        _id: '1',
        name: 'Astra',
        source: fighterSource('Astra', '#f97316', '#fed7aa')
    },
    {
        _id: '2',
        name: 'Kite',
        source: fighterSource('Kite', '#facc15', '#fef3c7')
    },
    {
        _id: '3',
        name: 'Vex',
        source: fighterSource('Vex', '#22c55e', '#bbf7d0')
    },
    {
        _id: '4',
        name: 'Brute',
        source: fighterSource('Brute', '#ef4444', '#fecaca')
    },
    {
        _id: '5',
        name: 'Nova',
        source: fighterSource('Nova', '#38bdf8', '#dbeafe')
    },
    {
        _id: '6',
        name: 'Rift',
        source: fighterSource('Rift', '#a78bfa', '#ddd6fe')
    }
];

export const fightersDetails = [
    {
        _id: '1',
        name: 'Astra',
        health: 45,
        attack: 4,
        defense: 3,
        source: fighterSource('Astra', '#f97316', '#fed7aa')
    },
    {
        _id: '2',
        name: 'Kite',
        health: 60,
        attack: 3,
        defense: 1,
        source: fighterSource('Kite', '#facc15', '#fef3c7')
    },
    {
        _id: '3',
        name: 'Vex',
        health: 45,
        attack: 4,
        defense: 3,
        source: fighterSource('Vex', '#22c55e', '#bbf7d0')
    },
    {
        _id: '4',
        name: 'Brute',
        health: 60,
        attack: 4,
        defense: 1,
        source: fighterSource('Brute', '#ef4444', '#fecaca')
    },
    {
        _id: '5',
        name: 'Nova',
        health: 45,
        attack: 3,
        defense: 4,
        source: fighterSource('Nova', '#38bdf8', '#dbeafe')
    },
    {
        _id: '6',
        name: 'Rift',
        health: 45,
        attack: 5,
        defense: 4,
        source: fighterSource('Rift', '#a78bfa', '#ddd6fe')
    }
];
