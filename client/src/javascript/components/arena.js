import createElement from '../helpers/domHelper';
import fight from './fight';
import showWinnerModal from './modal/winner';
import { getRandomBattleBackground } from '../helpers/fighterAssets';
import { getStageProfile, getStageOpponentId, getFighterInfo } from '../game/arcadeManager';
import { showStageClearedModal, showTowerDefeatModal, showTowerChampionModal } from './modal/towerOverlay';

function createFighter(position) {
    const positionClassName = position === 'right' ? 'arena___right-fighter' : 'arena___left-fighter';
    const fighterElement = createElement({
        tagName: 'div',
        className: `arena___fighter ${positionClassName}`
    });

    fighterElement.setAttribute('data-position', position);
    fighterElement.dataset.pose = 'idle';
    return fighterElement;
}

function createFighters() {
    const battleField = createElement({ tagName: 'div', className: `arena___battlefield` });
    const firstFighterElement = createFighter('left');
    const secondFighterElement = createFighter('right');

    const canvas = createElement({
        tagName: 'canvas',
        className: 'arena___canvas',
        attributes: { width: '1200', height: '560', 'aria-label': 'Battlefield' }
    });

    battleField.append(canvas, firstFighterElement, secondFighterElement);
    return battleField;
}

function createHealthIndicator(fighter, position, options = {}) {
    const { name } = fighter;
    const isBot = position === 'right' && (options.isPvE || options.isTower);
    const container = createElement({
        tagName: 'div',
        className: `arena___fighter-indicator arena___fighter-indicator--${position}`
    });
    const headerRow = createElement({ tagName: 'div', className: 'arena___fighter-header' });
    const fighterName = createElement({ tagName: 'span', className: 'arena___fighter-name' });
    const healthPercent = createElement({
        tagName: 'span',
        className: 'arena___health-percent',
        attributes: { id: `${position}-health-percent` }
    });

    let diffLabel = ' [BOT]';
    if (options.isTower) {
        if (position === 'right') {
            const stageNum = (options.stageIndex ?? 0) + 1;
            const diffName = options.difficulty || 'Easy';
            diffLabel = ` [STAGE ${stageNum} · ${diffName}]`;
        } else {
            diffLabel = ' [CHAMPION]';
        }
    } else if (options.isOnline) {
        const isSelf =
            (options.role === 'host' && position === 'left') || (options.role === 'guest' && position === 'right');
        diffLabel = isSelf ? ' [YOU]' : ' [OPPONENT]';
    } else if (options.difficulty) {
        diffLabel = ` [BOT · ${options.difficulty}]`;
    }

    if (options.isTower && position === 'left') {
        fighterName.innerText = `${name}${diffLabel}`;
    } else if (options.isOnline) {
        fighterName.innerText = `${name}${diffLabel}`;
    } else {
        fighterName.innerText = isBot ? `${name}${diffLabel}` : name;
    }
    healthPercent.innerText = '100%';

    if (position === 'right') {
        headerRow.append(healthPercent, fighterName);
    } else {
        headerRow.append(fighterName, healthPercent);
    }

    const indicator = createElement({ tagName: 'div', className: 'arena___health-indicator' });
    const bar = createElement({
        tagName: 'div',
        className: `arena___health-bar arena___health-bar--${position}`,
        attributes: { id: `${position}-fighter-indicator` }
    });
    const shine = createElement({ tagName: 'div', className: 'arena___health-shine' });
    const ticks = createElement({ tagName: 'div', className: 'arena___health-ticks' });
    ticks.innerHTML =
        '<span class="arena___health-tick"></span><span class="arena___health-tick"></span><span class="arena___health-tick"></span>';

    indicator.append(bar, shine, ticks);

    const subBar = createElement({
        tagName: 'div',
        className: `arena___sub-bar arena___sub-bar--${position}`
    });
    const subBarFill = createElement({ tagName: 'div', className: 'arena___sub-bar-fill' });
    const subBarTrack = createElement({ tagName: 'div', className: 'arena___sub-bar-track' });

    if (position === 'right') {
        subBar.append(subBarTrack, subBarFill);
    } else {
        subBar.append(subBarFill, subBarTrack);
    }

    container.append(headerRow, indicator, subBar);

    return container;
}

