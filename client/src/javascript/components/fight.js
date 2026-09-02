import controls from '../../constants/controls';
import { applyAttack, applyCriticalHit, createBattleState } from '../game/battleEngine';

function updateHealthBar(position, health, maxHealth) {
    const element = document.getElementById(`${position}-fighter-indicator`);

    if (!element) return;

    const percentage = Math.max(0, (health / maxHealth) * 100);
    element.style.width = `${percentage}%`;
}

export async function fight(firstFighter, secondFighter) {
    const state = createBattleState(firstFighter, secondFighter);
    const lastCriticalHit = { left: 0, right: 0 };
    const criticalSequence = { left: [], right: [] };
    const isBlocking = { left: false, right: false };

    updateHealthBar('left', state.left.health, state.left.maxHealth);
    updateHealthBar('right', state.right.health, state.right.maxHealth);

    return new Promise(resolve => {
        function finishFight(winner) {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            resolve(winner);
        }

        function handleKeyDown(event) {
            const pressedCode = event.code || `Key${String(event.key || '').toUpperCase()}`;
            const pressedKey = String(event.key || '').toUpperCase();
            const key = pressedCode;
            const isPlayerOneAttack = key === controls.PlayerOneAttack || pressedKey === 'A';
            const isPlayerTwoAttack = key === controls.PlayerTwoAttack || pressedKey === 'J';
            const isPlayerOneBlock = key === controls.PlayerOneBlock || pressedKey === 'D';
            const isPlayerTwoBlock = key === controls.PlayerTwoBlock || pressedKey === 'L';

            if (isPlayerOneBlock) {
                isBlocking.left = true;
                const blockElement = document.querySelector('.arena___fighter[data-position="left"]');

                blockElement?.classList.remove('arena___fighter--hit', 'arena___fighter--block');
                blockElement?.classList.add('arena___fighter--block');
                setTimeout(() => blockElement?.classList.remove('arena___fighter--block'), 220);
                return;
            }

            if (isPlayerTwoBlock) {
                isBlocking.right = true;
                const blockElement = document.querySelector('.arena___fighter[data-position="right"]');

                blockElement?.classList.remove('arena___fighter--hit', 'arena___fighter--block');
                blockElement?.classList.add('arena___fighter--block');
                setTimeout(() => blockElement?.classList.remove('arena___fighter--block'), 220);
                return;
            }

            if (isPlayerOneAttack || isPlayerTwoAttack) {
                const attackerSide = isPlayerOneAttack ? 'left' : 'right';
                const defenderSide = attackerSide === 'left' ? 'right' : 'left';

                if ((isPlayerOneAttack && isBlocking.right) || (isPlayerTwoAttack && isBlocking.left)) {
                    return;
                }

                const result = applyAttack(state, attackerSide);
                state.left = result.state.left;
                state.right = result.state.right;

                updateHealthBar(defenderSide, state[defenderSide].health, state[defenderSide].maxHealth);

                const defenderElement = document.querySelector(`.arena___fighter[data-position="${defenderSide}"]`);

                defenderElement?.classList.remove('arena___fighter--hit', 'arena___fighter--block');
                defenderElement?.classList.add('arena___fighter--hit');
                setTimeout(() => defenderElement?.classList.remove('arena___fighter--hit'), 260);

                if (result.winner) {
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

                    updateHealthBar(defenderSide, state[defenderSide].health, state[defenderSide].maxHealth);

                    const criticalElement = document.querySelector(`.arena___fighter[data-position="${side}"]`);

                    criticalElement?.classList.remove('arena___fighter--critical');
                    criticalElement?.classList.add('arena___fighter--critical');
                    setTimeout(() => criticalElement?.classList.remove('arena___fighter--critical'), 340);
                    lastCriticalHit[side] = Date.now();
                    criticalSequence[side] = [];

                    if (criticalResult.winner) {
                        finishFight(criticalResult.winner);
                    }
                }
            }
        }

        function handleKeyUp(event) {
            const pressedCode = event.code || `Key${String(event.key || '').toUpperCase()}`;

            if (pressedCode === controls.PlayerOneBlock || String(event.key || '').toUpperCase() === 'D') {
                isBlocking.left = false;
            }

            if (pressedCode === controls.PlayerTwoBlock || String(event.key || '').toUpperCase() === 'L') {
                isBlocking.right = false;
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    });
}
