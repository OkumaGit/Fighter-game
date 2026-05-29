import controls from '../../constants/controls';

function updateHealthBar(position, health, maxHealth) {
    const element = document.getElementById(`${position}-fighter-indicator`);

    if (!element) return;

    const percentage = Math.max(0, (health / maxHealth) * 100);
    element.style.width = `${percentage}%`;
}

export function getHitPower(fighter) {
    return fighter.attack * (Math.random() + 1);
}

export function getBlockPower(fighter) {
    return fighter.defense * (Math.random() + 1);
}

export function getDamage(attacker, defender) {
    const hitPower = getHitPower(attacker);
    const blockPower = getBlockPower(defender);

    if (blockPower >= hitPower) {
        return 0;
    }

    return hitPower - blockPower;
}

export async function fight(firstFighter, secondFighter) {
    const leftFighter = {
        ...firstFighter,
        health: firstFighter.health ?? 45,
        maxHealth: firstFighter.health ?? 45
    };
    const rightFighter = {
        ...secondFighter,
        health: secondFighter.health ?? 45,
        maxHealth: secondFighter.health ?? 45
    };
    const lastCriticalHit = { left: 0, right: 0 };
    const criticalSequence = { left: [], right: [] };
    const isBlocking = { left: false, right: false };

    updateHealthBar('left', leftFighter.health, leftFighter.maxHealth);
    updateHealthBar('right', rightFighter.health, rightFighter.maxHealth);

    return new Promise(resolve => {
        function finishFight(winner) {
            // eslint-disable-next-line no-use-before-define
            document.removeEventListener('keydown', handleKeyDown);
            // eslint-disable-next-line no-use-before-define
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
                const attacker = isPlayerOneAttack ? leftFighter : rightFighter;
                const defender = isPlayerOneAttack ? rightFighter : leftFighter;

                if ((isPlayerOneAttack && isBlocking.right) || (isPlayerTwoAttack && isBlocking.left)) {
                    return;
                }

                const damage = getDamage(attacker, defender);

                defender.health = Math.max(0, defender.health - damage);
                updateHealthBar(isPlayerOneAttack ? 'right' : 'left', defender.health, defender.maxHealth);

                const defenderPosition = isPlayerOneAttack ? 'right' : 'left';
                const defenderElement = document.querySelector(`.arena___fighter[data-position="${defenderPosition}"]`);

                defenderElement?.classList.remove('arena___fighter--hit', 'arena___fighter--block');
                defenderElement?.classList.add('arena___fighter--hit');
                setTimeout(() => defenderElement?.classList.remove('arena___fighter--hit'), 260);

                if (defender.health <= 0) {
                    finishFight(attacker);
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
                    const attacker = side === 'left' ? leftFighter : rightFighter;
                    const defender = side === 'left' ? rightFighter : leftFighter;

                    defender.health = Math.max(0, defender.health - 2 * attacker.attack);
                    updateHealthBar(side === 'left' ? 'right' : 'left', defender.health, defender.maxHealth);
                    const criticalElement = document.querySelector(
                        `.arena___fighter[data-position="${side === 'left' ? 'left' : 'right'}"]`
                    );

                    criticalElement?.classList.remove('arena___fighter--critical');
                    criticalElement?.classList.add('arena___fighter--critical');
                    setTimeout(() => criticalElement?.classList.remove('arena___fighter--critical'), 340);
                    lastCriticalHit[side] = Date.now();
                    criticalSequence[side] = [];

                    if (defender.health <= 0) {
                        finishFight(attacker);
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
