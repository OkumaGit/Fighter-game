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
    const badge = createElement({ tagName: 'span', className: 'fighters___fighter-badge' });
    const onClick = event => selectFighter(event, fighter._id);

    fighterElement.setAttribute('data-fighter-id', fighter._id);
    fighterElement.append(imageElement, badge);
    fighterElement.addEventListener('click', onClick, false);

    return fighterElement;
}

export default function createFighters(fighters) {
    const selectFighter = createFightersSelector();
    const container = createElement({ tagName: 'div', className: 'fighters___root' });
    const preview = createElement({ tagName: 'div', className: 'preview-container___root' });
    const title = createElement({ tagName: 'h2', className: 'fighters___title' });
    const fightersList = createElement({ tagName: 'div', className: 'fighters___list' });
    const fighterElements = fighters.map(fighter => createFighter(fighter, selectFighter));

    title.innerText = 'Choose first fighter';
    preview.appendChild(title);
    fightersList.append(...fighterElements);
    container.append(preview, fightersList);

    return container;
}
