import createElement from '../../helpers/domHelper';
import { createFighterImage } from '../fighterPreview';
import App from '../../app';

export default function showWinnerModal(fighter) {
    const root = document.getElementById('root');

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

    const closeModal = () => {
        layer.remove();
    };
    closeButton.addEventListener('click', closeModal);
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

    // Action button (New Fight)
    const newFightButton = createElement({
        tagName: 'button',
        className: 'winner-modal___action-btn',
        attributes: { type: 'button' }
    });
    newFightButton.innerText = 'New Fight';
    newFightButton.addEventListener('click', () => {
        closeModal();
        App.startApplication();
    });

    bodyElement.append(nameElement, imageContainer, newFightButton);

    // Bottom accent line
    const bottomAccent = createElement({ tagName: 'div', className: 'winner-modal___bottom-accent' });

    modalContainer.append(topAccent, headerElement, bodyElement, bottomAccent);
    layer.append(modalContainer);
    root.append(layer);
}
