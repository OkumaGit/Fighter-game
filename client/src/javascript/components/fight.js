import controls from '../../constants/controls';
import {
    createBattleState,
    rectangularCollision,
    startAttack,
    setBlocking,
    takeDamage,
    updateAttackBox
} from '../game/battleEngine';
import { getBattleFrameSource, getBattleSpriteConfig } from '../helpers/fighterAssets';
import createBotController from '../game/botController';

/* eslint-disable no-param-reassign */

const frameCache = new Map();
const fighterWidth = 220;
const fighterHeight = 315;
const bodyWidth = 128;
const bodyHeight = 280;
const bodyOffsetX = 46;
const bodyOffsetY = 28;

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
        Object.entries(config.poses).forEach(([pose, poseConfig]) => {
            for (let i = 0; i < poseConfig.frames; i += 1) {
                const fighterId = fighter._id ?? fighter.id ?? '1';
                const src = getBattleFrameSource(fighter, pose, i);
                const key = `${fighterId}:${pose}:${i}`;

                if (!frameCache.has(key)) {
                    const img = new Image();
                    const promise = new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                    img.src = src;
                    frameCache.set(key, img);
                    promises.push(promise);
                }
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

function drawFighter(context, fighter) {
    const pose = fighter.state === 'hit' ? 'idle' : fighter.state;
    const image = getFrame(fighter, pose, fighter.currentFrame);
    if (!image.complete || image.naturalWidth === 0) return;

    context.save();
    context.imageSmoothingEnabled = true;
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
    context.restore();
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
        }
        return;
    }

    if (fighter.state !== 'jab' && fighter.state !== 'kick') {
        fighter.isAttacking = false;
        fighter.attackType = null;
    }

    const config = getBattleSpriteConfig().poses[fighter.state] || getBattleSpriteConfig().poses.idle;
    const frameDuration = config.duration / config.frames;

    fighter.framesElapsed = (fighter.framesElapsed || 0) + elapsed;
    if (fighter.framesElapsed < frameDuration) return;

    fighter.framesElapsed = 0;
    if (fighter.currentFrame < config.frames - 1) {
        fighter.currentFrame += 1;
    } else if (config.loop) {
        fighter.currentFrame = 0;
    } else {
        fighter.isAttacking = false;
        fighter.attackType = null;
        if (fighter.isBlocking) {
            fighter.state = 'block';
        } else if (fighter.isGrounded) {
            fighter.state = 'idle';
        } else {
            fighter.state = 'jump';
        }
        fighter.currentFrame = 0;
    }
}

function moveFighter(fighter, direction, elapsed, canvasWidth, groundY) {
    if (fighter.velocity.x) {
        fighter.position.x += fighter.velocity.x * (elapsed / 16);
        fighter.velocity.x *= 0.82;
        if (Math.abs(fighter.velocity.x) < 0.2) {
            fighter.velocity.x = 0;
        }
    }

    if (direction && !fighter.isAttacking && !fighter.isBlocking && fighter.state !== 'hit') {
        fighter.position.x += direction * fighter.speed * (elapsed / 16);
        fighter.facingLeft = direction < 0;
    }

    fighter.velocity.y += 0.7 * (elapsed / 16);
    fighter.position.y += fighter.velocity.y * (elapsed / 16);
    if (fighter.position.y >= groundY) {
        fighter.position.y = groundY;
        fighter.velocity.y = 0;
        fighter.isGrounded = true;
    } else {
        fighter.isGrounded = false;
    }

    fighter.position.x = Math.max(20, Math.min(canvasWidth - fighterWidth - 20, fighter.position.x));
    updateAttackBox(fighter);
}

export default async function fight(firstFighter, secondFighter, options = {}) {
    const { isPvE = false, isOnline = false, role = 'host', roomCode = null, socket = null } = options;
    await preloadFighterSprites([firstFighter, secondFighter]);
    const state = createBattleState(firstFighter, secondFighter);
    const bot = isPvE ? createBotController('right', options) : null;

    const canvas = document.querySelector('.arena___canvas');
    const context = canvas.getContext('2d');
    const pressedKeys = new Set();
    const remoteKeys = new Set();
    const criticalSequence = { left: [], right: [] };
    const lastCriticalHit = { left: 0, right: 0 };
    let animationFrame;
    let previousTime = performance.now();
    let lastSyncTime = 0;
    let finished = false;

    const getGroundY = () => canvas.height - fighterHeight - 20;

    state.left.side = 'left';
    state.right.side = 'right';
    state.left.position = { x: 180, y: getGroundY() };
    state.right.position = { x: canvas.width - fighterWidth - 180, y: getGroundY() };
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

    return new Promise(resolve => {
        let handleOpponentInput;
        let handleOpponentSync;
        let handleOpponentDisconnect;

        const finishFight = winner => {
            if (finished) return;
            finished = true;
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

        const beginAttack = (side, type) => {
            state[side] = startAttack(state[side], type);
        };

        if (isOnline && socket) {
            handleOpponentInput = ({ type, code }) => {
                if (type === 'keydown') {
                    remoteKeys.add(code);
                    const remoteSide = role === 'host' ? 'right' : 'left';
                    const isJab = code === controls.PlayerOneJab || code === controls.PlayerTwoJab;
                    const isKick = code === controls.PlayerOneKick || code === controls.PlayerTwoKick;
                    const isJump = code === controls.PlayerOneJump || code === controls.PlayerTwoJump;

                    if (isJab) beginAttack(remoteSide, 'jab');
                    if (isKick) beginAttack(remoteSide, 'kick');
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
            if (!isReady || Date.now() - lastCriticalHit[side] < 10000) return;

            const defenderSide = side === 'left' ? 'right' : 'left';
            const attacker = state[side];
            state[defenderSide] = takeDamage(state[defenderSide], attacker.attack * 2, attacker.position.x);
            updateHealthBar(defenderSide, state[defenderSide]);
            setStatus(defenderSide, 'arena___fighter--critical');
            lastCriticalHit[side] = Date.now();
            criticalSequence[side] = [];
            if (state[defenderSide].health <= 0) finishFight(attacker);
        };

        const handleKeyDown = event => {
            pressedKeys.add(event.code);
            handleCriticalInput(event.code);

            if (isOnline) {
                if (socket && roomCode) {
                    socket.emit('player-input', { roomCode, type: 'keydown', code: event.code });
                }
                const localSide = role === 'host' ? 'left' : 'right';
                const isJab = event.code === controls.PlayerOneJab || event.code === controls.PlayerTwoJab;
                const isKick = event.code === controls.PlayerOneKick || event.code === controls.PlayerTwoKick;
                const isJump = event.code === controls.PlayerOneJump || event.code === controls.PlayerTwoJump;

                if (isJab) beginAttack(localSide, 'jab');
                if (isKick) beginAttack(localSide, 'kick');
                if (isJump && state[localSide].isGrounded && state[localSide].state !== 'hit') {
                    state[localSide].velocity.y = -13;
                }
                if (isJump) event.preventDefault();
                return;
            }

            if (event.code === controls.PlayerOneJab) beginAttack('left', 'jab');
            if (event.code === controls.PlayerOneKick) beginAttack('left', 'kick');
            if (!isPvE && event.code === controls.PlayerTwoJab) beginAttack('right', 'jab');
            if (!isPvE && event.code === controls.PlayerTwoKick) beginAttack('right', 'kick');
            if (event.code === controls.PlayerOneJump && state.left.isGrounded && state.left.state !== 'hit')
                state.left.velocity.y = -13;
            if (
                !isPvE &&
                event.code === controls.PlayerTwoJump &&
                state.right.isGrounded &&
                state.right.state !== 'hit'
            )
                state.right.velocity.y = -13;
            if (event.code === controls.PlayerOneJump || (!isPvE && event.code === controls.PlayerTwoJump))
                event.preventDefault();
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
            const canvasWidth = canvas.clientWidth || canvas.width;
            canvas.width = canvasWidth;
            canvas.height = canvas.clientHeight || 560;
            const groundY = getGroundY();
            if (state.left.isGrounded) state.left.position.y = groundY;
            if (state.right.isGrounded) state.right.position.y = groundY;
            context.clearRect(0, 0, canvas.width, canvas.height);

            let leftMovement = 0;
            let rightMovement = 0;

            if (isOnline) {
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

                    // Authoritative host sends sync-state periodically
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
                    beginAttack: type => beginAttack('right', type),
                    jump: () => {
                        if (state.right.isGrounded && state.right.state !== 'hit') {
                            state.right.velocity.y = -13;
                        }
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

            moveFighter(state.left, leftMovement, elapsed, canvas.width, groundY);
            moveFighter(state.right, rightMovement, elapsed, canvas.width, groundY);

            if (!state.left.isAttacking && state.left.state !== 'hit') {
                state.left.facingLeft = state.left.position.x > state.right.position.x;
            }
            if (!state.right.isAttacking && state.right.state !== 'hit') {
                state.right.facingLeft = state.right.position.x > state.left.position.x;
            }

            ['left', 'right'].forEach(side => {
                const fighter = state[side];
                const defenderSide = side === 'left' ? 'right' : 'left';
                if (fighter.isAttacking && fighter.currentFrame === fighter.activeHitFrame && !fighter.attackHit) {
                    fighter.attackHit = true;
                    if (
                        rectangularCollision({ rectangle1: fighter.attackBox, rectangle2: state[defenderSide].bodyBox })
                    ) {
                        state[defenderSide] = takeDamage(state[defenderSide], fighter.damage, fighter.position.x);
                        updateHealthBar(defenderSide, state[defenderSide]);
                        if (state[defenderSide].health <= 0) finishFight(fighter);
                    }
                }
            });

            animateFighter(state.left, elapsed);
            animateFighter(state.right, elapsed);
            drawFighter(context, state.left);
            drawFighter(context, state.right);
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
