import { fightRepository } from "../repositories/fightRepository.js";
import { fighterRepository } from "../repositories/fighterRepository.js";

class FightersService {
  getAll() {
    return fightRepository.getAll();
  }

  getOne(id) {
    return fightRepository.getOne({ id });
  }

  create({ fighter1Id, fighter2Id }) {
    const f1 = fighterRepository.getOne({ id: fighter1Id });
    const f2 = fighterRepository.getOne({ id: fighter2Id });

    if (!f1 || !f2) {
      throw new Error("One or both fighters not found");
    }

    // Simulate fight
    let h1 = Number(f1.health ?? 85);
    let h2 = Number(f2.health ?? 85);
    const log = [];
    let round = 0;

    const calcShot = (attacker, defender) => {
      const base = Number(attacker.power || 0) - Number(defender.defense || 0);
      return Math.max(1, Math.round(base));
    };

    while (h1 > 0 && h2 > 0 && round < 100) {
      round += 1;
      const shot1 = calcShot(f1, f2);
      h2 = Math.max(0, h2 - shot1);

      const shot2 = h2 > 0 ? calcShot(f2, f1) : 0;
      h1 = Math.max(0, h1 - shot2);

      log.push({
        round,
        fighter1Shot: shot1,
        fighter2Shot: shot2,
        fighter1Health: h1,
        fighter2Health: h2,
      });
    }

    const fight = {
      fighter1: fighter1Id,
      fighter2: fighter2Id,
      log,
    };

    return fightRepository.create(fight);
  }
}

const fightersService = new FightersService();

export { fightersService };
