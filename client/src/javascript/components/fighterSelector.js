import createElement from '../helpers/domHelper';
import renderArena from './arena';
import { createFighterPreview } from './fighterPreview';
import { getFighterInfo } from '../game/arcadeManager';
import socketService from '../services/socketService';
import showOnlineLobbyModal from './modal/onlineLobbyModal';

export { getFighterInfo };

function startFight(selectedFighters, options = {}) {
    if (selectedFighters.every(Boolean)) {
        renderArena(selectedFighters, options);
    }
}

function showCountdownOverlay(onComplete) {
    const root = document.getElementById('root');
    const layer = createElement({ tagName: 'div', className: 'modal-layer online-countdown-layer' });
    const countText = createElement({ tagName: 'div', className: 'online-countdown-text' });
    countText.innerText = '3';
    layer.appendChild(countText);
    root.appendChild(layer);

    let count = 3;
    const interval = setInterval(() => {
        count -= 1;
        if (count > 0) {
            countText.innerText = String(count);
        } else if (count === 0) {
            countText.innerText = 'FIGHT!';
            countText.classList.add('online-countdown-text--fight');
        } else {
            clearInterval(interval);
            layer.remove();
            if (typeof onComplete === 'function') onComplete();
        }
    }, 750);
}

function createModeSelector(gameMode, onSelectMode) {
    const container = createElement({
        tagName: 'div',
        className: 'preview-container___mode-switch'
    });

    const pvpBtn = createElement({
        tagName: 'button',
        className: `preview-container___mode-btn ${gameMode === 'pvp' ? 'preview-container___mode-btn--active' : ''}`,
        attributes: { type: 'button' }
    });
    pvpBtn.innerText = '👥 Player vs Player';
    pvpBtn.addEventListener('click', () => onSelectMode('pvp'));

    const pveBtn = createElement({
        tagName: 'button',
        className: `preview-container___mode-btn ${gameMode === 'pve' ? 'preview-container___mode-btn--active' : ''}`,
        attributes: { type: 'button' }
    });
    pveBtn.innerText = '🤖 Player vs AI';
    pveBtn.addEventListener('click', () => onSelectMode('pve'));

    const towerBtn = createElement({
        tagName: 'button',
        className: `preview-container___mode-btn ${
            gameMode === 'tower' ? 'preview-container___mode-btn--active preview-container___mode-btn--tower' : ''
        }`,
        attributes: { type: 'button' }
    });
    towerBtn.innerText = '⚔️ Tower Mode';
    towerBtn.addEventListener('click', () => onSelectMode('tower'));

    const onlineBtn = createElement({
        tagName: 'button',
        className: `preview-container___mode-btn ${
            gameMode === 'online' ? 'preview-container___mode-btn--active preview-container___mode-btn--online' : ''
        }`,
        attributes: { type: 'button' }
    });
    onlineBtn.innerText = '🌐 Online 1v1';
    onlineBtn.addEventListener('click', () => onSelectMode('online'));

    container.append(pvpBtn, pveBtn, towerBtn, onlineBtn);
    return container;
}

function createDifficultySelector(difficulty, onSelectDifficulty) {
    const container = createElement({
        tagName: 'div',
        className: 'preview-container___difficulty-switch'
    });

    const label = createElement({
        tagName: 'span',
        className: 'preview-container___difficulty-label'
    });
    label.innerText = 'AI Difficulty:';

    const buttonsContainer = createElement({
        tagName: 'div',
        className: 'preview-container___difficulty-group'
    });

    const difficulties = [
        { id: 'EASY', label: '🟢 Easy' },
        { id: 'MEDIUM', label: '🟡 Medium' },
        { id: 'HARD', label: '🔴 Hard' }
    ];

    difficulties.forEach(({ id, label: btnLabel }) => {
        const isActive = difficulty === id;
        const activeModifier = isActive
            ? ` preview-container___difficulty-btn--active preview-container___difficulty-btn--${id.toLowerCase()}`
            : '';
        const btn = createElement({
            tagName: 'button',
            className: `preview-container___difficulty-btn${activeModifier}`,
            attributes: { type: 'button' }
        });
        btn.innerText = btnLabel;
        btn.addEventListener('click', () => onSelectDifficulty(id));
        buttonsContainer.appendChild(btn);
    });

    container.append(label, buttonsContainer);
    return container;
}

