import controls from '../../constants/controls';
import {
    createBattleState,
    rectangularCollision,
    startAttack,
    setBlocking,
    startDash,
    takeDamage,
    updateAttackBox
} from '../game/battleEngine';
import { getBattleFrameSource, getBattleSpriteConfig, getBattleSpriteSheetSource } from '../helpers/fighterAssets';
import createBotController from '../game/botController';
import showCountdownOverlay from './modal/countdownModal';
import createVFXManager from '../game/vfxEngine';
import { updateRoundMedallions, showMatchAnnouncement, updateSuperBar, updateTimerDisplay } from './arenaUI';

/* eslint-disable no-param-reassign */

const spriteSheetCache = new Map();
const frameCache = new Map();
const fighterWidth = 220;
const fighterHeight = 315;
const bodyWidth = 128;
const bodyHeight = 280;
const bodyOffsetX = 46;
const bodyOffsetY = 28;

function getSpriteSheet(fighter, pose) {
    const fighterId = fighter._id ?? fighter.id ?? '1';
    const key = `${fighterId}:${pose}`;
    if (!spriteSheetCache.has(key)) {
        const image = new Image();
        image.src = getBattleSpriteSheetSource(fighter, pose);
        spriteSheetCache.set(key, image);
    }
    return spriteSheetCache.get(key);
}

function getFrame(fighter, pose, frame) {
    const fighterId = fighter._id ?? fighter.id ?? '1';
    const key = `${fighterId}:${pose}:${frame}`;
    if (!frameCache.has(key)) {
        const image = new Image();
        image.src = getBattleFrameSource(fighter, pose, frame);
        frameCache.set(key, image);
    }
    return frameCache.get(key);
}

async function preloadFighterSprites(fighters) {
    const promises = [];

    fighters.forEach(fighter => {
        const config = getBattleSpriteConfig(fighter);
        Object.keys(config.poses).forEach(pose => {
            const fighterId = fighter._id ?? fighter.id ?? '1';
            const key = `${fighterId}:${pose}`;

            if (!spriteSheetCache.has(key)) {
                const img = new Image();
                const promise = new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
                img.src = getBattleSpriteSheetSource(fighter, pose);
                spriteSheetCache.set(key, img);
                promises.push(promise);
            }
        });
    });

    await Promise.all(promises);
}

function updateHealthBar(position, fighter) {
    const element = document.getElementById(`${position}-fighter-indicator`);
    if (element) {
        const healthPercent = Math.max(0, fighter.health);
        element.style.width = `${healthPercent}%`;
        const percentText = document.getElementById(`${position}-health-percent`);
        if (percentText) {
            percentText.innerText = `${Math.round(healthPercent)}%`;
            if (healthPercent <= 25) {
                percentText.style.color = '#ef4444';
            } else if (healthPercent <= 50) {
                percentText.style.color = '#f59e0b';
            } else {
                percentText.style.color = '#22c55e';
            }
        }
    }
}

function setStatus(position, className) {
    const element = document.querySelector(`.arena___fighter[data-position="${position}"]`);
    if (!element) return;
    element.classList.remove('arena___fighter--hit', 'arena___fighter--block');
    if (className) element.classList.add(className);
}

function drawDizzyStars(context, fighter) {
    const headX = fighter.position.x + fighterWidth / 2;
    const headY = fighter.position.y + 12;
    const time = performance.now() / 200;
    const starCount = 4;
    const rx = 42;
    const ry = 14;

    context.save();
    for (let i = 0; i < starCount; i += 1) {
        const angle = time + (i * Math.PI * 2) / starCount;
        const starX = headX + Math.cos(angle) * rx;
        const starY = headY + Math.sin(angle) * ry;

        const depth = (Math.sin(angle) + 1) / 2;
        const size = 4.5 + depth * 2.5;

        context.save();
        context.translate(starX, starY);
        context.rotate(time * 2.5 + i);

        context.fillStyle = depth > 0.4 ? '#fef08a' : '#facc15';
        context.shadowColor = '#eab308';
        context.shadowBlur = 10;

        context.beginPath();
        for (let p = 0; p < 4; p += 1) {
            const a = (p * Math.PI) / 2;
            const outerX = Math.cos(a) * size;
            const outerY = Math.sin(a) * size;
            const innerA = a + Math.PI / 4;
            const innerX = Math.cos(innerA) * (size * 0.4);
            const innerY = Math.sin(innerA) * (size * 0.4);
            if (p === 0) {
                context.moveTo(outerX, outerY);
            } else {
                context.lineTo(outerX, outerY);
            }
            context.lineTo(innerX, innerY);
        }
        context.closePath();
        context.fill();

        context.fillStyle = '#ffffff';
        context.shadowBlur = 4;
        context.beginPath();
        context.arc(0, 0, size * 0.28, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }
    context.restore();
}

function drawFighter(context, fighter) {
    let pose = fighter.state;
    if (fighter.isDizzy) {
        pose = 'dizzy';
    } else if (fighter.health <= 0 && fighter.isGrounded && fighter.state !== 'fall' && fighter.state !== 'getup') {
        pose = 'death';
    } else if (fighter.isMoving && fighter.isGrounded && (fighter.state === 'idle' || !fighter.state)) {
        pose = 'walk';
    } else if (pose === 'crouch') {
        pose = 'sweep';
    }

    const spriteSheet = getSpriteSheet(fighter, pose);

    context.save();
    context.imageSmoothingEnabled = true;

    if (spriteSheet && spriteSheet.complete && spriteSheet.naturalWidth > 0) {
        const config = getBattleSpriteConfig(fighter).poses[pose] || getBattleSpriteConfig(fighter).poses.idle;
        const frameWidth = spriteSheet.naturalHeight || 820;
        const frameHeight = spriteSheet.naturalHeight || 820;
        const maxFrames = config.frames || 8;
        const currentFrameIndex = Math.min(Math.max(0, fighter.currentFrame || 0), maxFrames - 1);
        const sourceX = currentFrameIndex * frameWidth;

        if (fighter.facingLeft) {
            context.translate(fighter.position.x + fighterWidth, fighter.position.y);
            context.scale(-1, 1);
            context.drawImage(spriteSheet, sourceX, 0, frameWidth, frameHeight, 0, 0, fighterWidth, fighterHeight);
        } else {
            context.drawImage(
                spriteSheet,
                sourceX,
                0,
                frameWidth,
                frameHeight,
                fighter.position.x,
                fighter.position.y,
                fighterWidth,
                fighterHeight
            );
        }
    } else {
        const image = getFrame(fighter, pose, fighter.currentFrame);
        if (!image.complete || image.naturalWidth === 0) {
            context.restore();
            return;
        }

        if (fighter.facingLeft) {
            context.translate(fighter.position.x + fighterWidth, fighter.position.y);
            context.scale(-1, 1);
            context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, fighterWidth, fighterHeight);
        } else {
            context.drawImage(
                image,
                0,
                0,
                image.naturalWidth,
                image.naturalHeight,
                fighter.position.x,
                fighter.position.y,
                fighterWidth,
                fighterHeight
            );
        }
    }
    context.restore();

    if (fighter.isDizzy) {
        drawDizzyStars(context, fighter);
    }
}

