import controls from '../../constants/controls';
import { applyAttack, applyCriticalHit, createBattleState } from '../game/battleEngine';

function updateHealthBar(position, health, maxHealth) {
    const element = document.getElementById(`${position}-fighter-indicator`);

    if (!element) return;

    const percentage = Math.max(0, (health / maxHealth) * 100);
    element.style.width = `${percentage}%`;
}

const poseTimers = {
    left: null,
    right: null
};

function getFighterElement(position) {
    return document.querySelector(`.arena___fighter[data-position="${position}"]`);
}

function setFighterPose(position, pose) {
    const fighterElement = getFighterElement(position);

    if (!fighterElement || fighterElement.getAttribute('data-sprite') !== 'true') return;

    fighterElement.dataset.pose = pose;
}

function clearPoseTimer(position) {
    if (poseTimers[position]) {
        window.clearTimeout(poseTimers[position]);
        poseTimers[position] = null;
    }
}

function setTransientPose(position, pose, duration, fallbackPose = 'idle') {
    clearPoseTimer(position);
    setFighterPose(position, pose);

    poseTimers[position] = window.setTimeout(() => {
        setFighterPose(position, fallbackPose);
        poseTimers[position] = null;
    }, duration);
}

export default async function fight(firstFighter, secondFighter) {
    const state = createBattleState(firstFighter, secondFighter);
    const lastCriticalHit = { left: 0, right: 0 };
    const criticalSequence = { left: [], right: [] };
    const isBlocking = { left: false, right: false };

    updateHealthBar('left', state.left.health, state.left.maxHealth);
    updateHealthBar('right', state.right.health, state.right.maxHealth);
    setFighterPose('left', 'idle');
    setFighterPose('right', 'idle');

    return new Promise(resolve => {
        let handleKeyDown = () => {};
        let handleKeyUp = () => {};

        const finishFight = winner => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            clearPoseTimer('left');
            clearPoseTimer('right');
            resolve(winner);
        };

        handleKeyDown = event => {
            const pressedCode = event.code || `Key${String(event.key || '').toUpperCase()}`;
            const pressedKey = String(event.key || '').toUpperCase();
            const key = pressedCode;
            const isPlayerOneAttack = key === controls.PlayerOneAttack || pressedKey === 'A';
            const isPlayerTwoAttack = key === controls.PlayerTwoAttack || pressedKey === 'J';
            const isPlayerOneBlock = key === controls.PlayerOneBlock || pressedKey === 'D';
            const isPlayerTwoBlock = key === controls.PlayerTwoBlock || pressedKey === 'L';

            if (isPlayerOneBlock) {
                isBlocking.left = true;
                const blockElement = getFighterElement('left');

                blockElement?.classList.remove('arena___fighter--hit', 'arena___fighter--block');
                blockElement?.classList.add('arena___fighter--block');
                setFighterPose('left', 'block');
                return;
            }

            if (isPlayerTwoBlock) {
                isBlocking.right = true;
                const blockElement = getFighterElement('right');

                blockElement?.classList.remove('arena___fighter--hit', 'arena___fighter--block');
                blockElement?.classList.add('arena___fighter--block');
                setFighterPose('right', 'block');
                return;
            }

            if (isPlayerOneAttack || isPlayerTwoAttack) {
                const attackerSide = isPlayerOneAttack ? 'left' : 'right';
                const defenderSide = attackerSide === 'left' ? 'right' : 'left';
                const attackerPose = attackerSide === 'left' ? 'punch' : 'kick';

                if ((isPlayerOneAttack && isBlocking.right) || (isPlayerTwoAttack && isBlocking.left)) {
                    return;
                }

                setTransientPose(attackerSide, attackerPose, 280);

                const result = applyAttack(state, attackerSide);
                state.left = result.state.left;
                state.right = result.state.right;

                updateHealthBar(defenderSide, state[defenderSide].health, state[defenderSide].maxHealth);

                const defenderElement = document.querySelector(`.arena___fighter[data-position="${defenderSide}"]`);

                defenderElement?.classList.remove('arena___fighter--hit', 'arena___fighter--block');
                defenderElement?.classList.add('arena___fighter--hit');
                setTimeout(() => defenderElement?.classList.remove('arena___fighter--hit'), 260);

                if (result.winner) {
                    clearPoseTimer(attackerSide);
                    setFighterPose(attackerSide, 'victory');
                    finishFight(result.winner);
                }
            }

            const oneCombo = controls.PlayerOneCriticalHitCombination;
            const twoCombo = controls.PlayerTwoCriticalHitCombination;
            let side = null;
            let combo = null;

            if (oneCombo.includes(key)) {
                side = 'left';
                combo = oneCombo;
            } else if (twoCombo.includes(key)) {
                side = 'right';
                combo = twoCombo;
            }

            if (side && combo) {
                criticalSequence[side].push(key);
                const isComboReady =
                    criticalSequence[side].length >= combo.length &&
                    criticalSequence[side].slice(-combo.length).every((value, index) => value === combo[index]);

                if (isComboReady && Date.now() - lastCriticalHit[side] >= 10000) {
                    const criticalResult = applyCriticalHit(state, side);
                    const defenderSide = side === 'left' ? 'right' : 'left';
                    state.left = criticalResult.state.left;
                    state.right = criticalResult.state.right;

                    setTransientPose(side, side === 'left' ? 'punch' : 'kick', 320);

                    updateHealthBar(defenderSide, state[defenderSide].health, state[defenderSide].maxHealth);

                    const criticalElement = getFighterElement(side);

                    criticalElement?.classList.remove('arena___fighter--critical');
                    criticalElement?.classList.add('arena___fighter--critical');
                    setTimeout(() => criticalElement?.classList.remove('arena___fighter--critical'), 340);
                    lastCriticalHit[side] = Date.now();
                    criticalSequence[side] = [];

                    if (criticalResult.winner) {
                        clearPoseTimer(side);
                        setFighterPose(side, 'victory');
                        finishFight(criticalResult.winner);
                    }
                }
            }
        };

        handleKeyUp = event => {
            const pressedCode = event.code || `Key${String(event.key || '').toUpperCase()}`;

            if (pressedCode === controls.PlayerOneBlock || String(event.key || '').toUpperCase() === 'D') {
                isBlocking.left = false;
                setFighterPose('left', 'idle');
            }

            if (pressedCode === controls.PlayerTwoBlock || String(event.key || '').toUpperCase() === 'L') {
                isBlocking.right = false;
                setFighterPose('right', 'idle');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    });
}