function updateFighterCards(selectedFighters, currentFighter, gameMode = 'pvp', onlineRole = 'host') {
    document.querySelectorAll('.fighters___fighter').forEach(card => {
        const fighterId = card.getAttribute('data-fighter-id');
        const isSelected = selectedFighters.some(fighter => fighter && fighter._id === fighterId);
        const isCurrent = currentFighter && currentFighter._id === fighterId;

        let slot1Label = 'P1';
        let slot2Label = 'P2';
        if (gameMode === 'pve') {
            slot2Label = 'BOT';
        } else if (gameMode === 'tower') {
            slot1Label = 'HERO';
            slot2Label = 'STAGE 1';
        } else if (gameMode === 'online') {
            if (onlineRole === 'host') {
                slot1Label = 'YOU';
                slot2Label = 'OPPONENT';
            } else {
                slot1Label = 'OPPONENT';
                slot2Label = 'YOU';
            }
        }

        let slot = '';
        if (selectedFighters[0] && selectedFighters[0]._id === fighterId) {
            slot = slot1Label;
        } else if (selectedFighters[1] && selectedFighters[1]._id === fighterId) {
            slot = slot2Label;
        } else if (currentFighter && currentFighter._id === fighterId) {
            if (gameMode === 'tower') {
                slot = 'CHAMPION';
            } else if (selectedFighters[0]) {
                slot = slot2Label;
            } else {
                slot = slot1Label;
            }
        }

        card.classList.toggle('fighters___fighter--selected', isCurrent || isSelected);
        card.classList.toggle('fighters___fighter--confirmed', isSelected);

        let badge = card.querySelector('.fighters___fighter-badge');
        if (!badge) {
            badge = createElement({ tagName: 'span', className: 'fighters___fighter-badge' });
            card.appendChild(badge);
        }

        badge.innerText = slot;
        badge.classList.toggle('fighters___fighter-badge--visible', Boolean(slot));
        badge.classList.toggle('fighters___fighter-badge--bot', slot === 'BOT' || slot === 'STAGE 1');
    });
}

