export function getHitPower(fighter) {
    return Number(fighter.attack ?? 0) * (Math.random() + 1);
}

export function getBlockPower(fighter) {
    return Number(fighter.defense ?? 0) * (Math.random() + 1);
}

export function getDamage(attacker, defender) {
    const hitPower = getHitPower(attacker);
    const blockPower = getBlockPower(defender);

    if (blockPower >= hitPower) {
        return 0;
    }

    return hitPower - blockPower;
}

export function createBattleState(firstFighter, secondFighter) {
    return {
        left: {
            ...firstFighter,
            health: Number(firstFighter.health ?? 45),
            maxHealth: Number(firstFighter.health ?? 45)
        },
        right: {
            ...secondFighter,
            health: Number(secondFighter.health ?? 45),
            maxHealth: Number(secondFighter.health ?? 45)
        }
    };
}

export function applyAttack(state, attackerSide) {
    const attacker = state[attackerSide];
    const defenderSide = attackerSide === 'left' ? 'right' : 'left';
    const defender = state[defenderSide];
    const damage = getDamage(attacker, defender);
    const updatedDefenderHealth = Math.max(0, defender.health - damage);

    const nextState = {
        ...state,
        [defenderSide]: {
            ...defender,
            health: updatedDefenderHealth
        }
    };

    return {
        state: nextState,
        attackerSide,
        defenderSide,
        damage,
        winner: updatedDefenderHealth <= 0 ? attacker : null
    };
}

export function applyCriticalHit(state, attackerSide) {
    const attacker = state[attackerSide];
    const defenderSide = attackerSide === 'left' ? 'right' : 'left';
    const defender = state[defenderSide];
    const damage = 2 * Number(attacker.attack ?? 0);
    const updatedDefenderHealth = Math.max(0, defender.health - damage);

    const nextState = {
        ...state,
        [defenderSide]: {
            ...defender,
            health: updatedDefenderHealth
        }
    };

    return {
        state: nextState,
        attackerSide,
        defenderSide,
        damage,
        winner: updatedDefenderHealth <= 0 ? attacker : null
    };
}