function createHealthIndicators(leftFighter, rightFighter, options = {}) {
    const healthIndicators = createElement({ tagName: 'div', className: 'arena___fight-status' });
    const centerBlock = createElement({ tagName: 'div', className: 'arena___center-status' });
    const versusSign = createElement({ tagName: 'div', className: 'arena___versus-sign' });
    versusSign.innerText = 'VS';
    centerBlock.appendChild(versusSign);

    if (options.isTower) {
        const stagePill = createElement({
            tagName: 'div',
            className: 'arena___stage-pill',
            attributes: { id: 'arena-stage-pill' }
        });
        const stageNum = (options.stageIndex ?? 0) + 1;
        stagePill.innerText = `STAGE ${stageNum} / 6`;
        centerBlock.appendChild(stagePill);
    } else if (options.isOnline) {
        const onlinePill = createElement({
            tagName: 'div',
            className: 'arena___stage-pill arena___online-pill',
            attributes: { id: 'arena-online-pill' }
        });
        onlinePill.innerText = `ROOM: ${options.roomCode}`;
        centerBlock.appendChild(onlinePill);
    }

    const leftFighterIndicator = createHealthIndicator(leftFighter, 'left', options);
    const rightFighterIndicator = createHealthIndicator(rightFighter, 'right', options);

    healthIndicators.append(leftFighterIndicator, centerBlock, rightFighterIndicator);
    return healthIndicators;
}

function createArena(selectedFighters, options = {}) {
    const arena = createElement({ tagName: 'div', className: 'arena___root' });
    const healthIndicators = createHealthIndicators(selectedFighters[0], selectedFighters[1], options);
    const fighters = createFighters();

    const hotkeysButton = createElement({
        tagName: 'button',
        className: 'arena___hotkeys-button',
        attributes: {
            type: 'button',
            'aria-label': 'Show hotkeys',
            'aria-expanded': 'false',
            'aria-controls': 'arena-hotkeys'
        }
    });
    hotkeysButton.textContent = '?';
    const hotkeysPanel = createElement({
        tagName: 'section',
        className: 'arena___hotkeys-panel',
        attributes: { id: 'arena-hotkeys', hidden: 'true' }
    });

    let player2Controls =
        '<strong>Player 2</strong><span>Left / Right move</span><span>Down block</span><span>Numpad 1 jab</span><span>Numpad 2 kick</span><span>Up jump</span>';
    if (options.isOnline) {
        player2Controls = '<strong>Remote Opponent</strong><span>Synced in real-time over WebSockets</span>';
    } else if (options.isPvE || options.isTower) {
        player2Controls = '<strong>Computer (AI)</strong><span>Controlled automatically by AI Bot</span>';
    }

    hotkeysPanel.innerHTML = `
        <strong>Player 1</strong><span>A / D move</span><span>S block</span><span>J jab</span><span>K kick</span><span>Space jump</span>
        ${player2Controls}
    `;
    hotkeysButton.addEventListener('click', () => {
        const isOpen = hotkeysPanel.hasAttribute('hidden');
        hotkeysPanel.toggleAttribute('hidden', !isOpen);
        hotkeysButton.setAttribute('aria-expanded', String(isOpen));
        hotkeysButton.setAttribute('aria-label', isOpen ? 'Hide hotkeys' : 'Show hotkeys');
    });

    arena.append(healthIndicators, fighters, hotkeysButton, hotkeysPanel);
    return arena;
}

function waitForStageCleared(stageIndex, currentOpponent, nextOpponent) {
    return new Promise(resolve => {
        showStageClearedModal({
            stageIndex,
            currentOpponent,
            nextOpponent,
            onNextStage: resolve
        });
    });
}

function waitForTowerDefeat(stageIndex, opponent) {
    return new Promise(resolve => {
        showTowerDefeatModal({
            stageIndex,
            opponent,
            onRetry: () => resolve('retry'),
            onMainMenu: () => resolve('menu')
        });
    });
}

