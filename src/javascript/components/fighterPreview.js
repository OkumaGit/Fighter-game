import createElement from '../helpers/domHelper';

export function createFighterImage(fighter = {}) {
    if (!fighter || !fighter.source) {
        const placeholder = createElement({
            tagName: 'div',
            className: 'fighter-preview___placeholder',
            innerText: 'No fighter selected'
        });
        return placeholder;
    }

    const { source = '', name = 'Fighter' } = fighter;
    const attributes = {
        src: source,
        title: name,
        alt: name
    };
    const imgElement = createElement({
        tagName: 'img',
        className: 'fighter-preview___img',
        attributes
    });

    return imgElement;
}

export function createFighterPreview(fighter = {}, position = 'left') {
    const safeFighter = fighter ?? {};
    const positionClassName = position === 'right' ? 'fighter-preview___right' : 'fighter-preview___left';
    const fighterElement = createElement({
        tagName: 'div',
        className: `fighter-preview___root ${positionClassName}`
    });
    const imageElement = createFighterImage(safeFighter);
    const nameElement = createElement({ tagName: 'h3' });
    const healthElement = createElement({ tagName: 'p' });
    const attackElement = createElement({ tagName: 'p' });
    const defenseElement = createElement({ tagName: 'p' });

    nameElement.innerText = safeFighter.name ?? 'Fighter';
    healthElement.innerText = `Health: ${safeFighter.health ?? '—'}`;
    attackElement.innerText = `Attack: ${safeFighter.attack ?? '—'}`;
    defenseElement.innerText = `Defense: ${safeFighter.defense ?? '—'}`;

    fighterElement.append(imageElement, nameElement, healthElement, attackElement, defenseElement);

    return fighterElement;
}
