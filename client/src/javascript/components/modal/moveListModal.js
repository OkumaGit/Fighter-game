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

    let p2Label = 'Игрок 2 (P2)';
    if (isOnline) p2Label = 'Онлайн Соперник';
    else if (isPvE || isTower) p2Label = 'Бот / AI';

    const layer = createElement({
        tagName: 'div',
        className: 'modal-layer move-list-modal___layer'
    });

    const modal = createElement({
        tagName: 'div',
        className: 'modal-root move-list-modal___container'
    });

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
        innerText: 'СПРАВОЧНИК ПРИЁМОВ'
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
        const fName = createElement({
            tagName: 'h3',
            className: 'move-list-modal___fighter-name',
            innerText: `${lore.ruName} (${lore.name})`
        });
        const elementPill = createElement({
            tagName: 'span',
            className: 'move-list-modal___element-pill',
            innerText: `${lore.elementIcon} ${lore.element}`
        });
        elementPill.style.borderColor = lore.color;
        elementPill.style.color = lore.color;

        info.append(pLabel, fName, elementPill);
        badge.append(portraitWrap, info);
        return badge;
    };

    const fighter1Badge = createFighterBadge(f1Lore, 'Игрок 1 (P1)', 'left');
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
        innerText: 'Все комбо и приёмы'
    });
    const tabP1 = createElement({
        tagName: 'button',
        className: 'move-list-modal___tab',
        attributes: { type: 'button' },
        innerText: `Игрок 1 [${f1Lore.ruName}]`
    });
    const tabP2 = createElement({
        tagName: 'button',
        className: 'move-list-modal___tab',
        attributes: { type: 'button' },
        innerText: `${p2Label} [${f2Lore.ruName}]`
    });
    tabsContainer.append(tabAll, tabP1, tabP2);

    // Moves List Content Container
    const movesList = createElement({ tagName: 'div', className: 'move-list-modal___moves-list' });

    const movesData = [
        {
            category: 'super',
            name: 'СУПЕР-УДАР (SUPER MOVE)',
            badge: '100% SUPER METER · КРИТИЧЕСКИЙ',
            badgeClass: 'super',
            p1Keys: '<kbd>Q</kbd> + <kbd>W</kbd> + <kbd>E</kbd>',
            p2Keys: '<kbd>Num 7</kbd> + <kbd>Num 8</kbd> + <kbd>Num 9</kbd>',
            desc: 'Неблокируемый разрушительный удар стихии! Требует 100% шкалы Super и дистанцию вплотную (<= 140px). Наносит 24 ед. урона и активирует кинематографический вихрь.',
            p1Detail: `Стихия ${f1Lore.ruName}: <strong>${f1Lore.superName}</strong> — ${f1Lore.superDesc}`,
            p2Detail: `Стихия ${f2Lore.ruName}: <strong>${f2Lore.superName}</strong> — ${f2Lore.superDesc}`
        },
        {
            category: 'special',
            name: 'ОСОБАЯ МАГИЯ (SPECIAL MOVE)',
            badge: 'ЭЛЕМЕНТАРНАЯ МАГИЯ · КУЛДАУН',
            badgeClass: 'special',
            p1Keys: '<kbd>U</kbd>',
            p2Keys: '<kbd>Num 3</kbd>',
            desc: 'Фирменная магия бойца с перезарядкой (~4 сек).',
            p1Detail: `${f1Lore.elementIcon} ${f1Lore.ruName}: <strong>${f1Lore.specialName}</strong> — ${f1Lore.specialDesc}`,
            p2Detail: `${f2Lore.elementIcon} ${f2Lore.ruName}: <strong>${f2Lore.specialName}</strong> — ${f2Lore.specialDesc}`
        },
        {
            category: 'throw',
            name: 'БРОСОК ЧЕРЕЗ СЕБЯ (THROW)',
            badge: 'НЕБЛОКИРУЕМЫЙ · ВПЛОТНУЮ',
            badgeClass: 'unblockable',
            p1Keys: '<kbd>D</kbd> + <kbd>J</kbd> (Вперёд + Удар)',
            p2Keys: '<kbd>←</kbd> + <kbd>Num 1</kbd> (Вперёд + Удар)',
            desc: 'Мощный бросок соперника о землю на дистанции вплотную (< 88px). Игнорирует и пробивает блок соперника!'
        },
        {
            category: 'uppercut',
            name: 'АППЕРКОТ (UPPERCUT)',
            badge: 'ЛАУНЧЕР · ПОДБРОС В ВОЗДУХ',
            badgeClass: 'launcher',
            p1Keys: '<kbd>S</kbd> + <kbd>J</kbd> (Блок + Удар)',
            p2Keys: '<kbd>↓</kbd> + <kbd>Num 1</kbd> (Блок + Удар)',
            desc: 'Сокрушительный апперкот снизу вверх. Подбрасывает противника высоко в воздух, открывая окно для джаггл-комбо (juggle)!'
        },
        {
            category: 'sweep',
            name: 'НИЗКАЯ ПОДСЕЧКА (LOW SWEEP)',
            badge: 'НИЗКИЙ УДАР · СБИВАНИЕ С НОГ',
            badgeClass: 'sweep',
            p1Keys: '<kbd>S</kbd> + <kbd>K</kbd> (Блок + Пинок)',
            p2Keys: '<kbd>↓</kbd> + <kbd>Num 2</kbd> (Блок + Пинок)',
            desc: 'Скользящий удар ногой по низу. Сбивает соперника с ног и опрокидывает в нокдаун.'
        },
        {
            category: 'combo',
            name: 'СЕРИЯ УДАРОВ (2-HIT COMBO)',
            badge: 'СЕРИЯ ДЖЕБОВ',
            badgeClass: 'combo',
            p1Keys: '<kbd>J</kbd> затем сразу <kbd>J</kbd>',
            p2Keys: '<kbd>Num 1</kbd> затем <kbd>Num 1</kbd>',
            desc: 'Быстрая комбинация из двух последовательных ударов руками. Увеличивает множитель шкалы Super!'
        },
        {
            category: 'jumpkick',
            name: 'УДАР В ПРЫЖКЕ (JUMP KICK)',
            badge: 'ВОЗДУШНАЯ АТАКА',
            badgeClass: 'aerial',
            p1Keys: '<kbd>Space</kbd> + <kbd>K</kbd>',
            p2Keys: '<kbd>↑</kbd> + <kbd>Num 2</kbd>',
            desc: 'Удар ногой с воздуха в прыжке. Имеет высокий приоритет при сближении.'
        },
        {
            category: 'block',
            name: 'БЛОК И ЗАЩИТА (BLOCK HOLD)',
            badge: 'ОБОРОНА · ФИКСАЦИЯ СТОЙКИ',
            badgeClass: 'defense',
            p1Keys: '<kbd>S</kbd> (Зажать)',
            p2Keys: '<kbd>↓</kbd> (Зажать)',
            desc: 'Удержание кнопки фиксирует бойца в глухой защитной стойке. Поглощает урон и заряжает шкалу Super при блокировании.'
        },
        {
            category: 'dash',
            name: 'БЫСТРЫЙ РЫВОК (DASH)',
            badge: 'МОБИЛЬНОСТЬ · ДВОЙНОЙ ТАП',
            badgeClass: 'mobility',
            p1Keys: 'Двойной тап <kbd>A</kbd>, <kbd>A</kbd> или <kbd>D</kbd>, <kbd>D</kbd>',
            p2Keys: 'Двойной тап <kbd>←</kbd>, <kbd>←</kbd> или <kbd>→</kbd>, <kbd>→</kbd>',
            desc: 'Стремительный рывок вперёд или назад с облаком пыли для быстрого сближения или уклонения.'
        },
        {
            category: 'movement',
            name: 'ДВИЖЕНИЕ И ПРЫЖОК',
            badge: 'БАЗОВОЕ',
            badgeClass: 'movement',
            p1Keys: '<kbd>A</kbd> влево, <kbd>D</kbd> вправо, <kbd>Space</kbd> прыжок',
            p2Keys: '<kbd>←</kbd> влево, <kbd>→</kbd> вправо, <kbd>↑</kbd> прыжок',
            desc: 'Перемещение по арене и вертикальный прыжок.'
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
                p1Col.innerHTML = `<span class="move-card___key-label">Игрок 1:</span> <span class="move-card___keys">${item.p1Keys}</span>`;
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
        tabP2.classList.remove('move-list-modal___tab--active');
        renderMoves();
    });

    renderMoves();

    // Footer actions
    const footer = createElement({ tagName: 'div', className: 'move-list-modal___footer' });
    const backBtn = createElement({
        tagName: 'button',
        className: 'move-list-modal___btn move-list-modal___btn--back',
        attributes: { type: 'button' },
        innerText: '◀ Меню паузы'
    });
    const resumeBtn = createElement({
        tagName: 'button',
        className: 'move-list-modal___btn move-list-modal___btn--resume',
        attributes: { type: 'button' },
        innerText: '▶ В бой [ESC]'
    });

    footer.append(backBtn, resumeBtn);

    modal.append(header, matchupBar, tabsContainer, movesList, footer);
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
