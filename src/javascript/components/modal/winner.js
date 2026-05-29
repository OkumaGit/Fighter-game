import showModal from './modal';
import { createFighterImage } from '../fighterPreview';

export default function showWinnerModal(fighter) {
    const bodyElement = document.createElement('div');
    const titleElement = document.createElement('h3');
    const imageElement = createFighterImage(fighter);
    const backButton = document.createElement('button');

    titleElement.innerText = fighter?.name ?? 'Winner';
    backButton.className = 'preview-container___fight-btn';
    backButton.innerText = 'New fight';

    backButton.addEventListener('click', () => {
        window.location.reload();
    });

    bodyElement.className = 'modal-body';
    bodyElement.append(titleElement, imageElement, backButton);

    showModal({
        title: 'Winner',
        bodyElement,
        onClose: () => {}
    });
}
