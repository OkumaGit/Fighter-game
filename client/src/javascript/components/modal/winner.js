import createElement from '../../helpers/domHelper';
import { createFighterImage } from '../fighterPreview';

export default function showWinnerModal(fighter, optionsOrRestart, maybeOnMainMenu) {
    const root = document.getElementById('root');

    const handlers =
        typeof optionsOrRestart === 'function'
            ? { onRestart: optionsOrRestart, onMainMenu: maybeOnMainMenu }
            : optionsOrRestart || {};

    const { onRestart, onMainMenu } = handlers;

    const layer = createElement({ tagName: 'div', className: 'modal-layer' });
    const modalContainer = createElement({ tagName: 'div', className: 'modal-root winner-modal' });

    // Top gold accent line
    const topAccent = createElement({ tagName: 'div', className: 'winner-modal___top-accent' });

    // Header
    const headerElement = createElement({ tagName: 'div', className: 'modal-header winner-modal___header' });
    const headerLeft = createElement({ tagName: 'div', className: 'winner-modal___header-left' });
    const subtitle = createElement({
        tagName: 'span',
        className: 'winner-modal___subtitle'
    });
    subtitle.innerText = 'Battle Result';

    const title = createElement({
        tagName: 'h2',
        className: 'winner-modal___title'
    });
    title.innerText = 'Winner';
    headerLeft.append(subtitle, title);

    const closeButton = createElement({
        tagName: 'button',
        className: 'close-btn winner-modal___close-btn',
        attributes: { type: 'button', 'aria-label': 'Close' }
    });
    closeButton.innerText = '×';

    const returnToMenu = () => {
        layer.remove();
        if (typeof onMainMenu === 'function') {
            onMainMenu();
        } else {
            window.dispatchEvent(new CustomEvent('new-fight'));
        }
    };

    closeButton.addEventListener('click', returnToMenu);
    headerElement.append(headerLeft, closeButton);

    // Body
    const bodyElement = createElement({ tagName: 'div', className: 'modal-body winner-modal___body' });

    // Fighter Name
    const nameElement = createElement({
        tagName: 'h3',
        className: 'winner-modal___fighter-name'
    });
    nameElement.innerText = fighter?.name ?? 'Fighter';

    // Fighter image frame with corner brackets
    const imageContainer = createElement({ tagName: 'div', className: 'winner-modal___image-container' });
    const imageElement = createFighterImage(fighter);
    const cornerTL = createElement({ tagName: 'span', className: 'winner-modal___corner winner-modal___corner--tl' });
    const cornerTR = createElement({ tagName: 'span', className: 'winner-modal___corner winner-modal___corner--tr' });
    const cornerBL = createElement({ tagName: 'span', className: 'winner-modal___corner winner-modal___corner--bl' });
    const cornerBR = createElement({ tagName: 'span', className: 'winner-modal___corner winner-modal___corner--br' });
    imageContainer.append(imageElement, cornerTL, cornerTR, cornerBL, cornerBR);

    // Action buttons row (Rematch + Choose Fighters)
    const btnRow = createElement({ tagName: 'div', className: 'winner-modal___btn-row' });

    const rematchBtn = createElement({
        tagName: 'button',
        className: 'winner-modal___action-btn winner-modal___action-btn--rematch',
        attributes: { type: 'button' }
    });
    rematchBtn.innerText = '🔄 Rematch';
    rematchBtn.addEventListener('click', () => {
        layer.remove();
        if (typeof onRestart === 'function') {
            onRestart();
        } else {
            window.dispatchEvent(new CustomEvent('new-fight'));
        }
    });

    const menuBtn = createElement({
        tagName: 'button',
        className: 'winner-modal___action-btn winner-modal___action-btn--menu',
        attributes: { type: 'button' }
    });
    menuBtn.innerText = '👥 Choose Fighters';
    menuBtn.addEventListener('click', returnToMenu);

    btnRow.append(rematchBtn, menuBtn);
    bodyElement.append(nameElement, imageContainer, btnRow);

    // Bottom accent line
    const bottomAccent = createElement({ tagName: 'div', className: 'winner-modal___bottom-accent' });

    modalContainer.append(topAccent, headerElement, bodyElement, bottomAccent);
    layer.append(modalContainer);
    root.append(layer);
}