function getMovement(side, pressedKeys) {
    if (side === 'left') {
        return Number(pressedKeys.has(controls.PlayerOneRight)) - Number(pressedKeys.has(controls.PlayerOneLeft));
    }
    return Number(pressedKeys.has(controls.PlayerTwoRight)) - Number(pressedKeys.has(controls.PlayerTwoLeft));
}

function animateFighter(fighter, elapsed) {
    if (fighter.state === 'hit') {
        fighter.hitTimer = (fighter.hitTimer || 0) - elapsed;
        if (fighter.hitTimer <= 0) {
            if (fighter.isBlocking) {
                fighter.state = 'block';
            } else {
                fighter.state = fighter.isGrounded ? 'idle' : 'jump';
            }
            fighter.hitTimer = 0;
            fighter.currentFrame = 0;
            fighter.framesElapsed = 0;
        }
    }

    const attackStates = ['jab', 'jab2', 'kick', 'uppercut', 'sweep', 'special', 'jumpkick'];
    if (!attackStates.includes(fighter.state)) {
        fighter.isAttacking = false;
        fighter.attackType = null;
    }

    let pose = fighter.state;
    if (fighter.isDizzy) {
        pose = 'dizzy';
    } else if (fighter.health <= 0 && fighter.isGrounded && fighter.state !== 'fall' && fighter.state !== 'getup') {
        pose = 'death';
    } else if (fighter.isMoving && fighter.isGrounded && (fighter.state === 'idle' || !fighter.state)) {
        pose = 'walk';
    } else if (pose === 'crouch') {
        pose = 'sweep';
    }

    const config = getBattleSpriteConfig(fighter).poses[pose] || getBattleSpriteConfig(fighter).poses.idle;
    const frameDuration = config.duration / config.frames;

    fighter.framesElapsed = (fighter.framesElapsed || 0) + elapsed;
    if (fighter.framesElapsed < frameDuration) return;

    fighter.framesElapsed = 0;

    // During knockdown fall: hold frame 3 (airborne pose) while airborne until landing on ground
    if (fighter.state === 'fall' && !fighter.isGrounded && fighter.currentFrame >= 3) {
        fighter.currentFrame = 3;
        return;
    }

    if (fighter.currentFrame < config.frames - 1) {
        fighter.currentFrame += 1;
    } else if (config.loop) {
        fighter.currentFrame = 0;
    } else {
        fighter.isAttacking = false;
        fighter.attackType = null;
        if (fighter.state === 'fall') {
            if (fighter.health <= 0) {
                fighter.currentFrame = config.frames - 1;
                return;
            }
            fighter.state = 'getup';
        } else if (fighter.state === 'getup') {
            fighter.state = 'idle';
        } else if (fighter.state === 'death') {
            fighter.currentFrame = config.frames - 1;
            return;
        } else if (fighter.isBlocking) {
            fighter.state = 'block';
        } else {
            fighter.state = fighter.isGrounded ? 'idle' : 'jump';
        }
        fighter.currentFrame = 0;
        fighter.framesElapsed = 0;
    }
}

function moveFighter(fighter, direction, elapsed, canvasWidth, groundY, vfx) {
    const timeScale = elapsed / 16;

    if (fighter.dashTimer > 0) {
        fighter.dashTimer -= elapsed;
        if (fighter.dashTimer <= 0) {
            fighter.isDashing = false;
        }
    }

    if (fighter.specialCooldownTimer > 0) {
        fighter.specialCooldownTimer -= elapsed;
        if (fighter.specialCooldownTimer < 0) fighter.specialCooldownTimer = 0;
    }

    if (fighter.comboTimer > 0) {
        fighter.comboTimer -= elapsed;
        if (fighter.comboTimer <= 0) {
            fighter.comboStreak = 0;
        }
    }

    if (fighter.velocity.x) {
        fighter.position.x += fighter.velocity.x * timeScale;
        fighter.velocity.x *= fighter.isDashing ? 0.94 : 0.82;
        if (Math.abs(fighter.velocity.x) < 0.2) {
            fighter.velocity.x = 0;
        }
    }

    fighter.isMoving = false;
    if (
        direction &&
        !fighter.isAttacking &&
        !fighter.isBlocking &&
        !fighter.isCrouching &&
        fighter.state !== 'hit' &&
        fighter.state !== 'fall' &&
        fighter.state !== 'getup' &&
        fighter.state !== 'death' &&
        !fighter.isDizzy
    ) {
        fighter.position.x += direction * fighter.speed * timeScale;
        fighter.facingLeft = direction < 0;
        fighter.isMoving = true;
    }

    const prevGrounded = fighter.isGrounded;
    const gravity = fighter.isJuggled ? 0.52 : 0.7;
    fighter.velocity.y += gravity * timeScale;
    fighter.position.y += fighter.velocity.y * timeScale;

    if (fighter.position.y >= groundY) {
        fighter.position.y = groundY;
        fighter.velocity.y = 0;
        fighter.isGrounded = true;
        fighter.isJuggled = false;
        if (!prevGrounded && vfx) {
            vfx.spawnDust(fighter.position.x + fighterWidth / 2, groundY + fighterHeight - 20, 0);
        }
    } else {
        fighter.isGrounded = false;
    }

    fighter.position.x = Math.max(20, Math.min(canvasWidth - fighterWidth - 20, fighter.position.x));
    updateAttackBox(fighter);
}

