import createElement from '../../helpers/domHelper';
import { getFighterLore } from '../../helpers/fighterLore';

export default function showMoveListModal({
    fighter1,
    fighter2,
    isPvE = false,
    isTower = false,
    isOnline = false,
    onBack = () => {},
    onClose = () => {}
}) {
    const root = document.getElementById('root') || document.body;

    const f1Lore = getFighterLore(fighter1);
    const f2Lore = getFighterLore(fighter2);

    let p2Label = 'Player 2 (P2)';
    if (isOnline) p2Label = 'Online Opponent';
    else if (isPvE || isTower) p2Label = 'Computer (AI)';

    const layer = createElement({
        tagName: 'div',
        className: 'modal-layer move-list-modal___layer'
    });

    const modal = createElement({
        tagName: 'div',
        className: 'modal-root move-list-modal___container'
    });

    // Top gold accent line
    const topAccent = createElement({ tagName: 'div', className: 'move-list-modal___top-accent' });

    // Corner brackets matching winner-modal aesthetic
    const createCorner = mod =>
        createElement({
            tagName: 'span',
            className: `move-list-modal___corner move-list-modal___corner--${mod}`
        });
    const cornerTL = createCorner('tl');
    const cornerTR = createCorner('tr');
    const cornerBL = createCorner('bl');
    const cornerBR = createCorner('br');

    // Header
    const header = createElement({ tagName: 'div', className: 'move-list-modal___header' });
    const headerTitleBox = createElement({ tagName: 'div', className: 'move-list-modal___title-box' });
    const subtitle = createElement({
        tagName: 'span',
        className: 'move-list-modal___subtitle',
        innerText: 'ARENA CLASH · COMBAT GUIDE'
    });
    const title = createElement({
        tagName: 'h2',
        className: 'move-list-modal___title',
        innerText: 'MOVE LIST'
    });
    headerTitleBox.append(subtitle, title);

    const closeBtn = createElement({
        tagName: 'button',
        className: 'move-list-modal___close-btn',
        attributes: { type: 'button', 'aria-label': 'Close Move List' },
        innerText: '×'
    });

    header.append(headerTitleBox, closeBtn);

    // Active Fighters Matchup Bar
    const matchupBar = createElement({ tagName: 'div', className: 'move-list-modal___matchup-bar' });

    const createFighterBadge = (lore, playerLabel, side) => {
        const badge = createElement({
            tagName: 'div',
            className: `move-list-modal___fighter-card move-list-modal___fighter-card--${side}`
        });

        const portraitWrap = createElement({
            tagName: 'div',
            className: 'move-list-modal___portrait-wrap'
        });
        const portrait = createElement({
            tagName: 'img',
            className: 'move-list-modal___portrait',
            attributes: { src: lore.portrait, alt: lore.name }
        });
        portraitWrap.appendChild(portrait);

        const info = createElement({ tagName: 'div', className: 'move-list-modal___fighter-info' });
        const pLabel = createElement({
            tagName: 'span',
            className: 'move-list-modal___player-tag',
            innerText: playerLabel
        });
        const nameRow = createElement({ tagName: 'div', className: 'move-list-modal___fighter-name-row' });
        const fName = createElement({
            tagName: 'h3',
            className: 'move-list-modal___fighter-name',
            innerText: lore.name
        });
        const elementPill = createElement({
            tagName: 'span',
            className: 'move-list-modal___element-pill',
            innerText: `${lore.elementIcon} ${lore.element}`
        });
        elementPill.style.borderColor = lore.color;
        elementPill.style.color = lore.color;

        nameRow.append(fName, elementPill);
        info.append(pLabel, nameRow);
        badge.append(portraitWrap, info);
        return badge;
    };

    const fighter1Badge = createFighterBadge(f1Lore, 'Player 1 (P1)', 'left');
    const vsSign = createElement({
        tagName: 'div',
        className: 'move-list-modal___vs-sign',
        innerText: 'VS'
    });
    const fighter2Badge = createFighterBadge(f2Lore, p2Label, 'right');

    matchupBar.append(fighter1Badge, vsSign, fighter2Badge);

    // Filter Tabs
    const tabsContainer = createElement({ tagName: 'div', className: 'move-list-modal___tabs' });
    const tabAll = createElement({
        tagName: 'button',
        className: 'move-list-modal___tab move-list-modal___tab--active',
        attributes: { type: 'button' },
        innerText: 'All Moves & Combos'
    });
    const tabP1 = createElement({
        tagName: 'button',
        className: 'move-list-modal___tab',
        attributes: { type: 'button' },
        innerText: `Player 1 [${f1Lore.name}]`
    });
    const tabP2 = createElement({
        tagName: 'button',
        className: 'move-list-modal___tab',
        attributes: { type: 'button' },
        innerText: `${p2Label} [${f2Lore.name}]`
    });
    tabsContainer.append(tabAll, tabP1, tabP2);

    // Moves List Content Container
    const movesList = createElement({ tagName: 'div', className: 'move-list-modal___moves-list' });

    const movesData = [
        {
            category: 'super',
            name: 'SUPER MOVE (CRITICAL STRIKE)',
            badge: '100% SUPER · UNBLOCKABLE',
            badgeClass: 'super',
            p1Keys: '<kbd>Q</kbd> + <kbd>W</kbd> + <kbd>E</kbd>',
            p2Keys: '<kbd>Num 7</kbd> + <kbd>Num 8</kbd> + <kbd>Num 9</kbd>',
            desc: 'Devastating unblockable elemental surge! Requires 100% Super Meter at point-blank range (<= 140px). Breaks through any guard, cancels from normal strikes, and deals 24 flat damage.',
            p1Detail: `${f1Lore.elementIcon} ${f1Lore.name}: <strong>${f1Lore.superName}</strong> — ${f1Lore.superDesc}`,
            p2Detail: `${f2Lore.elementIcon} ${f2Lore.name}: <strong>${f2Lore.superName}</strong> — ${f2Lore.superDesc}`
        },
        {
            category: 'special',
            name: 'SPECIAL MOVE (ELEMENTAL MAGIC)',
            badge: 'SIGNATURE MAGIC · COOLDOWN',
            badgeClass: 'special',
            p1Keys: '<kbd>U</kbd>',
            p2Keys: '<kbd>Num 3</kbd>',
            desc: 'Fighter signature elemental technique on cooldown (~4 sec).',
            p1Detail: `${f1Lore.elementIcon} ${f1Lore.name}: <strong>${f1Lore.specialName}</strong> — ${f1Lore.specialDesc}`,
            p2Detail: `${f2Lore.elementIcon} ${f2Lore.name}: <strong>${f2Lore.specialName}</strong> — ${f2Lore.specialDesc}`
        },
        {
            category: 'throw',
            name: 'GRAPPLE THROW (CLOSE RANGE)',
            badge: 'UNBLOCKABLE · POINT BLANK',
            badgeClass: 'unblockable',
            p1Keys: '<kbd>D</kbd> + <kbd>J</kbd> (Forward + Jab)',
            p2Keys: '<kbd>←</kbd> + <kbd>Num 1</kbd> (Forward + Jab)',
            desc: 'Slam the opponent overhead at point-blank range (< 88px). Pierces directly through enemy guard!'
        },
        {
            category: 'uppercut',
            name: 'UPPERCUT (LAUNCHER)',
            badge: 'LAUNCHER · HEAVY HIT',
            badgeClass: 'launcher',
            p1Keys: '<kbd>S</kbd> + <kbd>J</kbd> (Block + Jab)',
            p2Keys: '<kbd>↓</kbd> + <kbd>Num 1</kbd> (Block + Jab)',
            desc: 'Heavy rising strike from crouch. Launches the foe skyward, opening up juggle follow-ups!'
        },
        {
            category: 'sweep',
            name: 'LOW SWEEP (TRIP)',
            badge: 'LOW ATTACK · KNOCKDOWN',
            badgeClass: 'sweep',
            p1Keys: '<kbd>S</kbd> + <kbd>K</kbd> (Block + Kick)',
            p2Keys: '<kbd>↓</kbd> + <kbd>Num 2</kbd> (Block + Kick)',
            desc: 'Low sweeping leg kick. Knocks the opponent off their feet onto the ground.'
        },
        {
            category: 'combo',
            name: '2-HIT JAB COMBO',
            badge: 'RAPID CHAIN',
            badgeClass: 'combo',
            p1Keys: '<kbd>J</kbd> then immediately <kbd>J</kbd>',
            p2Keys: '<kbd>Num 1</kbd> then <kbd>Num 1</kbd>',
            desc: 'Fast double-jab combination with changing animation. Accelerates Super Meter build!'
        },
        {
            category: 'jumpkick',
            name: 'FLYING JUMP KICK',
            badge: 'AERIAL STRIKE',
            badgeClass: 'aerial',
            p1Keys: '<kbd>Space</kbd> + <kbd>K</kbd>',
            p2Keys: '<kbd>↑</kbd> + <kbd>Num 2</kbd>',
            desc: 'Mid-air diving kick with high priority and extended reach.'
        },
        {
            category: 'block',
            name: 'GUARD & CROUCH (BLOCK HOLD)',
            badge: 'DEFENSE · HOLD GUARD',
            badgeClass: 'defense',
            p1Keys: '<kbd>S</kbd> (Hold)',
            p2Keys: '<kbd>↓</kbd> (Hold)',
            desc: 'Holding the key locks the fighter in an immovable guard pose. Reduces incoming damage and gains Super Meter on block.'
        },
        {
            category: 'dash',
            name: 'EVASIVE DASH',
            badge: 'MOBILITY · DOUBLE-TAP',
            badgeClass: 'mobility',
            p1Keys: 'Double-tap <kbd>A</kbd>, <kbd>A</kbd> or <kbd>D</kbd>, <kbd>D</kbd>',
            p2Keys: 'Double-tap <kbd>←</kbd>, <kbd>←</kbd> or <kbd>→</kbd>, <kbd>→</kbd>',
            desc: 'Instant forward or backward burst of speed with dust trail for spacing or closing in.'
        },
        {
            category: 'movement',
            name: 'MOVEMENT & JUMP',
            badge: 'BASIC NAVIGATION',
            badgeClass: 'movement',
            p1Keys: '<kbd>A</kbd> Left, <kbd>D</kbd> Right, <kbd>Space</kbd> Jump',
            p2Keys: '<kbd>←</kbd> Left, <kbd>→</kbd> Right, <kbd>↑</kbd> Jump',
            desc: 'Arena traversal, spacing, and vertical jumping.'
        }
    ];

    let currentFilter = 'all';

    const renderMoves = () => {
        movesList.innerHTML = '';

        movesData.forEach(item => {
            const card = createElement({
                tagName: 'div',
                className: `move-card move-card--${item.badgeClass}`
            });

            const headerRow = createElement({ tagName: 'div', className: 'move-card___header' });
            const titleEl = createElement({
                tagName: 'h4',
                className: 'move-card___name',
                innerText: item.name
            });
            const badgeEl = createElement({
                tagName: 'span',
                className: `move-card___badge move-card___badge--${item.badgeClass}`,
                innerText: item.badge
            });
            headerRow.append(titleEl, badgeEl);

            const keysRow = createElement({ tagName: 'div', className: 'move-card___keys-row' });

            if (currentFilter === 'all' || currentFilter === 'p1') {
                const p1Col = createElement({ tagName: 'div', className: 'move-card___key-group' });
                p1Col.innerHTML = `<span class="move-card___key-label">Player 1:</span> <span class="move-card___keys">${item.p1Keys}</span>`;
                keysRow.appendChild(p1Col);
            }

            if (currentFilter === 'all' || currentFilter === 'p2') {
                const p2Col = createElement({ tagName: 'div', className: 'move-card___key-group' });
                p2Col.innerHTML = `<span class="move-card___key-label">${p2Label}:</span> <span class="move-card___keys">${item.p2Keys}</span>`;
                keysRow.appendChild(p2Col);
            }

            const descEl = createElement({
                tagName: 'p',
                className: 'move-card___desc',
                innerText: item.desc
            });

            card.append(headerRow, keysRow, descEl);

            if (item.p1Detail && (currentFilter === 'all' || currentFilter === 'p1')) {
                const p1DetailEl = createElement({
                    tagName: 'div',
                    className: 'move-card___fighter-detail move-card___fighter-detail--left'
                });
                p1DetailEl.innerHTML = item.p1Detail;
                card.appendChild(p1DetailEl);
            }

            if (item.p2Detail && (currentFilter === 'all' || currentFilter === 'p2')) {
                const p2DetailEl = createElement({
                    tagName: 'div',
                    className: 'move-card___fighter-detail move-card___fighter-detail--right'
                });
                p2DetailEl.innerHTML = item.p2Detail;
                card.appendChild(p2DetailEl);
            }

            movesList.appendChild(card);
        });
    };

    tabAll.addEventListener('click', () => {
        currentFilter = 'all';
        tabAll.classList.add('move-list-modal___tab--active');
        tabP1.classList.remove('move-list-modal___tab--active');
        tabP2.classList.remove('move-list-modal___tab--active');
        renderMoves();
    });

    tabP1.addEventListener('click', () => {
        currentFilter = 'p1';
        tabP1.classList.add('move-list-modal___tab--active');
        tabAll.classList.remove('move-list-modal___tab--active');
        tabP2.classList.remove('move-list-modal___tab--active');
        renderMoves();
    });

    tabP2.addEventListener('click', () => {
        currentFilter = 'p2';
        tabP2.classList.add('move-list-modal___tab--active');
        tabAll.classList.remove('move-list-modal___tab--active');
        tabP1.classList.remove('move-list-modal___tab--active');
        renderMoves();
    });

    renderMoves();

    // Footer actions
    const footer = createElement({ tagName: 'div', className: 'move-list-modal___footer' });
    const backBtn = createElement({
        tagName: 'button',
        className: 'move-list-modal___btn move-list-modal___btn--back',
        attributes: { type: 'button' },
        innerText: '◀ Back to Pause Menu'
    });
    const resumeBtn = createElement({
        tagName: 'button',
        className: 'move-list-modal___btn move-list-modal___btn--resume',
        attributes: { type: 'button' },
        innerText: '▶ Resume Fight [ESC]'
    });

    footer.append(backBtn, resumeBtn);

    modal.append(
        topAccent,
        cornerTL,
        cornerTR,
        cornerBL,
        cornerBR,
        header,
        matchupBar,
        tabsContainer,
        movesList,
        footer
    );
    layer.append(modal);
    root.append(layer);

    const close = () => {
        layer.remove();
    };

    closeBtn.addEventListener('click', () => {
        close();
        onClose();
    });

    resumeBtn.addEventListener('click', () => {
        close();
        onClose();
    });

    backBtn.addEventListener('click', () => {
        close();
        onBack();
    });

    return { close };
}
