import createElement from '../helpers/domHelper';
import { getBattleSpriteConfig, getFighterSource } from '../helpers/fighterAssets';

export function createFighterImage(fighter = {}) {
    const source = getFighterSource(fighter);

    if (!fighter || !source) {
        const placeholder = createElement({
            tagName: 'div',
            className: 'fighter-preview___placeholder',
            innerText: 'No fighter selected'
        });
        return placeholder;
    }

    const { name = 'Fighter' } = fighter;
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

export function createBattleFighterImage(fighter = {}) {
    const battleSprite = getBattleSpriteConfig(fighter);

    if (!battleSprite) {
        return createFighterImage(fighter);
    }

    const { name = 'Fighter' } = fighter;
    const spriteElement = createElement({
        tagName: 'div',
        className: 'arena___fighter-sprite',
        attributes: {
            role: 'img',
            'aria-label': name,
            title: name
        }
    });

    spriteElement.dataset.pose = 'idle';
    spriteElement.style.backgroundImage = `url(${battleSprite.source})`;
    spriteElement.style.setProperty('--sprite-sheet-width', `${battleSprite.sheetWidth}px`);
    spriteElement.style.setProperty('--sprite-sheet-height', `${battleSprite.sheetHeight}px`);
    spriteElement.style.setProperty('--sprite-cell-width', `${battleSprite.cellWidth}px`);
    spriteElement.style.setProperty('--sprite-cell-height', `${battleSprite.cellHeight}px`);

    return spriteElement;
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