function executeSpecialMove(side, state, vfx) {
    const fighter = state[side];
    const opponentSide = side === 'left' ? 'right' : 'left';
    const opponent = state[opponentSide];
    const special = fighter.specialMove;
    if (!special) return;

    fighter.specialCooldownTimer = special.cooldown || 4000;
    vfx.spawnFloatingText(
        fighter.position.x + fighterWidth / 2,
        fighter.position.y + 40,
        special.name.toUpperCase(),
        'special'
    );

    if (special.type === 'projectile' || special.type === 'ground_wave') {
        const spawnX = fighter.facingLeft ? fighter.position.x + 20 : fighter.position.x + fighterWidth - 20;
        const spawnY = fighter.position.y + 115;

        vfx.spawnProjectile(side, spawnX, spawnY, fighter.facingLeft, {
            speed: special.speed,
            radius: special.radius,
            color: special.color,
            secondaryColor: special.secondaryColor,
            damage: special.damage,
            isLow: special.isLow
        });
        vfx.triggerScreenShake('light');
    } else if (special.type === 'teleport') {
        vfx.spawnDust(fighter.position.x + fighterWidth / 2, fighter.position.y + fighterHeight - 30, 0);
        vfx.spawnHitSparks(fighter.position.x + fighterWidth / 2, fighter.position.y + fighterHeight / 2, false, true);
        const behindOffset = opponent.facingLeft ? 120 : -120;
        fighter.position.x = Math.max(40, Math.min(1060, opponent.position.x + behindOffset));
        fighter.facingLeft = fighter.position.x > opponent.position.x;
        vfx.spawnHitSparks(fighter.position.x + fighterWidth / 2, fighter.position.y + fighterHeight / 2, false, true);
        vfx.triggerScreenShake('light');
    } else if (special.type === 'dash_strike') {
        const dir = fighter.facingLeft ? -1 : 1;
        fighter.velocity.x = dir * 16;
        fighter.isDashing = true;
        fighter.dashTimer = 220;
        vfx.triggerScreenShake('medium');
        vfx.spawnHitSparks(fighter.position.x + fighterWidth / 2, fighter.position.y + fighterHeight / 2, false, true);
    }
}

