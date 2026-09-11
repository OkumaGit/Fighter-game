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

function createStatRow(label, filledCount, type, isRight) {
    const row = createElement({ tagName: 'div', className: 'fighter-panel___stat-row' });
    const labelElem = createElement({ tagName: 'span', className: 'fighter-panel___stat-label' });
    labelElem.innerText = label;

    const barElem = createElement({ tagName: 'div', className: 'fighter-panel___stat-bar' });
    for (let i = 0; i < 10; i += 1) {
        const seg = createElement({
            tagName: 'span',
            className: `fighter-panel___segment ${
                i < filledCount
                    ? `fighter-panel___segment--filled fighter-panel___segment--${type}`
                    : 'fighter-panel___segment--empty'
            }`
        });
        barElem.appendChild(seg);
    }

    if (isRight) {
        row.append(barElem, labelElem);
    } else {
        row.append(labelElem, barElem);
    }

    return row;
}

export function createFighterPanel(fighter = null, position = 'left', roleTag = null) {
    const isRight = position === 'right';
    const panel = createElement({
        tagName: 'div',
        className: `fighter-panel ${isRight ? 'fighter-panel--right' : 'fighter-panel--left'}`
    });

    // Top accent corner bar (Figma #216:1597 and #216:1682)
    const topAccent = createElement({
        tagName: 'div',
        className: `fighter-panel___top-accent ${
            isRight ? 'fighter-panel___top-accent--right' : 'fighter-panel___top-accent--left'
        }`
    });
    panel.appendChild(topAccent);

    // Role Tag (PLAYER 1 / PLAYER 2 / BOT / CHAMPION / OPPONENT)
    const tag = createElement({ tagName: 'div', className: 'fighter-panel___role-tag' });
    tag.innerText = roleTag || (isRight ? 'PLAYER 2' : 'PLAYER 1');
    panel.appendChild(tag);

    // Image Box
    const imageBox = createElement({ tagName: 'div', className: 'fighter-panel___image-box' });
    if (fighter && (fighter.source || fighter.name)) {
        const img = createFighterImage(fighter);
        imageBox.appendChild(img);
    } else {
        const placeholder = createElement({
            tagName: 'div',
            className: 'fighter-panel___placeholder',
            innerText: 'SELECT FIGHTER'
        });
        imageBox.appendChild(placeholder);
    }
    panel.appendChild(imageBox);

    // Fighter Name
    const nameElem = createElement({ tagName: 'div', className: 'fighter-panel___name' });
    nameElem.innerText = fighter?.name || '—';
    panel.appendChild(nameElem);

    // Segmented Stats (HP, ATK, DEF)
    const statsContainer = createElement({ tagName: 'div', className: 'fighter-panel___stats' });

    // Segment counts out of 10
    const hpFilled = fighter?.health ? Math.min(10, Math.max(1, Math.round((fighter.health / 60) * 6))) : 0;
    const atkFilled = fighter?.attack ? Math.min(10, Math.max(1, Math.round(fighter.attack * 1.5))) : 0;
    const defFilled = fighter?.defense ? Math.min(10, Math.max(1, Math.round(fighter.defense * 2))) : 0;

    statsContainer.appendChild(createStatRow('HP', hpFilled, 'hp', isRight));
    statsContainer.appendChild(createStatRow('ATK', atkFilled, 'atk', isRight));
    statsContainer.appendChild(createStatRow('DEF', defFilled, 'def', isRight));

    panel.appendChild(statsContainer);
    return panel;
}

export function createFighterPreview(fighter = {}, position = 'left', roleTag = null) {
    return createFighterPanel(fighter, position, roleTag);
}
