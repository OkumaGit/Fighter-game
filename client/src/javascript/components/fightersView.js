import createElement from '../helpers/domHelper';
import fighterService from '../services/fightersService';
import { createFighterPreview } from './fighterPreview';
import { createFightersSelector } from './fighterSelector';
import { getFighterSource } from '../helpers/fighterAssets';

export async function getFighterInfo(fighterId, container) {
    try {
        const fighter = await fighterService.getFighterDetails(fighterId);

        if (!fighter || !container) return;

        const previewContainer = container;
        const preview = createFighterPreview(fighter);

        previewContainer.innerHTML = '';
        previewContainer.appendChild(preview);
    } catch (error) {
        console.error('Error loading fighter info:', error);
    }
}

function createImage(fighter) {
    const source = getFighterSource(fighter);
    const { name } = fighter;
    const attributes = {
        src: source,
        title: name,
        alt: name
    };
    const imgElement = createElement({
        tagName: 'img',
        className: 'fighter___fighter-image',
        attributes
    });

    return imgElement;
}

function createFighter(fighter, selectFighter) {
    const fighterElement = createElement({ tagName: 'div', className: 'fighters___fighter' });
    const imageElement = createImage(fighter);
    const nameElement = createElement({ tagName: 'div', className: 'fighters___fighter-name' });
    nameElement.innerText = fighter.name;
    const badge = createElement({ tagName: 'span', className: 'fighters___fighter-badge' });

    fighterElement.setAttribute('data-fighter-id', fighter._id);
    fighterElement.append(imageElement, nameElement, badge);

    fighterElement.addEventListener('click', event => selectFighter(event, fighter._id), false);

    if (typeof selectFighter.onHover === 'function') {
        fighterElement.addEventListener('mouseenter', () => selectFighter.onHover(fighter._id));
        fighterElement.addEventListener('mouseleave', () => selectFighter.onLeave(fighter._id));
    }

    return fighterElement;
}

export default function createFighters(fighters) {
    const selectFighter = createFightersSelector();
    const container = createElement({ tagName: 'div', className: 'fighters___root' });

    // Top Header: mode switch, main title, difficulty / random opponent / badges
    const header = createElement({
        tagName: 'div',
        className: 'fighters___header',
        attributes: { id: 'fighters-header' }
    });

    // Main 3-Column Showdown Area
    const showdown = createElement({ tagName: 'div', className: 'fighters___showdown' });
    const p1PanelSlot = createElement({
        tagName: 'div',
        className: 'fighters___panel-slot fighters___panel-slot--left',
        attributes: { id: 'slot-p1' }
    });

    const centerColumn = createElement({ tagName: 'div', className: 'fighters___center-column' });
    const turnIndicator = createElement({
        tagName: 'div',
        className: 'fighters___turn-indicator',
        attributes: { id: 'turn-indicator' }
    });
    turnIndicator.innerText = '▸ PLAYER 1 — CHOOSE';

    const fightersList = createElement({ tagName: 'div', className: 'fighters___list' });
    const fighterElements = fighters.map(fighter => createFighter(fighter, selectFighter));
    fightersList.append(...fighterElements);
    centerColumn.append(turnIndicator, fightersList);

    const p2PanelSlot = createElement({
        tagName: 'div',
        className: 'fighters___panel-slot fighters___panel-slot--right',
        attributes: { id: 'slot-p2' }
    });

    showdown.append(p1PanelSlot, centerColumn, p2PanelSlot);

    // Bottom Action Bar: VS divider + FIGHT button
    const bottomBar = createElement({ tagName: 'div', className: 'fighters___bottom-bar' });
    const vsDivider = createElement({ tagName: 'div', className: 'fighters___vs-divider' });
    const vsLineLeft = createElement({ tagName: 'span', className: 'fighters___vs-line' });
    const vsText = createElement({ tagName: 'span', className: 'fighters___vs-text' });
    vsText.innerText = 'VS';
    const vsLineRight = createElement({ tagName: 'span', className: 'fighters___vs-line' });
    vsDivider.append(vsLineLeft, vsText, vsLineRight);

    const actionSlot = createElement({
        tagName: 'div',
        className: 'fighters___action-slot',
        attributes: { id: 'action-slot' }
    });
    bottomBar.append(vsDivider, actionSlot);

    container.append(header, showdown, bottomBar);

    return container;
}