export default async function renderArena(selectedFighters, options = {}) {
    const root = document.getElementById('root');
    const battleBackground = getRandomBattleBackground();

    if (!options.isTower) {
        const arena = createArena(selectedFighters, options);
        arena.setAttribute('data-background', battleBackground.key);

        const backgroundImage = createElement({
            tagName: 'img',
            className: 'arena___background-image',
            attributes: {
                src: battleBackground.src,
                alt: '',
                'aria-hidden': 'true'
            }
        });

        backgroundImage.addEventListener('error', event => {
            const imageElement = event.currentTarget;
            imageElement.style.display = 'none';
        });

        arena.prepend(backgroundImage);
        root.innerHTML = '';
        root.append(arena);

        const winner = await fight(selectedFighters[0], selectedFighters[1], options);
        if (winner) {
            if (options.isOnline) {
                showWinnerModal(winner, () => {
                    if (options.socket && options.roomCode) {
                        options.socket.emit('rematch', { roomCode: options.roomCode, role: options.role });
                        // eslint-disable-next-line no-alert
                        alert('Rematch requested! Waiting for opponent...');
                        options.socket.once('rematch-start', () => {
                            renderArena(selectedFighters, options);
                        });
                    }
                });
            } else {
                showWinnerModal(winner);
            }
        }
        return;
    }

    // --- Tower Campaign Mode ---
    const champion = options.champion || selectedFighters[0];
    const initialOpponent = selectedFighters[1] || (await getFighterInfo(getStageOpponentId(0)));
    const initialProfile = getStageProfile(0);

    const initialOptions = {
        ...options,
        isTower: true,
        stageIndex: 0,
        difficulty: initialProfile.difficultyName
    };

    const arena = createArena([champion, initialOpponent], initialOptions);
    arena.setAttribute('data-background', battleBackground.key);

    const backgroundImage = createElement({
        tagName: 'img',
        className: 'arena___background-image',
        attributes: {
            src: battleBackground.src,
            alt: '',
            'aria-hidden': 'true'
        }
    });

    backgroundImage.addEventListener('error', event => {
        const imageElement = event.currentTarget;
        imageElement.style.display = 'none';
    });

    arena.prepend(backgroundImage);
    root.innerHTML = '';
    root.append(arena);

    let currentStageIndex = 0;

    while (currentStageIndex < 6) {
        const profile = getStageProfile(currentStageIndex);
        const opponentId = getStageOpponentId(currentStageIndex);
        // eslint-disable-next-line no-await-in-loop
        const opponent = await getFighterInfo(opponentId);

        // Update HUD for current stage
        const stagePill = document.getElementById('arena-stage-pill');
        if (stagePill) {
            stagePill.innerText = `STAGE ${currentStageIndex + 1} / 6`;
        }

        const rightNameEl = document.querySelector('.arena___fighter-indicator--right .arena___fighter-name');
        if (rightNameEl && opponent) {
            rightNameEl.innerText = `${opponent.name} [STAGE ${currentStageIndex + 1} · ${profile.difficultyName}]`;
        }

        const stageOptions = {
            ...options,
            isPvE: true,
            stageIndex: currentStageIndex,
            difficulty: profile.difficultyName,
            reactionDelay: profile.reactionDelay,
            attackProbability: profile.attackProbability,
            dodgeProbability: profile.dodgeProbability,
            movementJitter: profile.movementJitter
        };

        // eslint-disable-next-line no-await-in-loop
        const winner = await fight(champion, opponent, stageOptions);
        let championWon = false;
        if (winner) {
            if (winner.side) {
                championWon = winner.side === 'left';
            } else {
                championWon = winner._id === champion._id;
            }
        }

        if (championWon) {
            if (currentStageIndex < 5) {
                const nextOpponentId = getStageOpponentId(currentStageIndex + 1);
                // eslint-disable-next-line no-await-in-loop
                const nextOpponent = await getFighterInfo(nextOpponentId);

                // eslint-disable-next-line no-await-in-loop
                await waitForStageCleared(currentStageIndex, opponent, nextOpponent);

                currentStageIndex += 1;
            } else {
                showTowerChampionModal({
                    champion,
                    onMainMenu: () => {
                        window.dispatchEvent(new CustomEvent('new-fight'));
                    }
                });
                break;
            }
        } else {
            // eslint-disable-next-line no-await-in-loop
            const action = await waitForTowerDefeat(currentStageIndex, opponent);

            if (action === 'menu') {
                window.dispatchEvent(new CustomEvent('new-fight'));
                break;
            }
        }
    }
}
