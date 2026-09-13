import createElement from '../helpers/domHelper';
import renderArena from './arena';
import { createFighterPanel } from './fighterPreview';
import { getFighterInfo } from '../game/arcadeManager';
import socketService from '../services/socketService';
import showOnlineLobbyModal from './modal/onlineLobbyModal';
import { createIcon } from '../helpers/icons';

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

    const modes = [
        { id: 'pvp', icon: 'pvp', label: 'Player vs Player' },
        { id: 'pve', icon: 'pve', label: 'Player vs AI' },
        { id: 'tower', icon: 'tower', label: 'Tower Mode' },
        { id: 'online', icon: 'online', label: 'Online 1v1' }
    ];

    modes.forEach(({ id, icon, label }) => {
        const isActive = gameMode === id;
        const btn = createElement({
            tagName: 'button',
            className: `preview-container___mode-btn ${isActive ? 'preview-container___mode-btn--active' : ''}${
                id === 'tower' && isActive ? ' preview-container___mode-btn--tower' : ''
            }${id === 'online' && isActive ? ' preview-container___mode-btn--online' : ''}`,
            attributes: { type: 'button' }
        });
        const iconElem = createIcon(icon);
        const textElem = createElement({ tagName: 'span', className: 'preview-container___mode-text' });
        textElem.innerText = label;
        btn.append(iconElem, textElem);
        btn.addEventListener('click', () => onSelectMode(id));
        container.appendChild(btn);
    });

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
        { id: 'EASY', label: 'Easy', color: '#10b981' },
        { id: 'MEDIUM', label: 'Medium', color: '#f59e0b' },
        { id: 'HARD', label: 'Hard', color: '#ef4444' }
    ];

    difficulties.forEach(({ id, label: btnLabel, color }) => {
        const isActive = difficulty === id;
        const activeModifier = isActive
            ? ` preview-container___difficulty-btn--active preview-container___difficulty-btn--${id.toLowerCase()}`
            : '';
        const btn = createElement({
            tagName: 'button',
            className: `preview-container___difficulty-btn${activeModifier}`,
            attributes: { type: 'button' }
        });
        const dot = createElement({
            tagName: 'span',
            className: 'preview-container___difficulty-dot',
            attributes: {
                style: `display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: ${color}; margin-right: 5px;`
            }
        });
        const text = createElement({ tagName: 'span', innerText: btnLabel });
        btn.append(dot, text);
        btn.addEventListener('click', () => onSelectDifficulty(id));
        buttonsContainer.appendChild(btn);
    });

    container.append(label, buttonsContainer);
    return container;
}

function updateFighterCards(selectedFighters, hoveredFighter, gameMode = 'pvp', onlineRole = 'host') {
    document.querySelectorAll('.fighters___fighter').forEach(card => {
        const fighterId = card.getAttribute('data-fighter-id');
        const isP1 = selectedFighters[0] && selectedFighters[0]._id === fighterId;
        const isP2 = selectedFighters[1] && selectedFighters[1]._id === fighterId;
        const isHovered = hoveredFighter && hoveredFighter._id === fighterId;

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

        let badgeText = '';
        let isBotBadge = false;

        if (isP1) {
            badgeText = slot1Label;
        } else if (isP2) {
            badgeText = slot2Label;
            isBotBadge = slot2Label === 'BOT' || slot2Label === 'STAGE 1';
        } else if (isHovered && !selectedFighters.every(Boolean)) {
            if (!selectedFighters[0]) {
                badgeText = slot1Label;
            } else if (!selectedFighters[1]) {
                badgeText = slot2Label;
                isBotBadge = slot2Label === 'BOT' || slot2Label === 'STAGE 1';
            }
        }

        card.classList.toggle('fighters___fighter--selected', Boolean(isP1 || isP2 || isHovered));
        card.classList.toggle('fighters___fighter--confirmed', Boolean(isP1 || isP2));

        let badge = card.querySelector('.fighters___fighter-badge');
        if (!badge) {
            badge = createElement({ tagName: 'span', className: 'fighters___fighter-badge' });
            card.appendChild(badge);
        }

        badge.innerText = badgeText;
        badge.classList.toggle('fighters___fighter-badge--visible', Boolean(badgeText));
        badge.classList.toggle('fighters___fighter-badge--bot', isBotBadge);
    });
}