function renderSelectedFighters({
    selectedFighters,
    currentFighter = null,
    gameMode = 'pvp',
    difficulty = 'MEDIUM',
    onlineRoomCode = null,
    onlineRole = 'host',
    isLocalReady = false,
    isOpponentReady = false,
    onSelectMode,
    onSelectDifficulty,
    onPickRandomBot,
    onConfirmOnlineReady
}) {
    const fightersPreview = document.querySelector('.preview-container___root');
    if (!fightersPreview) return;

    fightersPreview.innerHTML = '';

    const modeSelector = createModeSelector(gameMode, onSelectMode);
    fightersPreview.append(modeSelector);

    if (gameMode === 'pve' && typeof onSelectDifficulty === 'function') {
        const difficultySelector = createDifficultySelector(difficulty, onSelectDifficulty);
        fightersPreview.append(difficultySelector);
    }

    const title = createElement({ tagName: 'h2', className: 'fighters___title' });

    if (gameMode === 'tower') {
        title.innerText = 'Choose your Champion';
        const towerPill = createElement({
            tagName: 'div',
            className: 'preview-container___tower-badge'
        });
        towerPill.innerText = '🏛️ 6-STAGE ARCADE LADDER · SCALING AI DIFFICULTY';
        fightersPreview.append(towerPill);
    } else if (gameMode === 'online') {
        const roleText = onlineRole === 'host' ? 'Player 1 (Host)' : 'Player 2 (Guest)';
        title.innerText = `Online Match: Room ${onlineRoomCode}`;
        const onlinePill = createElement({
            tagName: 'div',
            className: 'preview-container___online-badge'
        });
        onlinePill.innerText = `🌐 CONNECTED · YOU ARE ${roleText.toUpperCase()}`;
        fightersPreview.append(onlinePill);
    } else if (selectedFighters.every(Boolean)) {
        title.innerText = gameMode === 'pve' ? `Ready to fight (vs AI · ${difficulty})` : 'Ready to fight';
    } else if (selectedFighters[0] && !selectedFighters[1]) {
        title.innerText = gameMode === 'pve' ? 'Choose computer opponent' : 'Choose second fighter';
    } else {
        title.innerText = gameMode === 'pve' ? 'Choose your fighter' : 'Choose first fighter';
    }
    fightersPreview.append(title);

    if (gameMode === 'pve' && selectedFighters[0] && !selectedFighters[1] && typeof onPickRandomBot === 'function') {
        const randomBotBtn = createElement({
            tagName: 'button',
            className: 'preview-container___random-btn',
            attributes: { type: 'button' }
        });
        randomBotBtn.innerText = '🎲 Random Opponent';
        randomBotBtn.addEventListener('click', onPickRandomBot);
        fightersPreview.append(randomBotBtn);
    }

    const showBothSelected = selectedFighters[0] && selectedFighters[1];
    if (showBothSelected || (gameMode === 'online' && (selectedFighters[0] || selectedFighters[1]))) {
        const topRow = createElement({ tagName: 'div', className: 'preview-container___selected-row' });
        const player1 = selectedFighters[0]
            ? createFighterPreview(selectedFighters[0], 'left')
            : createElement({ tagName: 'div', className: 'preview-container___placeholder-slot' });

        const player2 = selectedFighters[1]
            ? createFighterPreview(selectedFighters[1], 'right')
            : createElement({ tagName: 'div', className: 'preview-container___placeholder-slot' });

        if (!selectedFighters[0]) {
            player1.innerText = 'Waiting for P1...';
        }
        if (!selectedFighters[1]) {
            player2.innerText = 'Waiting for P2...';
        }

        if (gameMode === 'pve') {
            const p2Title = player2.querySelector('h3');
            if (p2Title) {
                p2Title.innerText = `${selectedFighters[1].name} [BOT · ${difficulty}]`;
            }
        } else if (gameMode === 'tower') {
            const p1Title = player1.querySelector('h3');
            if (p1Title) {
                p1Title.innerText = `${selectedFighters[0].name} [CHAMPION]`;
            }
            const p2Title = player2.querySelector('h3');
            if (p2Title) {
                p2Title.innerText = `${selectedFighters[1].name} [STAGE 1 · EASY]`;
            }
        } else if (gameMode === 'online') {
            const p1Title = player1.querySelector('h3');
            const p2Title = player2.querySelector('h3');
            const p1ReadyText = isOpponentReady && onlineRole === 'guest' ? ' ✓ READY' : '';
            const p2ReadyText = isOpponentReady && onlineRole === 'host' ? ' ✓ READY' : '';
            const localReadyText = isLocalReady ? ' ✓ READY' : '';

            if (p1Title && selectedFighters[0]) {
                const label = onlineRole === 'host' ? `[YOU${localReadyText}]` : `[OPPONENT${p1ReadyText}]`;
                p1Title.innerText = `${selectedFighters[0].name} ${label}`;
            }
            if (p2Title && selectedFighters[1]) {
                const label = onlineRole === 'guest' ? `[YOU${localReadyText}]` : `[OPPONENT${p2ReadyText}]`;
                p2Title.innerText = `${selectedFighters[1].name} ${label}`;
            }
        }

        topRow.append(player1, player2);
        fightersPreview.append(topRow);
    }

    if (currentFighter) {
        const focusCard = createElement({ tagName: 'div', className: 'preview-container___focus-card' });
        const focusTitle = createElement({ tagName: 'h3', className: 'preview-container___focus-title' });
        const focusText = createElement({ tagName: 'p', className: 'preview-container___focus-text' });

        const focusPrefix = gameMode === 'tower' ? 'Champion candidate: ' : 'Selected: ';
        focusTitle.innerText = `${focusPrefix}${currentFighter.name}`;
        focusText.innerText = `Health ${currentFighter.health ?? '—'} · Attack ${
            currentFighter.attack ?? '—'
        } · Defense ${currentFighter.defense ?? '—'}`;

        focusCard.append(focusTitle, focusText);
        fightersPreview.append(focusCard);
    }

    // Fight / Ready Action Button
    if (gameMode === 'online') {
        const localFighter = onlineRole === 'host' ? selectedFighters[0] : selectedFighters[1];
        if (localFighter) {
            const readyBtn = createElement({
                tagName: 'button',
                className: 'preview-container___fight-btn preview-container___fight-btn--online',
                attributes: { type: 'button' }
            });

            if (isLocalReady) {
                readyBtn.innerText = '✓ Ready! (Waiting for opponent...)';
                readyBtn.classList.add('preview-container___fight-btn--ready');
                readyBtn.disabled = true;
            } else {
                readyBtn.innerText = 'Confirm Fighter ⚔️';
                readyBtn.addEventListener('click', onConfirmOnlineReady);
            }
            fightersPreview.append(readyBtn);
        }
    } else {
        const canStartFight = selectedFighters.every(Boolean);
        if (canStartFight) {
            const fightButton = createElement({
                tagName: 'button',
                className: 'preview-container___fight-btn'
            });

            if (gameMode === 'tower') {
                fightButton.innerText = 'Enter the Tower ⚔️';
                fightButton.classList.add('preview-container___fight-btn--tower');
                fightButton.addEventListener(
                    'click',
                    () => startFight(selectedFighters, { isTower: true, champion: selectedFighters[0] }),
                    false
                );
            } else {
                fightButton.innerText = 'Fight';
                fightButton.addEventListener(
                    'click',
                    () => startFight(selectedFighters, { isPvE: gameMode === 'pve', difficulty }),
                    false
                );
            }
            fightersPreview.append(fightButton);
        }
    }

    updateFighterCards(selectedFighters, currentFighter, gameMode, onlineRole);
}

