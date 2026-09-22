/**
 * Core Battle Engine for Fighter Arena.
 * Handles damage calculation, collision detection, attack states, combos,
 * crouching, uppercuts, throws, special moves, and juggle physics.
 */

export const SPECIAL_MOVES = {
    Astra: {
        name: 'Lightning Orb',
        type: 'projectile',
        cooldown: 4000,
        damage: 14,
        speed: 10,
        radius: 22,
        color: '#38bdf8',
        secondaryColor: '#fde047'
    },
    Brute: {
        name: 'Earth Boulder',
        type: 'projectile',
        cooldown: 4200,
        damage: 15,
        speed: 9,
        radius: 25,
        isLow: false,
        color: '#f97316',
        secondaryColor: '#ea580c'
    },
    Vex: {
        name: 'Shadow Blink',
        type: 'teleport',
        cooldown: 4800,
        damage: 14,
        color: '#8b5cf6',
        secondaryColor: '#c084fc'
    },
    Kite: {
        name: 'Gale Crescent',
        type: 'projectile',
        cooldown: 3500,
        damage: 13,
        speed: 12,
        radius: 20,
        color: '#34d399',
        secondaryColor: '#6ee7b7'
    },
    Nova: {
        name: 'Flame Surge',
        type: 'dash_strike',
        cooldown: 4200,
        damage: 15,
        speed: 15,
        radius: 28,
        color: '#ef4444',
        secondaryColor: '#f59e0b'
    },
    Rift: {
        name: 'Void Blast',
        type: 'projectile',
        cooldown: 4500,
        damage: 14,
        speed: 7,
        radius: 24,
        color: '#a855f7',
        secondaryColor: '#e879f9'
    }
};

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

export function getFighterSpecialMove(fighter) {
    const name = fighter.name || 'Astra';
    return SPECIAL_MOVES[name] || SPECIAL_MOVES.Astra;
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
        isCrouching: false,
        isDashing: false,
        isJuggled: false,
        isDizzy: false,
        dashTimer: 0,
        specialCooldownTimer: 0,
        comboStreak: 0,
        comboTimer: 0,
        superMeter: 0,
        attackBox: {
            position: { x: 0, y: 0 },
            offset: { x: 50, y: 30 },
            width: 90,
            height: 50
        },
        bodyBox: {
            position: { x: 0, y: 0 },
            width: 128,
            height: 280,
            offset: { x: 46, y: 28 }
        },
        attackType: null,
        activeHitFrame: 0,
        attackHit: false,
        currentFrame: 0,
        state: 'idle',
        specialMove: getFighterSpecialMove(fighter)
    });

    return {
        left: createFighterState(firstFighter),
        right: createFighterState(secondFighter)
    };
}

/* eslint-disable no-param-reassign */
export function updateAttackBox(fighter) {
    const { attackBox, bodyBox } = fighter;
    const bodyOffset = bodyBox.offset || { x: 46, y: 28 };

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
    if (
        fighter.isAttacking ||
        fighter.state === 'hit' ||
        fighter.state === 'fall' ||
        fighter.state === 'getup' ||
        fighter.state === 'death' ||
        fighter.health <= 0 ||
        fighter.isDizzy
    ) {
        return fighter;
    }

    const attackConfig = {
        jab: { damage: 6.5, activeHitFrame: 3, duration: 320, state: 'jab' },
        jab2: { damage: 7.5, activeHitFrame: 2, duration: 280, state: 'jab' },
        kick: { damage: 11.5, activeHitFrame: 5, duration: 420, state: 'kick' },
        uppercut: { damage: 15.5, activeHitFrame: 4, duration: 450, state: 'uppercut' },
        sweep: { damage: 13.0, activeHitFrame: 4, duration: 450, state: 'sweep' },
        jumpkick: { damage: 14.0, activeHitFrame: 4, duration: 420, state: 'jumpkick' },
        throw: { damage: 16.5, activeHitFrame: 3, duration: 480, state: 'jab' },
        special: { damage: fighter.specialMove?.damage || 14, activeHitFrame: 4, duration: 500, state: 'special' },
        super: { damage: 24.0, activeHitFrame: 5, duration: 800, state: 'super' }
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
        state: attackConfig.state
    };
}

export function setBlocking(fighter, isBlocking = true) {
    if (
        fighter.isAttacking ||
        fighter.state === 'hit' ||
        fighter.state === 'fall' ||
        fighter.state === 'getup' ||
        fighter.state === 'death' ||
        fighter.health <= 0 ||
        fighter.isDizzy
    ) {
        return fighter;
    }

    return {
        ...fighter,
        isBlocking,
        isCrouching: false,
        state: isBlocking ? 'block' : 'idle'
    };
}

export function setCrouching(fighter, isCrouching = true) {
    if (
        fighter.isAttacking ||
        fighter.state === 'hit' ||
        fighter.state === 'fall' ||
        fighter.state === 'getup' ||
        fighter.state === 'death' ||
        fighter.health <= 0 ||
        fighter.isDizzy
    ) {
        return fighter;
    }

    return {
        ...fighter,
        isCrouching,
        state: isCrouching ? 'sweep' : 'idle'
    };
}

export function startDash(fighter, direction = 1) {
    if (
        fighter.isAttacking ||
        fighter.state === 'hit' ||
        fighter.state === 'fall' ||
        fighter.state === 'getup' ||
        fighter.state === 'death' ||
        fighter.health <= 0 ||
        !fighter.isGrounded
    ) {
        return fighter;
    }

    return {
        ...fighter,
        isDashing: true,
        dashTimer: 180,
        velocity: { ...fighter.velocity, x: direction * 12 }
    };
}

export function takeDamage(fighter, amount, attackerPositionX = fighter.position.x, options = {}) {
    const { isUnblockable = false, isUppercut = false, isSweep = false } = options;
    const blocked = fighter.isBlocking && !isUnblockable && !fighter.isDizzy;
    const damage = blocked ? Math.max(1, Math.floor(amount * 0.15)) : amount;
    const direction = fighter.position.x >= attackerPositionX ? 1 : -1;

    const isFatal = fighter.health - damage <= 0;

    let velocityX = direction * (blocked ? 3 : 6);
    let velocityY = fighter.velocity.y;

    if (isUppercut) {
        velocityY = -16;
        velocityX = direction * 4.5;
    } else if (isSweep) {
        velocityY = -8;
        velocityX = direction * 7;
    } else if (isUnblockable) {
        velocityY = -9;
        velocityX = direction * 11;
    } else if (!fighter.isGrounded) {
        // Air Juggle
        velocityY = -7.5;
        velocityX = direction * 4;
    } else if (isFatal) {
        // Fatal knockout strike on grounded opponent (Jab, Kick, Projectile, etc.)
        velocityY = -10;
        velocityX = direction * 7;
    }

    const isKnockdown = isUppercut || isSweep || isUnblockable || isFatal;

    return {
        ...fighter,
        health: Math.max(0, fighter.health - damage),
        velocity: { x: velocityX, y: velocityY },
        isGrounded: false,
        isBlocking: false,
        isAttacking: false,
        isCrouching: false,
        isDashing: false,
        isDizzy: false,
        attackType: null,
        attackHit: false,
        currentFrame: 0,
        framesElapsed: 0,
        state: isKnockdown ? 'fall' : 'hit',
        hitTimer: isKnockdown ? 600 : 300,
        damageTaken: damage,
        wasBlocking: blocked,
        isJuggled: !fighter.isGrounded || isUppercut || (isFatal && !isSweep)
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