function renderSelectedFighters({
    selectedFighters,
    hoveredFighter = null,
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
    const headerContainer = document.getElementById('fighters-header') || document.querySelector('.fighters___header');
    const slotP1 = document.getElementById('slot-p1');
    const slotP2 = document.getElementById('slot-p2');
    const turnIndicator = document.getElementById('turn-indicator');
    const actionSlot = document.getElementById('action-slot');

    // 1. Render Header Slot (Mode Tabs, Subcontrols, Badges, Title)
    if (headerContainer) {
        headerContainer.innerHTML = '';
        const modeSelector = createModeSelector(gameMode, onSelectMode);
        headerContainer.appendChild(modeSelector);

        if (gameMode === 'pve' && typeof onSelectDifficulty === 'function') {
            const subControls = createElement({
                tagName: 'div',
                className: 'preview-container___subcontrols'
            });
            const difficultySelector = createDifficultySelector(difficulty, onSelectDifficulty);
            subControls.appendChild(difficultySelector);

            if (selectedFighters[0] && !selectedFighters[1] && typeof onPickRandomBot === 'function') {
                const randomBotBtn = createElement({
                    tagName: 'button',
                    className: 'preview-container___random-btn',
                    attributes: { type: 'button' }
                });
                const diceIcon = createIcon('dice');
                const btnText = createElement({ tagName: 'span', innerText: 'Random Opponent' });
                randomBotBtn.append(diceIcon, btnText);
                randomBotBtn.addEventListener('click', onPickRandomBot);
                subControls.appendChild(randomBotBtn);
            }
            headerContainer.appendChild(subControls);
        } else if (gameMode === 'tower') {
            const towerPill = createElement({
                tagName: 'div',
                className: 'preview-container___tower-badge'
            });
            const towerIcon = createIcon('tower');
            const pillText = createElement({
                tagName: 'span',
                innerText: '6-STAGE ARCADE LADDER · SCALING AI DIFFICULTY'
            });
            towerPill.append(towerIcon, pillText);
            headerContainer.appendChild(towerPill);
        } else if (gameMode === 'online') {
            const roleText = onlineRole === 'host' ? 'Player 1 (Host)' : 'Player 2 (Guest)';
            const onlinePill = createElement({
                tagName: 'div',
                className: 'preview-container___online-badge'
            });
            const onlineIcon = createIcon('online');
            const pillText = createElement({
                tagName: 'span',
                innerText: `ROOM ${onlineRoomCode || '-----'} · YOU ARE ${roleText.toUpperCase()}`
            });
            onlinePill.append(onlineIcon, pillText);
            headerContainer.appendChild(onlinePill);
        }

        const title = createElement({ tagName: 'h2', className: 'fighters___title' });
        if (gameMode === 'tower') {
            title.innerText = 'CHOOSE YOUR CHAMPION';
        } else if (gameMode === 'online') {
            title.innerText = `ONLINE MATCH: ROOM ${onlineRoomCode || '...'}`;
        } else if (selectedFighters.every(Boolean)) {
            title.innerText = gameMode === 'pve' ? `READY TO FIGHT (VS AI · ${difficulty})` : 'READY TO FIGHT';
        } else if (selectedFighters[0] && !selectedFighters[1]) {
            title.innerText = gameMode === 'pve' ? 'CHOOSE COMPUTER OPPONENT' : 'CHOOSE SECOND FIGHTER';
        } else {
            title.innerText = gameMode === 'pve' ? 'CHOOSE YOUR FIGHTER' : 'CHOOSE FIRST FIGHTER';
        }
        headerContainer.appendChild(title);
    }

    // Determine Candidate Fighters for side panels (selected or hovered)
    let p1Candidate = selectedFighters[0];
    let p2Candidate = selectedFighters[1];

    if (gameMode === 'online') {
        if (onlineRole === 'host' && !selectedFighters[0]) {
            p1Candidate = hoveredFighter;
        } else if (onlineRole === 'guest' && !selectedFighters[1]) {
            p2Candidate = hoveredFighter;
        }
    } else if (gameMode === 'tower') {
        if (!selectedFighters[0]) {
            p1Candidate = hoveredFighter;
        }
    } else if (!selectedFighters[0]) {
        p1Candidate = hoveredFighter;
    } else if (!selectedFighters[1]) {
        p2Candidate = hoveredFighter;
    }

    // 2. Render Left Panel (Slot P1)
    if (slotP1) {
        let p1Tag = 'PLAYER 1';
        if (gameMode === 'tower') {
            p1Tag = 'CHAMPION';
        } else if (gameMode === 'online') {
            const readyStr = isLocalReady && onlineRole === 'host' ? ' [READY]' : '';
            const oppReadyStr = isOpponentReady && onlineRole === 'guest' ? ' [READY]' : '';
            p1Tag = onlineRole === 'host' ? `YOU${readyStr}` : `OPPONENT${oppReadyStr}`;
        }
        const p1Panel = createFighterPanel(p1Candidate, 'left', p1Tag);
        slotP1.innerHTML = '';
        slotP1.appendChild(p1Panel);
    }

    // 3. Render Right Panel (Slot P2)
    if (slotP2) {
        let p2Tag = 'PLAYER 2';
        if (gameMode === 'pve') {
            p2Tag = `BOT [${difficulty}]`;
        } else if (gameMode === 'tower') {
            p2Tag = 'STAGE 1 · EASY';
        } else if (gameMode === 'online') {
            const readyStr = isLocalReady && onlineRole === 'guest' ? ' [READY]' : '';
            const oppReadyStr = isOpponentReady && onlineRole === 'host' ? ' [READY]' : '';
            p2Tag = onlineRole === 'guest' ? `YOU${readyStr}` : `OPPONENT${oppReadyStr}`;
        }
        const p2Panel = createFighterPanel(p2Candidate, 'right', p2Tag);
        slotP2.innerHTML = '';
        slotP2.appendChild(p2Panel);
    }

    // 4. Render Turn Indicator
    if (turnIndicator) {
        if (gameMode === 'tower') {
            turnIndicator.innerText = selectedFighters[0] ? '▸ READY TO ENTER THE TOWER' : '▸ CHOOSE YOUR CHAMPION';
        } else if (gameMode === 'online') {
            if (isLocalReady && isOpponentReady) {
                turnIndicator.innerText = '▸ STARTING MATCH...';
            } else if (isLocalReady) {
                turnIndicator.innerText = '▸ YOU ARE READY — WAITING FOR OPPONENT...';
            } else {
                const hasChosen = onlineRole === 'host' ? selectedFighters[0] : selectedFighters[1];
                turnIndicator.innerText = hasChosen ? '▸ CLICK CONFIRM FIGHTER TO READY UP' : '▸ CHOOSE YOUR FIGHTER';
            }
        } else if (selectedFighters.every(Boolean)) {
            turnIndicator.innerText = '▸ READY FOR BATTLE';
        } else if (selectedFighters[0] && !selectedFighters[1]) {
            turnIndicator.innerText = gameMode === 'pve' ? '▸ CHOOSE COMPUTER OPPONENT' : '▸ PLAYER 2 — CHOOSE';
        } else {
            turnIndicator.innerText = gameMode === 'pve' ? '▸ CHOOSE YOUR FIGHTER' : '▸ PLAYER 1 — CHOOSE';
        }
    }

    // 5. Render Action Button in Bottom Bar
    if (actionSlot) {
        actionSlot.innerHTML = '';
        const fightBtn = createElement({
            tagName: 'button',
            className: 'fighters___fight-btn',
            attributes: { type: 'button' }
        });

        if (gameMode === 'online') {
            const localFighter = onlineRole === 'host' ? selectedFighters[0] : selectedFighters[1];
            if (!localFighter) {
                fightBtn.innerText = 'SELECT FIGHTER';
                fightBtn.disabled = true;
                fightBtn.classList.add('fighters___fight-btn--disabled');
            } else if (isLocalReady) {
                fightBtn.innerText = 'READY (WAITING...)';
                fightBtn.disabled = true;
                fightBtn.classList.add('fighters___fight-btn--ready');
            } else {
                fightBtn.innerText = 'CONFIRM FIGHTER';
                fightBtn.addEventListener('click', onConfirmOnlineReady);
            }
        } else if (gameMode === 'tower') {
            if (selectedFighters[0]) {
                fightBtn.innerText = 'ENTER THE TOWER';
                fightBtn.addEventListener('click', () => {
                    startFight(selectedFighters, { isTower: true, champion: selectedFighters[0] });
                });
            } else {
                fightBtn.innerText = 'CHOOSE CHAMPION';
                fightBtn.disabled = true;
                fightBtn.classList.add('fighters___fight-btn--disabled');
            }
        } else {
            const canFight = selectedFighters.every(Boolean);
            fightBtn.innerText = 'FIGHT';
            if (canFight) {
                fightBtn.addEventListener('click', () => {
                    startFight(selectedFighters, { isPvE: gameMode === 'pve', difficulty });
                });
            } else {
                fightBtn.disabled = true;
                fightBtn.classList.add('fighters___fight-btn--disabled');
            }
        }
        actionSlot.appendChild(fightBtn);
    }

    // 6. Update Character Cards Grid
    updateFighterCards(selectedFighters, hoveredFighter, gameMode, onlineRole);
}

export function createFightersSelector() {
    let selectedFighters = [null, null];
    let hoveredFighter = null;
    let currentHoverId = null;
    let gameMode = 'pvp';
    let difficulty = 'MEDIUM';
    let onlineRoomCode = null;
    let onlineRole = 'host';
    let isLocalReady = false;
    let isOpponentReady = false;

    let renderSelection = () => {};

    renderSelection = () => {
        renderSelectedFighters({
            selectedFighters,
            hoveredFighter,
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
                            hoveredFighter = null;
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
                    hoveredFighter = null;
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
                    hoveredFighter = null;
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
                    hoveredFighter = null;
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

    const selectFighter = async (event, fighterId) => {
        const fighter = await getFighterInfo(fighterId);
        if (!fighter) return;

        if (gameMode === 'online') {
            if (isLocalReady) return;

            if (onlineRole === 'host') {
                selectedFighters = [fighter, selectedFighters[1]];
                socketService.selectFighter(onlineRoomCode, fighter, 'host');
            } else {
                selectedFighters = [selectedFighters[0], fighter];
                socketService.selectFighter(onlineRoomCode, fighter, 'guest');
            }
            hoveredFighter = null;
            renderSelection();
            return;
        }

        if (gameMode === 'tower') {
            if (selectedFighters[0] && selectedFighters[0]._id === fighter._id) {
                selectedFighters = [null, null];
                hoveredFighter = null;
                renderSelection();
                return;
            }
            const stage1Opponent = await getFighterInfo('1');
            selectedFighters = [fighter, stage1Opponent];
            hoveredFighter = null;
            renderSelection();
            return;
        }

        // PvP and PvE Modes
        if (!selectedFighters[0]) {
            selectedFighters = [fighter, null];
            hoveredFighter = null;
            renderSelection();
            return;
        }

        if (selectedFighters[0]._id === fighter._id && !selectedFighters[1]) {
            selectedFighters = [null, null];
            hoveredFighter = null;
            renderSelection();
            return;
        }

        if (!selectedFighters[1]) {
            selectedFighters = [selectedFighters[0], fighter];
            hoveredFighter = null;
            renderSelection();
            return;
        }

        if (selectedFighters[1]._id === fighter._id) {
            selectedFighters = [selectedFighters[0], null];
            hoveredFighter = null;
            renderSelection();
            return;
        }

        // Both selected: replace slot 2 (or if clicking P1's card, reset P1)
        if (selectedFighters[0]._id === fighter._id) {
            selectedFighters = [null, selectedFighters[1]];
        } else {
            selectedFighters = [selectedFighters[0], fighter];
        }
        hoveredFighter = null;
        renderSelection();
    };

    selectFighter.onHover = async fighterId => {
        currentHoverId = fighterId;
        if (gameMode !== 'online' && selectedFighters.every(Boolean)) return;
        const fighter = await getFighterInfo(fighterId);
        if (currentHoverId === fighterId) {
            hoveredFighter = fighter;
            renderSelection();
        }
    };

    selectFighter.onLeave = fighterId => {
        if (currentHoverId === fighterId) {
            currentHoverId = null;
            hoveredFighter = null;
            renderSelection();
        }
    };

    return selectFighter;
}
