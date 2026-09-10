/**
 * AI Bot Controller for single-player combat.
 * Drives movement, spacing, attacks, reaction-based blocking, and jump avoidance.
 * Supports configurable difficulty profiles (EASY, MEDIUM, HARD).
 */

export const DIFFICULTY_PROFILES = {
    EASY: {
        reactionDelay: 600, // ms between decisions
        attackProbability: 0.35, // chance to strike when in range
        dodgeProbability: 0.0, // reaction to player attack
        movementJitter: 0.3 // random hesitation rate
    },
    MEDIUM: {
        reactionDelay: 250,
        attackProbability: 0.7,
        dodgeProbability: 0.25,
        movementJitter: 0.05
    },
    HARD: {
        reactionDelay: 80,
        attackProbability: 0.95,
        dodgeProbability: 0.65,
        movementJitter: 0.0
    }
};

export default function createBotController(side = 'right', options = {}) {
    const diffKey = typeof options.difficulty === 'string' ? options.difficulty.toUpperCase() : 'MEDIUM';
    const profile = DIFFICULTY_PROFILES[diffKey] ?? DIFFICULTY_PROFILES.MEDIUM;

    const {
        reactionDelay = profile.reactionDelay,
        attackProbability = profile.attackProbability,
        dodgeProbability = profile.dodgeProbability,
        movementJitter = profile.movementJitter,
        jabRatio = 0.65
    } = options;

    let currentMovement = 0;
    let isBlocking = false;
    let reactionTimer = 0;
    let blockDuration = 0;
    let attackCooldown = 400;
    let decisionTimer = 0;
    let jumpCooldown = 0;

    const update = (elapsed, botFighter, opponentFighter, canvasWidth, actions) => {
        if (!botFighter || !opponentFighter) return;

        // If bot is stunned / in hit state, drop guard and reset pending reactions
        if (botFighter.state === 'hit') {
            isBlocking = false;
            reactionTimer = 0;
            blockDuration = 0;
            currentMovement = 0;
            return;
        }

        const botX = botFighter.position.x;
        const oppX = opponentFighter.position.x;
        const distance = Math.abs(botX - oppX);
        const dirToOpponent = oppX < botX ? -1 : 1;

        // Decrement timers
        if (attackCooldown > 0) attackCooldown -= elapsed;
        if (jumpCooldown > 0) jumpCooldown -= elapsed;
        if (decisionTimer > 0) decisionTimer -= elapsed;

        // --- 1. Reaction-based blocking / dodging logic ---
        const opponentIsThreatening =
            opponentFighter.isAttacking &&
            (opponentFighter.state === 'jab' || opponentFighter.state === 'kick') &&
            distance < 175;

        if (opponentIsThreatening) {
            if (!isBlocking && reactionTimer <= 0 && blockDuration <= 0) {
                // Determine whether bot will attempt to react / block this attack
                if (dodgeProbability > 0 && Math.random() < dodgeProbability) {
                    reactionTimer = reactionDelay * (0.8 + Math.random() * 0.4);
                } else {
                    // Bot missed dodge/block window for this attack
                    reactionTimer = -1;
                }
            }

            if (reactionTimer > 0) {
                reactionTimer -= elapsed;
                if (reactionTimer <= 0) {
                    isBlocking = true;
                    blockDuration = 260 + Math.random() * 120;
                }
            }
        } else if (!opponentFighter.isAttacking) {
            // Opponent is not attacking, reset pending reaction
            reactionTimer = 0;
        }

        // Maintain or release active block
        if (isBlocking) {
            blockDuration -= elapsed;
            if (blockDuration <= 0 || !opponentIsThreatening) {
                isBlocking = false;
                reactionTimer = 0;
            }
        }

        // While blocking, the bot stands ground and cannot attack or move
        if (isBlocking) {
            currentMovement = 0;
            return;
        }

        // --- 2. Attack logic ---
        if (!botFighter.isAttacking && botFighter.state !== 'hit' && attackCooldown <= 0 && distance <= 135) {
            if (Math.random() < attackProbability) {
                const attackType = Math.random() < jabRatio ? 'jab' : 'kick';
                actions.beginAttack(attackType);

                let baseCooldown = 550;
                let jitterRange = 350;
                if (diffKey === 'HARD') {
                    baseCooldown = 320;
                    jitterRange = 220;
                } else if (diffKey === 'EASY') {
                    baseCooldown = 850;
                    jitterRange = 550;
                }

                attackCooldown = baseCooldown + Math.random() * jitterRange;
                currentMovement = 0;
                return;
            }
            // Small pause if bot hesitated this tick
            attackCooldown = 150 + Math.random() * 150;
        }

        // --- 3. Movement & spacing logic (periodically updated according to reactionDelay) ---
        if (decisionTimer <= 0 && !botFighter.isAttacking) {
            decisionTimer = reactionDelay * (0.85 + Math.random() * 0.35);

            // Movement jitter / hesitation check
            if (movementJitter > 0 && Math.random() < movementJitter) {
                currentMovement = 0;
                return;
            }

            const isCornered = (side === 'right' && botX > canvasWidth - 250) || (side === 'left' && botX < 50);

            if (isCornered && distance < 150) {
                // When cornered and opponent is closing in, chance to jump or push out
                let jumpChance = 0.4;
                let jumpCooldownTime = 1400;
                if (diffKey === 'HARD') {
                    jumpChance = 0.6;
                    jumpCooldownTime = 1000;
                } else if (diffKey === 'EASY') {
                    jumpChance = 0.2;
                    jumpCooldownTime = 1600;
                }

                if (jumpCooldown <= 0 && botFighter.isGrounded && Math.random() < jumpChance) {
                    actions.jump();
                    jumpCooldown = jumpCooldownTime;
                    currentMovement = dirToOpponent;
                } else {
                    currentMovement = dirToOpponent;
                }
            } else if (distance > 135) {
                // Approach opponent
                currentMovement = dirToOpponent;
            } else if (distance < 75) {
                // Too close, step back or hold ground
                currentMovement = Math.random() < 0.6 ? -dirToOpponent : 0;
            } else {
                // In combat pocket (75px - 135px): feints and micro-spacing
                const rand = Math.random();
                if (diffKey === 'HARD') {
                    // Hard bot stays aggressive and in range
                    currentMovement = rand < 0.65 ? dirToOpponent : 0;
                } else if (diffKey === 'EASY') {
                    // Easy bot backs off frequently
                    if (rand < 0.4) {
                        currentMovement = 0;
                    } else if (rand < 0.6) {
                        currentMovement = dirToOpponent;
                    } else {
                        currentMovement = -dirToOpponent;
                    }
                } else if (rand < 0.4) {
                    currentMovement = 0;
                } else if (rand < 0.75) {
                    currentMovement = dirToOpponent;
                } else {
                    currentMovement = -dirToOpponent;
                }
            }
        }
    };

    return {
        update,
        getMovement: () => currentMovement,
        isBlockingState: () => isBlocking,
        reset: () => {
            currentMovement = 0;
            isBlocking = false;
            reactionTimer = 0;
            blockDuration = 0;
            attackCooldown = 400;
            decisionTimer = 0;
            jumpCooldown = 0;
        }
    };
}
