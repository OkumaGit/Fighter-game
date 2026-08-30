const fighterPortraits = {
  Astra: "/resources/fighters/fighter-1.png",
  Kite: "/resources/fighters/fighter-2.png",
  Vex: "/resources/fighters/fighter-3.png",
  Brute: "/resources/fighters/fighter-4.png",
  Nova: "/resources/fighters/fighter-1.png",
  Rift: "/resources/fighters/fighter-1.png",
};

const battleBackgrounds = [
  {
    key: "steampunk",
    src: "/resources/backgrounds/background-1.jpg",
  },
  {
    key: "crystal",
    src: "/resources/backgrounds/background-2.jpg",
  },
  {
    key: "lantern",
    src: "/resources/backgrounds/background-3.jpg",
  },
];

export function getFighterSource(fighter = {}) {
  return (
    fighterPortraits[fighter.name] ||
    fighter.source ||
    fighter.image ||
    fighter.sprite ||
    fighterPortraits.Astra
  );
}

export function getRandomBattleBackground() {
  return battleBackgrounds[
    Math.floor(Math.random() * battleBackgrounds.length)
  ];
}