export function createFightersSelector() {
    let selectedFighters = [null, null];
    let currentFighter = null;
    let gameMode = 'pvp';
    let difficulty = 'MEDIUM';
    let onlineRoomCode = null;
    let onlineRole = 'host';
    let isLocalReady = false;
    let isOpponentReady = false;

    const renderSelection = () => {
        renderSelectedFighters({
            selectedFighters,
            currentFighter,
            gameMode,
            difficulty,
            onlineRoomCode,
            onlineRole,
            isLocalReady,
            isOpponentReady,
            onSelectMode: newMode => {
                if (newMode === 'online') {
                    showOnlineLobbyModal({
                        onRoomReady: ({ roomCode, role, socket }) => {
                            gameMode = 'online';
                            onlineRoomCode = roomCode;
                            onlineRole = role;
                            selectedFighters = [null, null];
                            currentFighter = null;
                            isLocalReady = false;
                            isOpponentReady = false;

                            socket.on('opponent-selected-fighter', ({ fighter }) => {
                                if (onlineRole === 'host') {
                                    selectedFighters = [selectedFighters[0], fighter];
                                } else {
                                    selectedFighters = [fighter, selectedFighters[1]];
                                }
                                renderSelection();
                            });

                            socket.on('opponent-ready', () => {
                                isOpponentReady = true;
                                renderSelection();
                            });

                            socket.on('game-start', ({ fighters }) => {
                                showCountdownOverlay(() => {
                                    startFight(fighters, {
                                        isOnline: true,
                                        role: onlineRole,
                                        roomCode: onlineRoomCode,
                                        socket
                                    });
                                });
                            });

                            socket.on('opponent-disconnected', () => {
                                // eslint-disable-next-line no-alert
                                alert('Opponent has disconnected from the room.');
                                gameMode = 'pvp';
                                onlineRoomCode = null;
                                selectedFighters = [null, null];
                                renderSelection();
                            });

                            renderSelection();
                        },
                        onCancel: () => {
                            gameMode = 'pvp';
                            renderSelection();
                        }
                    });
                    return;
                }

                if (gameMode === 'online' && onlineRoomCode) {
                    socketService.leaveRoom(onlineRoomCode);
                    onlineRoomCode = null;
                }

                if (gameMode !== newMode) {
                    gameMode = newMode;
                    currentFighter = null;
                    selectedFighters = [null, null];
                    renderSelection();
                }
            },
            onSelectDifficulty: newDifficulty => {
                if (difficulty !== newDifficulty) {
                    difficulty = newDifficulty;
                    renderSelection();
                }
            },
            onPickRandomBot: async () => {
                const fighterCards = Array.from(document.querySelectorAll('.fighters___fighter'));
                const availableIds = fighterCards
                    .map(card => card.getAttribute('data-fighter-id'))
                    .filter(id => id && (!selectedFighters[0] || selectedFighters[0]._id !== id));
                if (availableIds.length === 0) return;
                const randomId = availableIds[Math.floor(Math.random() * availableIds.length)];
                const botFighter = await getFighterInfo(randomId);
                if (botFighter) {
                    selectedFighters = [selectedFighters[0], botFighter];
                    currentFighter = null;
                    renderSelection();
                }
            },
            onConfirmOnlineReady: () => {
                isLocalReady = true;
                socketService.setPlayerReady(onlineRoomCode, onlineRole);
                renderSelection();
            }
        });
    };

    // Auto-open online lobby if ?room=XYZ in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('room')) {
        queueMicrotask(() => {
            showOnlineLobbyModal({
                onRoomReady: ({ roomCode, role, socket }) => {
                    gameMode = 'online';
                    onlineRoomCode = roomCode;
                    onlineRole = role;
                    selectedFighters = [null, null];
                    currentFighter = null;
                    isLocalReady = false;
                    isOpponentReady = false;

                    socket.on('opponent-selected-fighter', ({ fighter }) => {
                        if (onlineRole === 'host') {
                            selectedFighters = [selectedFighters[0], fighter];
                        } else {
                            selectedFighters = [fighter, selectedFighters[1]];
                        }
                        renderSelection();
                    });

                    socket.on('opponent-ready', () => {
                        isOpponentReady = true;
                        renderSelection();
                    });

                    socket.on('game-start', ({ fighters }) => {
                        showCountdownOverlay(() => {
                            startFight(fighters, {
                                isOnline: true,
                                role: onlineRole,
                                roomCode: onlineRoomCode,
                                socket
                            });
                        });
                    });

                    socket.on('opponent-disconnected', () => {
                        // eslint-disable-next-line no-alert
                        alert('Opponent has disconnected from the room.');
                        gameMode = 'pvp';
                        onlineRoomCode = null;
                        selectedFighters = [null, null];
                        renderSelection();
                    });

                    renderSelection();
                },
                onCancel: () => {
                    gameMode = 'pvp';
                    renderSelection();
                }
            });
        });
    }

    queueMicrotask(() => {
        renderSelection();
    });

    return async (event, fighterId) => {
        const fighter = await getFighterInfo(fighterId);
        if (!fighter) return;

        if (gameMode === 'online') {
            if (isLocalReady) return; // Cannot alter selection after readying up

            if (onlineRole === 'host') {
                selectedFighters = [fighter, selectedFighters[1]];
                socketService.selectFighter(onlineRoomCode, fighter, 'host');
            } else {
                selectedFighters = [selectedFighters[0], fighter];
                socketService.selectFighter(onlineRoomCode, fighter, 'guest');
            }
            currentFighter = null;
            renderSelection();
            return;
        }

        const isSameFighter = currentFighter && currentFighter._id === fighter._id;

        if (gameMode === 'tower') {
            if (isSameFighter) {
                const stage1Opponent = await getFighterInfo('1');
                selectedFighters = [fighter, stage1Opponent];
                currentFighter = null;
                renderSelection();
                return;
            }
            currentFighter = fighter;
            renderSelection();
            return;
        }

        const nextSlot = selectedFighters[0] ? 1 : 0;

        if (isSameFighter) {
            if (selectedFighters[nextSlot] && selectedFighters[nextSlot]._id === fighter._id) return;
            selectedFighters = [...selectedFighters];
            selectedFighters[nextSlot] = fighter;
            currentFighter = null;
            renderSelection();
            return;
        }

        currentFighter = fighter;
        renderSelection();
    };
}
