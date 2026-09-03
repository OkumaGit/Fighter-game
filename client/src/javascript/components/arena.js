import createElement from '../helpers/domHelper';
import fight from './fight';
import showWinnerModal from './modal/winner';
import { getRandomBattleBackground } from '../helpers/fighterAssets';

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

function createHealthIndicator(fighter, position) {
    const { name } = fighter;
    const container = createElement({ tagName: 'div', className: 'arena___fighter-indicator' });
    const fighterName = createElement({ tagName: 'span', className: 'arena___fighter-name' });
    const indicator = createElement({ tagName: 'div', className: 'arena___health-indicator' });
    const bar = createElement({
        tagName: 'div',
        className: 'arena___health-bar',
        attributes: { id: `${position}-fighter-indicator` }
    });

    fighterName.innerText = name;
    indicator.append(bar);
    container.append(fighterName, indicator);

    return container;
}

function createHealthIndicators(leftFighter, rightFighter) {
    const healthIndicators = createElement({ tagName: 'div', className: 'arena___fight-status' });
    const versusSign = createElement({ tagName: 'div', className: 'arena___versus-sign' });
    const leftFighterIndicator = createHealthIndicator(leftFighter, 'left');
    const rightFighterIndicator = createHealthIndicator(rightFighter, 'right');

    healthIndicators.append(leftFighterIndicator, versusSign, rightFighterIndicator);
    return healthIndicators;
}

function createArena(selectedFighters) {
    const arena = createElement({ tagName: 'div', className: 'arena___root' });
    const healthIndicators = createHealthIndicators(...selectedFighters);
    const fighters = createFighters();

    const hotkeysButton = createElement({
        tagName: 'button',
        className: 'arena___hotkeys-button',
        attributes: { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'arena-hotkeys' },
        innerText: 'Controls'
    });
    const hotkeysPanel = createElement({
        tagName: 'section',
        className: 'arena___hotkeys-panel',
        attributes: { id: 'arena-hotkeys', hidden: 'true' }
    });
    hotkeysPanel.innerHTML = `
        <strong>Player 1</strong><span>A / D move</span><span>S block</span><span>J jab</span><span>K kick</span><span>Space jump</span>
        <strong>Player 2</strong><span>Left / Right move</span><span>Down block</span><span>Numpad 1 jab</span><span>Numpad 2 kick</span><span>Up jump</span>
    `;
    hotkeysButton.addEventListener('click', () => {
        const isOpen = hotkeysPanel.hasAttribute('hidden');
        hotkeysPanel.toggleAttribute('hidden', !isOpen);
        hotkeysButton.setAttribute('aria-expanded', String(isOpen));
    });

    arena.append(healthIndicators, fighters, hotkeysButton, hotkeysPanel);
    return arena;
}

export default async function renderArena(selectedFighters) {
    const root = document.getElementById('root');
    const arena = createArena(selectedFighters);
    const battleBackground = getRandomBattleBackground();

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

    const winner = await fight(selectedFighters[0], selectedFighters[1]);

    if (winner) {
        showWinnerModal(winner);
    }
}
