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

export function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
        rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y &&
        rectangle1.position.y <= rectangle2.position.y + rectangle2.height
    );
}

export function createBattleState(firstFighter, secondFighter) {
    const createFighterState = fighter => ({
        ...fighter,
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        facingLeft: false,
        health: 100,
        maxHealth: 100,
        damage: 10,
        isAttacking: false,
        isBlocking: false,
        attackBox: {
            position: { x: 0, y: 0 },
            offset: { x: 50, y: 30 },
            width: 90,
            height: 50
        },
        bodyBox: { position: { x: 0, y: 0 }, width: 128, height: 204 },
        attackType: null,
        activeHitFrame: 0,
        attackHit: false,
        currentFrame: 0,
        state: 'idle'
    });

    return {
        left: createFighterState(firstFighter),
        right: createFighterState(secondFighter)
    };
}

/* eslint-disable no-param-reassign */
export function updateAttackBox(fighter) {
    const { attackBox, bodyBox } = fighter;
    const bodyOffset = bodyBox.offset || { x: 0, y: 0 };

    fighter.bodyBox.position = {
        x: fighter.position.x + bodyOffset.x,
        y: fighter.position.y + bodyOffset.y
    };

    if (fighter.facingLeft) {
        attackBox.position.x = fighter.bodyBox.position.x - attackBox.width + attackBox.offset.x;
    } else {
        attackBox.position.x = fighter.bodyBox.position.x + fighter.bodyBox.width - attackBox.offset.x;
    }

    attackBox.position.y = fighter.position.y + attackBox.offset.y;

    return fighter;
}
/* eslint-enable no-param-reassign */

export function startAttack(fighter, type) {
    if (fighter.isAttacking || fighter.state === 'hit' || fighter.health <= 0) return fighter;

    const attackConfig = {
        jab: { damage: 10, activeHitFrame: 3 },
        kick: { damage: 18, activeHitFrame: 5 }
    }[type];

    if (!attackConfig) return fighter;

    return {
        ...fighter,
        isAttacking: true,
        attackHit: false,
        attackType: type,
        damage: attackConfig.damage,
        activeHitFrame: attackConfig.activeHitFrame,
        currentFrame: 0,
        framesElapsed: 0,
        state: type
    };
}

export function setBlocking(fighter, isBlocking) {
    if (fighter.isAttacking || fighter.state === 'hit' || fighter.health <= 0) return fighter;

    return {
        ...fighter,
        isBlocking,
        state: isBlocking ? 'block' : 'idle'
    };
}

export function takeDamage(fighter, amount, attackerPositionX = fighter.position.x) {
    const blocked = fighter.isBlocking;
    const damage = blocked ? Math.floor(amount * 0.2) : amount;
    const direction = fighter.position.x >= attackerPositionX ? 1 : -1;

    return {
        ...fighter,
        health: Math.max(0, fighter.health - damage),
        velocity: { ...fighter.velocity, x: direction * (blocked ? 3 : 6) },
        isBlocking: false,
        isAttacking: false,
        attackType: null,
        attackHit: false,
        state: 'hit',
        hitTimer: 200,
        damageTaken: damage,
        wasBlocking: blocked
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
