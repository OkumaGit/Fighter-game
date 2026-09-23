import createElement from '../../helpers/domHelper';
import { getFighterLore } from '../../helpers/fighterLore';

export default function showPauseMenu({
    fighter1,
    fighter2,
    round = 1,
    isPvE = false,
    isTower = false,
    isOnline = false,
    onResume = () => {},
    onMoveList = () => {},
    onRestart = () => {},
    onQuit = () => {}
}) {
    const root = document.getElementById('root') || document.body;

    const f1Lore = getFighterLore(fighter1);
    const f2Lore = getFighterLore(fighter2);

    let modeLabel = 'VS BATTLE';
    if (isTower) modeLabel = 'TOWER CAMPAIGN';
    else if (isPvE) modeLabel = 'VS COMPUTER';
    else if (isOnline) modeLabel = 'ONLINE CLASH';

    const layer = createElement({
        tagName: 'div',
        className: 'modal-layer pause-menu___layer'
    });

    const container = createElement({
        tagName: 'div',
        className: 'modal-root pause-menu___container'
    });

    // Top neon accent
    const topAccent = createElement({ tagName: 'div', className: 'pause-menu___top-accent' });

    // Header
    const header = createElement({ tagName: 'div', className: 'pause-menu___header' });
    const badge = createElement({
        tagName: 'div',
        className: 'pause-menu___badge',
        innerText: 'BATTLE PAUSED · ИГРА НА ПАУЗЕ'
    });
    const title = createElement({
        tagName: 'h2',
        className: 'pause-menu___title',
        innerText: 'PAUSE'
    });

    const matchup = createElement({ tagName: 'div', className: 'pause-menu___matchup' });
    const f1Name = createElement({
        tagName: 'span',
        className: 'pause-menu___fighter-name pause-menu___fighter-name--left',
        innerText: f1Lore.ruName
    });
    f1Name.style.color = f1Lore.color;

    const vsPill = createElement({
        tagName: 'span',
        className: 'pause-menu___vs-pill',
        innerText: 'VS'
    });

    const f2Name = createElement({
        tagName: 'span',
        className: 'pause-menu___fighter-name pause-menu___fighter-name--right',
        innerText: f2Lore.ruName
    });
    f2Name.style.color = f2Lore.color;

    matchup.append(f1Name, vsPill, f2Name);

    const roundInfo = createElement({
        tagName: 'div',
        className: 'pause-menu___round-info',
        innerText: `${modeLabel} · ROUND ${round}`
    });

    header.append(badge, title, matchup, roundInfo);

    // Buttons Container
    const buttonsList = createElement({ tagName: 'div', className: 'pause-menu___buttons' });

    const createMenuButton = (text, shortcutText, iconText, onClick, className = '') => {
        const btn = createElement({
            tagName: 'button',
            className: `pause-menu___btn ${className}`,
            attributes: { type: 'button' }
        });

        const iconSpan = createElement({
            tagName: 'span',
            className: 'pause-menu___btn-icon',
            innerText: iconText
        });
        const textSpan = createElement({
            tagName: 'span',
            className: 'pause-menu___btn-text',
            innerText: text
        });
        const shortcutSpan = createElement({
            tagName: 'span',
            className: 'pause-menu___btn-shortcut',
            innerText: shortcutText
        });

        btn.append(iconSpan, textSpan, shortcutSpan);
        btn.addEventListener('click', onClick);
        return btn;
    };

    let selectedIndex = 0;
    const buttons = [];

    const resumeBtn = createMenuButton('Продолжить бой', 'ESC', '▶', () => onResume(), 'pause-menu___btn--resume');
    const moveListBtn = createMenuButton('Список приёмов', 'M', '📖', () => onMoveList());
    const restartText = isTower ? 'Перезапустить раунд' : 'Начать бой заново';
    const restartBtn = createMenuButton(restartText, 'R', '🔄', () => onRestart());
    const quitBtn = createMenuButton('Выход в выбор бойцов', 'Q', '🚪', () => onQuit(), 'pause-menu___btn--quit');

    buttons.push(resumeBtn, moveListBtn, restartBtn, quitBtn);
    buttons.forEach(btn => buttonsList.appendChild(btn));

    const updateSelectedButton = () => {
        buttons.forEach((btn, idx) => {
            btn.classList.toggle('pause-menu___btn--selected', idx === selectedIndex);
        });
    };
    updateSelectedButton();

    container.append(topAccent, header, buttonsList);
    layer.append(container);
    root.append(layer);

    // Keyboard navigation within pause menu
    const handleMenuKeyDown = event => {
        if (layer.style.display === 'none') return;

        if (event.code === 'ArrowDown' || event.code === 'KeyS') {
            event.preventDefault();
            selectedIndex = (selectedIndex + 1) % buttons.length;
            updateSelectedButton();
            buttons[selectedIndex].focus();
        } else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
            event.preventDefault();
            selectedIndex = (selectedIndex - 1 + buttons.length) % buttons.length;
            updateSelectedButton();
            buttons[selectedIndex].focus();
        } else if (event.code === 'Enter' || event.code === 'Space') {
            event.preventDefault();
            buttons[selectedIndex].click();
        } else if (event.code === 'KeyM') {
            event.preventDefault();
            onMoveList();
        } else if (event.code === 'KeyR') {
            event.preventDefault();
            onRestart();
        } else if (event.code === 'KeyQ') {
            event.preventDefault();
            onQuit();
        }
    };

    window.addEventListener('keydown', handleMenuKeyDown);

    const close = () => {
        window.removeEventListener('keydown', handleMenuKeyDown);
        layer.remove();
    };

    const hide = () => {
        layer.style.display = 'none';
    };

    const show = () => {
        layer.style.display = 'flex';
        updateSelectedButton();
    };

    return { close, hide, show };
}
