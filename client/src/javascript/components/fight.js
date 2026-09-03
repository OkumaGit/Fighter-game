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

/* eslint-disable no-param-reassign */

const frameCache = new Map();
const fighterWidth = 220;
const fighterHeight = 315;
const bodyWidth = 128;
const bodyHeight = 280;
const bodyOffsetX = 46;
const bodyOffsetY = 28;

function getFrame(pose, frame) {
    const key = `${pose}:${frame}`;
    if (!frameCache.has(key)) {
        const image = new Image();
        image.src = getBattleFrameSource(pose, frame);
        frameCache.set(key, image);
    }
    return frameCache.get(key);
}

function updateHealthBar(position, fighter) {
    const element = document.getElementById(`${position}-fighter-indicator`);
    if (element) element.style.width = `${Math.max(0, fighter.health)}%`;
}

function setStatus(position, className) {
    const element = document.querySelector(`.arena___fighter[data-position="${position}"]`);
    if (!element) return;
    element.classList.remove('arena___fighter--hit', 'arena___fighter--block');
    if (className) element.classList.add(className);
}

function drawFighter(context, fighter) {
    const pose = fighter.state === 'hit' ? 'idle' : fighter.state;
    const image = getFrame(pose, fighter.currentFrame);
    if (!image.complete || image.naturalWidth === 0) return;

    context.save();
    if (fighter.facingLeft) {
        context.translate(fighter.position.x + fighterWidth, fighter.position.y);
        context.scale(-1, 1);
        context.drawImage(image, 0, 0, fighterWidth, fighterHeight);
    } else {
        context.drawImage(image, fighter.position.x, fighter.position.y, fighterWidth, fighterHeight);
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
    if (direction && !fighter.isAttacking && !fighter.isBlocking) {
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

export default async function fight(firstFighter, secondFighter) {
    const state = createBattleState(firstFighter, secondFighter);
    const canvas = document.querySelector('.arena___canvas');
    const context = canvas.getContext('2d');
    const pressedKeys = new Set();
    const criticalSequence = { left: [], right: [] };
    const lastCriticalHit = { left: 0, right: 0 };
    let animationFrame;
    let previousTime = performance.now();
    let finished = false;

    const getGroundY = () => canvas.height - fighterHeight - 20;

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
        const finishFight = winner => {
            if (finished) return;
            finished = true;
            cancelAnimationFrame(animationFrame);
            // eslint-disable-next-line no-use-before-define
            document.removeEventListener('keydown', handleKeyDown);
            // eslint-disable-next-line no-use-before-define
            document.removeEventListener('keyup', handleKeyUp);
            resolve(winner);
        };

        const beginAttack = (side, type) => {
            state[side] = startAttack(state[side], type);
        };

        const handleCriticalInput = key => {
            const combinations = {
                left: controls.PlayerOneCriticalHitCombination,
                right: controls.PlayerTwoCriticalHitCombination
            };
            let side = null;
            if (combinations.left.includes(key)) side = 'left';
            if (combinations.right.includes(key)) side = 'right';
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
            if (event.code === controls.PlayerOneJab) beginAttack('left', 'jab');
            if (event.code === controls.PlayerOneKick) beginAttack('left', 'kick');
            if (event.code === controls.PlayerTwoJab) beginAttack('right', 'jab');
            if (event.code === controls.PlayerTwoKick) beginAttack('right', 'kick');
            if (event.code === controls.PlayerOneJump && state.left.isGrounded) state.left.velocity.y = -13;
            if (event.code === controls.PlayerTwoJump && state.right.isGrounded) state.right.velocity.y = -13;
            if (event.code === controls.PlayerOneJump || event.code === controls.PlayerTwoJump) event.preventDefault();
        };

        const handleKeyUp = event => pressedKeys.delete(event.code);

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

            state.left = setBlocking(state.left, pressedKeys.has(controls.PlayerOneBlock));
            state.right = setBlocking(state.right, pressedKeys.has(controls.PlayerTwoBlock));
            moveFighter(state.left, getMovement('left', pressedKeys), elapsed, canvas.width, groundY);
            moveFighter(state.right, getMovement('right', pressedKeys), elapsed, canvas.width, groundY);

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
                        setStatus(defenderSide, 'arena___fighter--hit');
                        if (state[defenderSide].health <= 0) finishFight(fighter);
                    }
                }
            });

            animateFighter(state.left, elapsed);
            animateFighter(state.right, elapsed);
            drawFighter(context, state.left);
            drawFighter(context, state.right);
            setStatus('left', state.left.isBlocking ? 'arena___fighter--block' : null);
            setStatus('right', state.right.isBlocking ? 'arena___fighter--block' : null);
            animationFrame = requestAnimationFrame(loop);
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        animationFrame = requestAnimationFrame(loop);
    });
}