export default async function fight(firstFighter, secondFighter, options = {}) {
    const { isPvE = false, isOnline = false, role = 'host', roomCode = null, socket = null } = options;
    await preloadFighterSprites([firstFighter, secondFighter]);
    const state = createBattleState(firstFighter, secondFighter);
    const bot = isPvE ? createBotController('right', options) : null;

    const canvas = document.querySelector('.arena___canvas');
    const context = canvas.getContext('2d');
    const vfx = createVFXManager(canvas, context);

    const pressedKeys = new Set();
    const remoteKeys = new Set();
    const criticalSequence = { left: [], right: [] };
    const lastCriticalHit = { left: 0, right: 0 };
    const lastTapTimes = {
        PlayerOneLeft: 0,
        PlayerOneRight: 0,
        PlayerTwoLeft: 0,
        PlayerTwoRight: 0
    };
    const comboChain = {
        left: { step: 0, timer: 0 },
        right: { step: 0, timer: 0 }
    };

    let animationFrame;
    let previousTime = performance.now();
    let lastSyncTime = 0;
    let finished = false;

    // Best of 3, Super Meter, & 99s Timer
    const roundScores = { left: 0, right: 0 };
    let currentRound = 1;
    let roundTransitionActive = false;
    let finishHimActive = false;
    let finishHimOverlay = null;
    let finishHimTimeout = null;
    let matchTimer = 99;
    let timerInterval = null;

    updateRoundMedallions('left', 0);
    updateRoundMedallions('right', 0);
    updateSuperBar('left', 0);
    updateSuperBar('right', 0);
    updateTimerDisplay(99);

    const sideMargin = 120;
    const initialCanvasWidth = canvas.clientWidth || 1200;
    const initialCanvasHeight = canvas.clientHeight || 560;
    canvas.width = initialCanvasWidth;
    canvas.height = initialCanvasHeight;

    const getGroundY = () => canvas.height - fighterHeight - 20;

    state.left.side = 'left';
    state.right.side = 'right';
    state.left.position = { x: sideMargin, y: getGroundY() };
    state.right.position = { x: canvas.width - fighterWidth - sideMargin, y: getGroundY() };
    state.left.facingLeft = false;
    state.right.facingLeft = true;
    state.left.speed = 4;
    state.right.speed = 4;
    state.left.isGrounded = true;
    state.right.isGrounded = true;
    state.left.bodyBox.width = bodyWidth;
    state.left.bodyBox.height = bodyHeight;
    state.right.bodyBox.width = bodyWidth;
    state.right.bodyBox.height = bodyHeight;
    state.left.bodyBox.offset = { x: bodyOffsetX, y: bodyOffsetY };
    state.right.bodyBox.offset = { x: bodyOffsetX, y: bodyOffsetY };
    updateAttackBox(state.left);
    updateAttackBox(state.right);
    updateHealthBar('left', state.left);
    updateHealthBar('right', state.right);

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawFighter(context, state.left);
    drawFighter(context, state.right);

    await new Promise(resolve => {
        showCountdownOverlay(resolve);
    });

    // Re-verify canvas dimensions after countdown in case DOM layout settled
    const actualWidth = canvas.clientWidth || canvas.width;
    const actualHeight = canvas.clientHeight || canvas.height;
    if (actualWidth && actualHeight && (canvas.width !== actualWidth || canvas.height !== actualHeight)) {
        canvas.width = actualWidth;
        canvas.height = actualHeight;
    }
    state.left.position.x = sideMargin;
    state.left.position.y = getGroundY();
    state.right.position.x = canvas.width - fighterWidth - sideMargin;
    state.right.position.y = getGroundY();
    state.left.facingLeft = false;
    state.right.facingLeft = true;
    updateAttackBox(state.left);
    updateAttackBox(state.right);

    showMatchAnnouncement('ROUND 1 · FIGHT!', 'round', 1300);
    previousTime = performance.now();

    return new Promise(resolve => {
        let handleOpponentInput;
        let handleOpponentSync;
        let handleOpponentDisconnect;

        const finishFight = winner => {
            if (finished) return;
            finished = true;
            if (timerInterval) clearInterval(timerInterval);
            if (finishHimTimeout) clearTimeout(finishHimTimeout);
            if (finishHimOverlay) finishHimOverlay.remove();
            cancelAnimationFrame(animationFrame);
            // eslint-disable-next-line no-use-before-define
            document.removeEventListener('keydown', handleKeyDown);
            // eslint-disable-next-line no-use-before-define
            document.removeEventListener('keyup', handleKeyUp);

            if (isOnline && socket) {
                if (handleOpponentInput) socket.off('opponent-input', handleOpponentInput);
                if (handleOpponentSync) socket.off('opponent-sync-state', handleOpponentSync);
                if (handleOpponentDisconnect) socket.off('opponent-disconnected', handleOpponentDisconnect);
            }

            resolve(winner);
        };

        const onRoundEnd = roundWinnerSide => {
            roundScores[roundWinnerSide] += 1;
            updateRoundMedallions(roundWinnerSide, roundScores[roundWinnerSide]);

            const winnerFighter = state[roundWinnerSide];
            showMatchAnnouncement(`ROUND ${currentRound} · ${winnerFighter.name.toUpperCase()} WINS`, 'round', 1700);

            roundTransitionActive = true;
            setTimeout(() => {
                if (finished) return;

                currentRound += 1;
                state.left.health = 100;
                state.right.health = 100;
                state.left.position = { x: sideMargin, y: getGroundY() };
                state.right.position = { x: canvas.width - fighterWidth - sideMargin, y: getGroundY() };
                state.left.velocity = { x: 0, y: 0 };
                state.right.velocity = { x: 0, y: 0 };
                state.left.facingLeft = false;
                state.right.facingLeft = true;
                state.left.state = 'idle';
                state.right.state = 'idle';
                state.left.isAttacking = false;
                state.right.isAttacking = false;
                state.left.isBlocking = false;
                state.right.isBlocking = false;
                state.left.isCrouching = false;
                state.right.isCrouching = false;
                state.left.isDizzy = false;
                state.right.isDizzy = false;
                state.left.isGrounded = true;
                state.right.isGrounded = true;
                updateAttackBox(state.left);
                updateAttackBox(state.right);
                updateHealthBar('left', state.left);
                updateHealthBar('right', state.right);
                updateSuperBar('left', state.left.superMeter || 0);
                updateSuperBar('right', state.right.superMeter || 0);
                vfx.projectiles.length = 0;

                const nextRoundName =
                    roundScores.left === 1 && roundScores.right === 1 ? 'FINAL ROUND' : `ROUND ${currentRound}`;
                showMatchAnnouncement(`${nextRoundName} · FIGHT!`, 'round', 1200);

                // Reset and start 99-second fight timer for the new round
                // eslint-disable-next-line no-use-before-define
                startRoundTimer();

                setTimeout(() => {
                    roundTransitionActive = false;
                }, 1200);
            }, 1800);
        };

        const handleTimeOver = () => {
            if (finished || roundTransitionActive || finishHimActive) return;
            showMatchAnnouncement('TIME OVER!', 'round', 2000);
            vfx.triggerScreenShake('medium');

            setTimeout(() => {
                if (finished) return;
                const p1Health = state.left.health;
                const p2Health = state.right.health;

                let roundWinnerSide = 'left';
                if (p2Health > p1Health) {
                    roundWinnerSide = 'right';
                } else if (p1Health === p2Health) {
                    roundWinnerSide = Math.random() < 0.5 ? 'left' : 'right';
                }

                const isMatchDeciding = roundScores[roundWinnerSide] + 1 >= 2;
                if (isMatchDeciding) {
                    const loserSide = roundWinnerSide === 'left' ? 'right' : 'left';
                    state[loserSide].health = 0;
                    updateHealthBar(loserSide, state[loserSide]);
                    finishFight(state[roundWinnerSide]);
                } else {
                    onRoundEnd(roundWinnerSide);
                }
            }, 1600);
        };

        const startRoundTimer = () => {
            if (timerInterval) clearInterval(timerInterval);
            matchTimer = 99;
            updateTimerDisplay(matchTimer);

            timerInterval = setInterval(() => {
                if (finished || roundTransitionActive || finishHimActive) return;
                matchTimer -= 1;
                updateTimerDisplay(matchTimer);

                if (matchTimer <= 0) {
                    clearInterval(timerInterval);
                    handleTimeOver();
                }
            }, 1000);
        };

        // Start countdown timer for Round 1
        startRoundTimer();

        const beginAttack = (side, type) => {
            if (roundTransitionActive) return;
            state[side] = startAttack(state[side], type);
        };

        const checkDoubleTap = keyName => {
            const now = performance.now();
            const prev = lastTapTimes[keyName] || 0;
            lastTapTimes[keyName] = now;
            return now - prev < 270;
        };

        const handleAttackInput = (side, attackType, forwardKey, blockKey) => {
            if (
                roundTransitionActive ||
                state[side].health <= 0 ||
                state[side].isDizzy ||
                state[side].state === 'hit' ||
                state[side].state === 'fall' ||
                state[side].state === 'getup' ||
                state[side].state === 'death'
            ) {
                return;
            }
            const oppSide = side === 'left' ? 'right' : 'left';
            const dist = Math.abs(state[side].position.x - state[oppSide].position.x);
            const isHoldingForward = pressedKeys.has(forwardKey);
            const isHoldingBlock = pressedKeys.has(blockKey) || state[side].isBlocking;

            if (attackType === 'jab') {
                if (isHoldingBlock || state[side].isCrouching) {
                    beginAttack(side, 'uppercut');
                } else if (dist < 88 && isHoldingForward) {
                    beginAttack(side, 'throw');
                } else if (comboChain[side].step === 1 && comboChain[side].timer > 0) {
                    beginAttack(side, 'jab2');
                    comboChain[side].step = 2;
                    comboChain[side].timer = 360;
                } else {
                    beginAttack(side, 'jab');
                    comboChain[side].step = 1;
                    comboChain[side].timer = 360;
                }
            } else if (attackType === 'kick') {
                if (!state[side].isGrounded) {
                    beginAttack(side, 'jumpkick');
                } else if (isHoldingBlock || state[side].isCrouching) {
                    beginAttack(side, 'sweep');
                } else {
                    beginAttack(side, 'kick');
                }
                comboChain[side].step = 0;
                comboChain[side].timer = 0;
            } else if (attackType === 'special') {
                if ((state[side].specialCooldownTimer || 0) <= 0) {
                    beginAttack(side, 'special');
                    executeSpecialMove(side, state, vfx);
                }
            }
        };

        const onFatalKnockout = (winner, loserSide) => {
            if (finishHimTimeout) clearTimeout(finishHimTimeout);
            let actualLoserSide = 'right';
            if (typeof loserSide === 'string') {
                actualLoserSide = loserSide;
            } else if (winner === state.left) {
                actualLoserSide = 'right';
            } else {
                actualLoserSide = 'left';
            }
            const loser = typeof loserSide === 'string' ? state[loserSide] : loserSide;

            loser.isDizzy = false;
            loser.health = 0;
            loser.state = 'fall';
            loser.currentFrame = 0;
            loser.framesElapsed = 0;
            loser.isAttacking = false;
            loser.isBlocking = false;
            loser.isCrouching = false;
            loser.isDashing = false;

            const direction = loser.position.x >= winner.position.x ? 1 : -1;
            loser.velocity.y = -10;
            loser.velocity.x = direction * 7;
            loser.isGrounded = false;
            loser.isJuggled = true;

            updateHealthBar(actualLoserSide, loser);
            vfx.triggerScreenShake('heavy');
            vfx.triggerHitStop(140);

            vfx.spawnBlood(loser.position.x + fighterWidth / 2, loser.position.y + 70, direction, 'fatal');
            vfx.spawnFloatingText(loser.position.x + fighterWidth / 2, loser.position.y, 'FATAL BLOW!', 'crit');

            if (finishHimOverlay) {
                const flawless = winner.health === 100;
                const winText = flawless
                    ? `${winner.name.toUpperCase()} WINS!\nFLAWLESS VICTORY`
                    : `${winner.name.toUpperCase()} WINS!`;
                finishHimOverlay.updateText(winText, 'winner');
            }

            setTimeout(() => {
                if (finishHimOverlay) finishHimOverlay.remove();
                finishFight(winner);
            }, 2600);
        };

        const handleFighterHealthDepleted = (winnerSide, loserSide) => {
            if (finished) return;
            const isMatchDeciding = roundScores[winnerSide] + 1 >= 2;

            if (isMatchDeciding && !finishHimActive) {
                finishHimActive = true;
                state[loserSide].isDizzy = true;
                state[loserSide].isBlocking = false;
                state[loserSide].isCrouching = false;
                state[loserSide].isAttacking = false;
                state[loserSide].isDashing = false;
                state[loserSide].health = 1;
                state[loserSide].state = 'idle';
                updateHealthBar(loserSide, state[loserSide]);

                finishHimOverlay = showMatchAnnouncement('FINISH HIM!', 'finish', 0);

                finishHimTimeout = setTimeout(() => {
                    if (!finished) {
                        if (finishHimOverlay) finishHimOverlay.remove();
                        state[loserSide].isDizzy = false;
                        state[loserSide].health = 0;
                        state[loserSide].state = 'death';
                        state[loserSide].currentFrame = 0;
                        finishFight(state[winnerSide]);
                    }
                }, 5000);
            } else if (!finishHimActive) {
                onRoundEnd(winnerSide);
            }
        };

        if (isOnline && socket) {
            handleOpponentInput = ({ type, code }) => {
                if (type === 'keydown') {
                    remoteKeys.add(code);
                    const remoteSide = role === 'host' ? 'right' : 'left';
                    const isJab = code === controls.PlayerOneJab || code === controls.PlayerTwoJab;
                    const isKick = code === controls.PlayerOneKick || code === controls.PlayerTwoKick;
                    const isJump = code === controls.PlayerOneJump || code === controls.PlayerTwoJump;
                    const isSpecial = code === controls.PlayerOneSpecial || code === controls.PlayerTwoSpecial;

                    if (isJab) beginAttack(remoteSide, 'jab');
                    if (isKick) beginAttack(remoteSide, 'kick');
                    if (isSpecial) {
                        beginAttack(remoteSide, 'special');
                        executeSpecialMove(remoteSide, state, vfx);
                    }
                    if (isJump && state[remoteSide].isGrounded && state[remoteSide].state !== 'hit') {
                        state[remoteSide].velocity.y = -13;
                    }
                } else if (type === 'keyup') {
                    remoteKeys.delete(code);
                }
            };

            handleOpponentSync = ({ state: syncState }) => {
                if (!syncState) return;
                if (syncState.left) {
                    state.left.health = syncState.left.health;
                    updateHealthBar('left', state.left);
                    if (Math.abs(state.left.position.x - syncState.left.x) > 15) {
                        state.left.position.x = syncState.left.x;
                    }
                    state.left.facingLeft = syncState.left.facingLeft;
                }
                if (syncState.right) {
                    state.right.health = syncState.right.health;
                    updateHealthBar('right', state.right);
                    if (Math.abs(state.right.position.x - syncState.right.x) > 15) {
                        state.right.position.x = syncState.right.x;
                    }
                    state.right.facingLeft = syncState.right.facingLeft;
                }
            };

            handleOpponentDisconnect = () => {
                // eslint-disable-next-line no-alert
                alert('Opponent disconnected from the match.');
                finishFight(state[role === 'host' ? 'left' : 'right']);
            };

            socket.on('opponent-input', handleOpponentInput);
            socket.on('opponent-sync-state', handleOpponentSync);
            socket.on('opponent-disconnected', handleOpponentDisconnect);
        }

        const handleCriticalInput = key => {
            const combinations = {
                left: controls.PlayerOneCriticalHitCombination,
                right: controls.PlayerTwoCriticalHitCombination
            };
            let side = null;
            if (combinations.left.includes(key)) side = 'left';
            if (!isPvE && !isOnline && combinations.right.includes(key)) side = 'right';
            if (!side) return;

            const combination = combinations[side];
            criticalSequence[side].push(key);
            if (criticalSequence[side].length > combination.length) criticalSequence[side].shift();
            const isReady = combination.every((value, index) => criticalSequence[side][index] === value);
            if (!isReady) return;

            const attacker = state[side];
            const defenderSide = side === 'left' ? 'right' : 'left';
            const defender = state[defenderSide];

            if (roundTransitionActive || attacker.health <= 0 || attacker.isDizzy || defender.health <= 0) return;

            // Check Super Meter: requires full 100% meter
            const currentMeter = attacker.superMeter || 0;
            if (currentMeter < 100) {
                vfx.spawnFloatingText(
                    attacker.position.x + fighterWidth / 2,
                    attacker.position.y + 40,
                    'METER NOT FULL',
                    'block'
                );
                return;
            }

            // Check Melee Distance: must be in close melee proximity (<= 140px)
            const distance = Math.abs(attacker.position.x - defender.position.x);
            if (distance > 140) {
                vfx.spawnFloatingText(
                    attacker.position.x + fighterWidth / 2,
                    attacker.position.y + 40,
                    'TOO FAR!',
                    'block'
                );
                return;
            }

            if (Date.now() - lastCriticalHit[side] < 2000) return;

            // Consume 100% Super Meter
            attacker.superMeter = 0;
            updateSuperBar(side, 0);

            // Execute Critical Super Strike (24 damage, unblockable MK3 super strike)
            state[defenderSide] = takeDamage(state[defenderSide], 24, attacker.position.x, {
                isUnblockable: true
            });
            updateHealthBar(defenderSide, state[defenderSide]);
            setStatus(defenderSide, 'arena___fighter--critical');
            vfx.triggerScreenShake('heavy');
            vfx.triggerHitStop(130);
            vfx.spawnFloatingText(
                defender.position.x + fighterWidth / 2,
                defender.position.y + 40,
                'CRITICAL SUPER!',
                'crit'
            );
            vfx.spawnBlood(
                defender.position.x + fighterWidth / 2,
                defender.position.y + 70,
                defender.position.x >= attacker.position.x ? 1 : -1,
                'heavy'
            );
            vfx.spawnHitSparks(defender.position.x + fighterWidth / 2, defender.position.y + 100, false, true);
            lastCriticalHit[side] = Date.now();
            criticalSequence[side] = [];

            if (finishHimActive || state[defenderSide].isDizzy || defender.isDizzy) {
                onFatalKnockout(attacker, defenderSide);
            } else if (state[defenderSide].health <= 0) {
                handleFighterHealthDepleted(side, defenderSide);
            }
        };

        const handleKeyDown = event => {
            pressedKeys.add(event.code);
            handleCriticalInput(event.code);

            // Double-tap dashes
            if (event.code === controls.PlayerOneLeft && checkDoubleTap('PlayerOneLeft')) {
                state.left = startDash(state.left, -1);
                vfx.spawnDust(state.left.position.x + fighterWidth / 2, state.left.position.y + fighterHeight - 20, -1);
            } else if (event.code === controls.PlayerOneRight && checkDoubleTap('PlayerOneRight')) {
                state.left = startDash(state.left, 1);
                vfx.spawnDust(state.left.position.x + fighterWidth / 2, state.left.position.y + fighterHeight - 20, 1);
            } else if (
                !isPvE &&
                !isOnline &&
                event.code === controls.PlayerTwoLeft &&
                checkDoubleTap('PlayerTwoLeft')
            ) {
                state.right = startDash(state.right, -1);
                vfx.spawnDust(
                    state.right.position.x + fighterWidth / 2,
                    state.right.position.y + fighterHeight - 20,
                    -1
                );
            } else if (
                !isPvE &&
                !isOnline &&
                event.code === controls.PlayerTwoRight &&
                checkDoubleTap('PlayerTwoRight')
            ) {
                state.right = startDash(state.right, 1);
                vfx.spawnDust(
                    state.right.position.x + fighterWidth / 2,
                    state.right.position.y + fighterHeight - 20,
                    1
                );
            }

            if (isOnline) {
                if (socket && roomCode) {
                    socket.emit('player-input', { roomCode, type: 'keydown', code: event.code });
                }
                const localSide = role === 'host' ? 'left' : 'right';
                const isJab = event.code === controls.PlayerOneJab || event.code === controls.PlayerTwoJab;
                const isKick = event.code === controls.PlayerOneKick || event.code === controls.PlayerTwoKick;
                const isJump = event.code === controls.PlayerOneJump || event.code === controls.PlayerTwoJump;
                const isSpecial = event.code === controls.PlayerOneSpecial || event.code === controls.PlayerTwoSpecial;

                if (isJab) handleAttackInput(localSide, 'jab', controls.PlayerOneRight, controls.PlayerOneBlock);
                if (isKick) handleAttackInput(localSide, 'kick', controls.PlayerOneRight, controls.PlayerOneBlock);
                if (isSpecial)
                    handleAttackInput(localSide, 'special', controls.PlayerOneRight, controls.PlayerOneBlock);
                if (
                    isJump &&
                    state[localSide].isGrounded &&
                    state[localSide].state !== 'hit' &&
                    state[localSide].state !== 'fall' &&
                    state[localSide].state !== 'getup' &&
                    state[localSide].state !== 'death'
                ) {
                    state[localSide].velocity.y = -13;
                }
                if (isJump) event.preventDefault();
                return;
            }

            // Player 1 Attacks
            if (event.code === controls.PlayerOneJab) {
                handleAttackInput('left', 'jab', controls.PlayerOneRight, controls.PlayerOneBlock);
            }
            if (event.code === controls.PlayerOneKick) {
                handleAttackInput('left', 'kick', controls.PlayerOneRight, controls.PlayerOneBlock);
            }
            if (event.code === controls.PlayerOneSpecial) {
                handleAttackInput('left', 'special', controls.PlayerOneRight, controls.PlayerOneBlock);
            }
            if (
                event.code === controls.PlayerOneJump &&
                state.left.isGrounded &&
                state.left.state !== 'hit' &&
                state.left.state !== 'fall' &&
                state.left.state !== 'getup' &&
                state.left.state !== 'death'
            ) {
                state.left.velocity.y = -13;
            }

            // Player 2 Local Attacks
            if (!isPvE) {
                if (event.code === controls.PlayerTwoJab) {
                    handleAttackInput('right', 'jab', controls.PlayerTwoLeft, controls.PlayerTwoBlock);
                }
                if (event.code === controls.PlayerTwoKick) {
                    handleAttackInput('right', 'kick', controls.PlayerTwoLeft, controls.PlayerTwoBlock);
                }
                if (event.code === controls.PlayerTwoSpecial) {
                    handleAttackInput('right', 'special', controls.PlayerTwoLeft, controls.PlayerTwoBlock);
                }
                if (
                    event.code === controls.PlayerTwoJump &&
                    state.right.isGrounded &&
                    state.right.state !== 'hit' &&
                    state.right.state !== 'fall' &&
                    state.right.state !== 'getup' &&
                    state.right.state !== 'death'
                ) {
                    state.right.velocity.y = -13;
                }
            }

            if (event.code === controls.PlayerOneJump || (!isPvE && event.code === controls.PlayerTwoJump)) {
                event.preventDefault();
            }
        };

        const handleKeyUp = event => {
            pressedKeys.delete(event.code);

            if (isOnline && socket && roomCode) {
                socket.emit('player-input', { roomCode, type: 'keyup', code: event.code });
            }
        };

        const loop = time => {
            if (finished) return;
            const elapsed = Math.min(40, time - previousTime);
            previousTime = time;
            const clientW = canvas.clientWidth || canvas.width;
            const clientH = canvas.clientHeight || 560;
            if (clientW && (canvas.width !== clientW || canvas.height !== clientH)) {
                canvas.width = clientW;
                canvas.height = clientH;
            }
            const groundY = getGroundY();
            if (state.left.isGrounded) state.left.position.y = groundY;
            if (state.right.isGrounded) state.right.position.y = groundY;
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Decrement combo chain timers
            ['left', 'right'].forEach(side => {
                if (comboChain[side].timer > 0) {
                    comboChain[side].timer -= elapsed;
                    if (comboChain[side].timer <= 0) {
                        comboChain[side].step = 0;
                    }
                }
            });

            vfx.update(elapsed);

            // Hit-Stop micro-freeze check
            if (vfx.isHitStopped()) {
                drawFighter(context, state.left);
                drawFighter(context, state.right);
                vfx.draw();
                animationFrame = requestAnimationFrame(loop);
                return;
            }

            let leftMovement = 0;
            let rightMovement = 0;

            if (roundTransitionActive) {
                // Keep physics (gravity, knockdown fall) and animation playing during round reset
                leftMovement = 0;
                rightMovement = 0;
            } else if (isOnline) {
                if (role === 'host') {
                    state.left = setBlocking(
                        state.left,
                        pressedKeys.has(controls.PlayerOneBlock) || pressedKeys.has(controls.PlayerTwoBlock)
                    );
                    leftMovement = getMovement('left', pressedKeys);

                    const remoteBlocked =
                        remoteKeys.has(controls.PlayerOneBlock) || remoteKeys.has(controls.PlayerTwoBlock);
                    state.right = setBlocking(state.right, remoteBlocked);
                    const remoteP1 =
                        Number(remoteKeys.has(controls.PlayerOneRight)) -
                        Number(remoteKeys.has(controls.PlayerOneLeft));
                    const remoteP2 = getMovement('right', remoteKeys);
                    rightMovement = remoteP1 || remoteP2;

                    if (socket && roomCode && time - lastSyncTime > 50) {
                        lastSyncTime = time;
                        socket.emit('sync-state', {
                            roomCode,
                            state: {
                                left: {
                                    x: state.left.position.x,
                                    y: state.left.position.y,
                                    health: state.left.health,
                                    facingLeft: state.left.facingLeft,
                                    state: state.left.state
                                },
                                right: {
                                    x: state.right.position.x,
                                    y: state.right.position.y,
                                    health: state.right.health,
                                    facingLeft: state.right.facingLeft,
                                    state: state.right.state
                                }
                            }
                        });
                    }
                } else {
                    const remoteBlocked =
                        remoteKeys.has(controls.PlayerOneBlock) || remoteKeys.has(controls.PlayerTwoBlock);
                    state.left = setBlocking(state.left, remoteBlocked);
                    const remoteP1 =
                        Number(remoteKeys.has(controls.PlayerOneRight)) -
                        Number(remoteKeys.has(controls.PlayerOneLeft));
                    const remoteP2 = getMovement('right', remoteKeys);
                    leftMovement = remoteP1 || remoteP2;

                    const localBlocked =
                        pressedKeys.has(controls.PlayerOneBlock) || pressedKeys.has(controls.PlayerTwoBlock);
                    state.right = setBlocking(state.right, localBlocked);
                    const localP1 =
                        Number(pressedKeys.has(controls.PlayerOneRight)) -
                        Number(pressedKeys.has(controls.PlayerOneLeft));
                    const localP2 = getMovement('right', pressedKeys);
                    rightMovement = localP1 || localP2;
                }
            } else if (isPvE && bot) {
                state.left = setBlocking(state.left, pressedKeys.has(controls.PlayerOneBlock));
                leftMovement = getMovement('left', pressedKeys);

                bot.update(elapsed, state.right, state.left, canvas.width, {
                    beginAttack: type => {
                        beginAttack('right', type);
                        if (type === 'special') {
                            executeSpecialMove('right', state, vfx);
                        }
                    },
                    jump: () => {
                        if (
                            state.right.isGrounded &&
                            state.right.state !== 'hit' &&
                            state.right.state !== 'fall' &&
                            state.right.state !== 'getup' &&
                            state.right.state !== 'death' &&
                            !state.right.isDizzy
                        ) {
                            state.right.velocity.y = -13;
                        }
                    },
                    dash: direction => {
                        state.right = startDash(state.right, direction);
                        vfx.spawnDust(
                            state.right.position.x + fighterWidth / 2,
                            state.right.position.y + fighterHeight - 20,
                            direction
                        );
                    }
                });
                state.right = setBlocking(state.right, bot.isBlockingState());
                rightMovement = bot.getMovement();
            } else {
                state.left = setBlocking(state.left, pressedKeys.has(controls.PlayerOneBlock));
                leftMovement = getMovement('left', pressedKeys);

                state.right = setBlocking(state.right, pressedKeys.has(controls.PlayerTwoBlock));
                rightMovement = getMovement('right', pressedKeys);
            }

            moveFighter(state.left, leftMovement, elapsed, canvas.width, groundY, vfx);
            moveFighter(state.right, rightMovement, elapsed, canvas.width, groundY, vfx);

            if (!state.left.isAttacking && state.left.state !== 'hit' && !state.left.isDizzy) {
                state.left.facingLeft = state.left.position.x > state.right.position.x;
            }
            if (!state.right.isAttacking && state.right.state !== 'hit' && !state.right.isDizzy) {
                state.right.facingLeft = state.right.position.x > state.left.position.x;
            }

            // Projectile collisions with fighters
            for (let i = vfx.projectiles.length - 1; i >= 0; i -= 1) {
                const proj = vfx.projectiles[i];
                if (proj && proj.active) {
                    const targetSide = proj.ownerSide === 'left' ? 'right' : 'left';
                    const target = state[targetSide];
                    const hitBox = {
                        position: { x: proj.x - proj.radius, y: proj.y - proj.radius },
                        width: proj.radius * 2,
                        height: proj.radius * 2
                    };

                    const isTargetDowned =
                        target.health <= 0 ||
                        target.state === 'death' ||
                        (target.isGrounded && (target.state === 'fall' || target.state === 'getup'));

                    if (!isTargetDowned && rectangularCollision({ rectangle1: hitBox, rectangle2: target.bodyBox })) {
                        proj.active = false;
                        state[targetSide] = takeDamage(target, proj.damage, proj.x, { isUnblockable: proj.isLow });
                        updateHealthBar(targetSide, state[targetSide]);
                        const blocked = state[targetSide].wasBlocking;

                        if (blocked) {
                            target.superMeter = Math.min(100, (target.superMeter || 0) + 5);
                            updateSuperBar(targetSide, target.superMeter);
                            vfx.spawnHitSparks(proj.x, proj.y, true, false);
                            vfx.triggerHitStop(40);
                            vfx.triggerScreenShake('light');
                            vfx.spawnFloatingText(proj.x, proj.y, 'BLOCKED', 'block');
                        } else {
                            state[proj.ownerSide].superMeter = Math.min(
                                100,
                                (state[proj.ownerSide].superMeter || 0) + 14
                            );
                            updateSuperBar(proj.ownerSide, state[proj.ownerSide].superMeter);
                            target.superMeter = Math.min(100, (target.superMeter || 0) + 8);
                            updateSuperBar(targetSide, target.superMeter);

                            vfx.spawnBlood(proj.x, proj.y, target.position.x >= proj.x ? 1 : -1);
                            vfx.spawnHitSparks(proj.x, proj.y, false, true);
                            vfx.triggerHitStop(60);
                            vfx.triggerScreenShake('medium');
                            vfx.spawnFloatingText(proj.x, proj.y, 'PROJECTILE!', 'special');

                            if (finishHimActive || target.isDizzy || state[targetSide].isDizzy) {
                                onFatalKnockout(state[proj.ownerSide], targetSide);
                                break;
                            }
                        }

                        if (state[targetSide].health <= 0) {
                            handleFighterHealthDepleted(proj.ownerSide, targetSide);
                        }
                    }
                }
            }

            // Melee Attacks and Hit Detection
            ['left', 'right'].forEach(side => {
                if (roundTransitionActive) return;
                const fighter = state[side];
                const defenderSide = side === 'left' ? 'right' : 'left';
                if (fighter.isAttacking && fighter.currentFrame === fighter.activeHitFrame && !fighter.attackHit) {
                    fighter.attackHit = true;
                    const defender = state[defenderSide];
                    const isDefenderDowned =
                        defender.health <= 0 ||
                        defender.state === 'death' ||
                        (defender.isGrounded && (defender.state === 'fall' || defender.state === 'getup'));
                    if (
                        !isDefenderDowned &&
                        rectangularCollision({ rectangle1: fighter.attackBox, rectangle2: defender.bodyBox })
                    ) {
                        const isUnblockable = fighter.attackType === 'throw';
                        const isUppercut = fighter.attackType === 'uppercut';
                        const isSweep = fighter.attackType === 'sweep';
                        const impactX =
                            (fighter.attackBox.position.x + state[defenderSide].bodyBox.position.x + 60) / 2;
                        const impactY =
                            (fighter.attackBox.position.y + state[defenderSide].bodyBox.position.y + 40) / 2;
                        state[defenderSide] = takeDamage(state[defenderSide], fighter.damage, fighter.position.x, {
                            isUnblockable,
                            isUppercut,
                            isSweep
                        });
                        updateHealthBar(defenderSide, state[defenderSide]);
                        const defenderWasBlocking = state[defenderSide].wasBlocking;

                        if (defenderWasBlocking) {
                            state[defenderSide].superMeter = Math.min(100, (state[defenderSide].superMeter || 0) + 6);
                            updateSuperBar(defenderSide, state[defenderSide].superMeter);
                            vfx.spawnHitSparks(impactX, impactY, true, false);
                            vfx.triggerHitStop(40);
                            vfx.triggerScreenShake('light');
                            vfx.spawnFloatingText(impactX, impactY, 'BLOCKED', 'block');
                        } else {
                            fighter.superMeter = Math.min(100, (fighter.superMeter || 0) + 16);
                            updateSuperBar(side, fighter.superMeter);
                            state[defenderSide].superMeter = Math.min(100, (state[defenderSide].superMeter || 0) + 9);
                            updateSuperBar(defenderSide, state[defenderSide].superMeter);

                            fighter.comboStreak += 1;
                            fighter.comboTimer = 1400;

                            const bloodIntensity = isUppercut || isUnblockable ? 'heavy' : 'normal';
                            vfx.spawnBlood(
                                impactX,
                                impactY,
                                state[defenderSide].position.x >= fighter.position.x ? 1 : -1,
                                bloodIntensity
                            );
                            vfx.spawnHitSparks(impactX, impactY, false, isUppercut || isUnblockable);

                            if (isUppercut) {
                                vfx.triggerScreenShake('heavy');
                                vfx.triggerHitStop(110);
                                vfx.spawnFloatingText(impactX, impactY, 'UPPERCUT!', 'special');
                            } else if (isSweep) {
                                vfx.triggerScreenShake('medium');
                                vfx.triggerHitStop(90);
                                vfx.spawnFloatingText(impactX, impactY, 'LOW SWEEP!', 'special');
                            } else if (isUnblockable) {
                                vfx.triggerScreenShake('heavy');
                                vfx.triggerHitStop(85);
                                vfx.spawnFloatingText(impactX, impactY, 'THROW!', 'punish');
                            } else if (fighter.attackType === 'kick' || fighter.attackType === 'jumpkick') {
                                vfx.triggerScreenShake('medium');
                                vfx.triggerHitStop(70);
                                vfx.spawnFloatingText(
                                    impactX,
                                    impactY,
                                    fighter.attackType === 'jumpkick' ? 'JUMP KICK!' : `${fighter.comboStreak} HITS!`,
                                    'hit'
                                );
                            } else {
                                vfx.triggerScreenShake('light');
                                vfx.triggerHitStop(45);
                                vfx.spawnFloatingText(impactX, impactY, `${fighter.comboStreak} HITS!`, 'hit');
                            }

                            if (finishHimActive || defender.isDizzy || state[defenderSide].isDizzy) {
                                onFatalKnockout(fighter, defenderSide);
                                return;
                            }
                        }

                        if (state[defenderSide].health <= 0) {
                            handleFighterHealthDepleted(side, defenderSide);
                        }
                    }
                }
            });

            animateFighter(state.left, elapsed);
            animateFighter(state.right, elapsed);
            drawFighter(context, state.left);
            drawFighter(context, state.right);
            vfx.draw();

            ['left', 'right'].forEach(side => {
                const fighter = state[side];
                if (fighter.state === 'hit') {
                    setStatus(side, 'arena___fighter--hit');
                } else if (fighter.isBlocking) {
                    setStatus(side, 'arena___fighter--block');
                } else {
                    setStatus(side, null);
                }
            });

            animationFrame = requestAnimationFrame(loop);
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        animationFrame = requestAnimationFrame(loop);
    });
}
