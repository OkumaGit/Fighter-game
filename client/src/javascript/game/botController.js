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
    let isCrouching = false;
    let crouchDuration = 0;
    let reactionTimer = 0;
    let blockDuration = 0;
    let attackCooldown = 400;
    let decisionTimer = 0;
    let jumpCooldown = 0;
    let specialCooldown = 3000;
    let dashCooldown = 2000;
    let comboStep = 0;
    let comboTimer = 0;

    const update = (elapsed, botFighter, opponentFighter, canvasWidth, actions) => {
        if (!botFighter || !opponentFighter) return;

        // If bot is stunned / in hit state / knocked down, drop guard/crouch and reset pending reactions
        if (
            botFighter.state === 'hit' ||
            botFighter.state === 'fall' ||
            botFighter.state === 'getup' ||
            botFighter.state === 'death'
        ) {
            isBlocking = false;
            isCrouching = false;
            reactionTimer = 0;
            blockDuration = 0;
            crouchDuration = 0;
            currentMovement = 0;
            comboStep = 0;
            comboTimer = 0;
            actions.crouch?.(false);
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
        if (specialCooldown > 0) specialCooldown -= elapsed;
        if (dashCooldown > 0) dashCooldown -= elapsed;

        // Update active crouch duration
        if (isCrouching) {
            crouchDuration -= elapsed;
            if (crouchDuration <= 0) {
                isCrouching = false;
                actions.crouch?.(false);
            } else {
                currentMovement = 0;
                return;
            }
        }

        // Combo chain processing
        if (comboStep > 0) {
            comboTimer -= elapsed;
            if (comboTimer <= 0) {
                comboStep = 0;
            } else if (!botFighter.isAttacking && distance <= 140) {
                if (comboStep === 1) {
                    actions.beginAttack('jab2');
                    comboStep = 2;
                    comboTimer = 340;
                    return;
                }
                if (comboStep === 2) {
                    actions.beginAttack('kick');
                    comboStep = 0;
                    comboTimer = 0;
                    attackCooldown = 500;
                    return;
                }
            }
        }

        // --- 1. Reaction-based blocking, ducking, & anti-air uppercut ---
        const opponentIsAirborne = !opponentFighter.isGrounded && distance < 145 && botFighter.isGrounded;
        if (opponentIsAirborne && attackCooldown <= 0 && Math.random() < (diffKey === 'HARD' ? 0.75 : 0.45)) {
            // Anti-air Uppercut!
            actions.beginAttack('uppercut');
            attackCooldown = 600;
            return;
        }

        const opponentIsThreatening =
            opponentFighter.isAttacking &&
            (opponentFighter.state === 'jab' || opponentFighter.state === 'kick') &&
            distance < 175;

        if (opponentIsThreatening) {
            if (!isBlocking && !isCrouching && reactionTimer <= 0 && blockDuration <= 0) {
                if (dodgeProbability > 0 && Math.random() < dodgeProbability) {
                    reactionTimer = reactionDelay * (0.8 + Math.random() * 0.4);
                } else {
                    reactionTimer = -1;
                }
            }

            if (reactionTimer > 0) {
                reactionTimer -= elapsed;
                if (reactionTimer <= 0) {
                    isBlocking = true;
                    blockDuration = 280 + Math.random() * 120;
                }
            }
        } else if (!opponentFighter.isAttacking) {
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

        if (isBlocking) {
            currentMovement = 0;
            return;
        }

        // --- 2. Throws (Close range against blocking opponent) ---
        if (!botFighter.isAttacking && botFighter.state !== 'hit' && attackCooldown <= 0) {
            if (distance < 85 && opponentFighter.isBlocking && Math.random() < (diffKey === 'HARD' ? 0.6 : 0.35)) {
                actions.beginAttack('throw');
                attackCooldown = 750;
                currentMovement = 0;
                return;
            }
        }

        // --- 3. Special Moves at Ranged Distance ---
        if (
            !botFighter.isAttacking &&
            botFighter.state !== 'hit' &&
            attackCooldown <= 0 &&
            specialCooldown <= 0 &&
            distance >= 180 &&
            distance <= 420
        ) {
            let specialChance = 0.45;
            if (diffKey === 'HARD') specialChance = 0.65;
            else if (diffKey === 'EASY') specialChance = 0.25;
            if (Math.random() < specialChance) {
                actions.beginAttack('special');
                specialCooldown = 4500 + Math.random() * 1500;
                attackCooldown = 650;
                currentMovement = 0;
                return;
            }
        }

        // --- 4. In-Range Attack & Combo Strings ---
        if (!botFighter.isAttacking && botFighter.state !== 'hit' && attackCooldown <= 0 && distance <= 135) {
            if (Math.random() < attackProbability) {
                // Decide between jab string or uppercut or kick
                const rand = Math.random();
                if (rand < 0.22 && botFighter.isGrounded) {
                    actions.beginAttack('uppercut');
                    attackCooldown = 550;
                } else if (rand < 0.22 + (1 - 0.22) * jabRatio) {
                    actions.beginAttack('jab');
                    // Initiate combo chain
                    if (Math.random() < (diffKey === 'HARD' ? 0.8 : 0.5)) {
                        comboStep = 1;
                        comboTimer = 320;
                    }
                    attackCooldown = 500;
                } else {
                    actions.beginAttack('kick');
                    attackCooldown = 600;
                }

                currentMovement = 0;
                return;
            }
            attackCooldown = 140 + Math.random() * 140;
        }

        // --- 5. Movement & Spacing / Dashing ---
        if (decisionTimer <= 0 && !botFighter.isAttacking) {
            decisionTimer = reactionDelay * (0.85 + Math.random() * 0.35);

            if (movementJitter > 0 && Math.random() < movementJitter) {
                currentMovement = 0;
                return;
            }

            const isCornered = (side === 'right' && botX > canvasWidth - 250) || (side === 'left' && botX < 50);

            // Dash away from corner or dash in
            if (isCornered && distance < 140 && dashCooldown <= 0 && Math.random() < 0.5) {
                actions.dash?.(dirToOpponent);
                dashCooldown = 2200;
            } else if (distance > 320 && dashCooldown <= 0 && Math.random() < 0.4) {
                actions.dash?.(dirToOpponent);
                dashCooldown = 2400;
            }

            if (isCornered && distance < 150) {
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
                currentMovement = dirToOpponent;
            } else if (distance < 75) {
                currentMovement = Math.random() < 0.6 ? -dirToOpponent : 0;
            } else {
                const rand = Math.random();
                if (diffKey === 'HARD') {
                    currentMovement = rand < 0.65 ? dirToOpponent : 0;
                } else if (diffKey === 'EASY') {
                    if (rand < 0.4) currentMovement = 0;
                    else if (rand < 0.6) currentMovement = dirToOpponent;
                    else currentMovement = -dirToOpponent;
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
        isCrouchingState: () => isCrouching,
        reset: () => {
            currentMovement = 0;
            isBlocking = false;
            isCrouching = false;
            crouchDuration = 0;
            reactionTimer = 0;
            blockDuration = 0;
            attackCooldown = 400;
            decisionTimer = 0;
            jumpCooldown = 0;
            specialCooldown = 3000;
            dashCooldown = 2000;
            comboStep = 0;
            comboTimer = 0;
        }
    };
}
