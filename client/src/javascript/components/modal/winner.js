import showModal from './modal';
import { createFighterImage } from '../fighterPreview';
import App from '../../app';

export default function showWinnerModal(fighter) {
    const bodyElement = document.createElement('div');
    const titleElement = document.createElement('h3');
    const imageElement = createFighterImage(fighter);
    const backButton = document.createElement('button');

    titleElement.innerText = fighter?.name ?? 'Winner';
    backButton.className = 'preview-container___fight-btn';
    backButton.type = 'button';
    backButton.textContent = 'New fight';

    backButton.addEventListener('click', () => {
        document.getElementsByClassName('modal-layer')[0]?.remove();
        App.startApplication();
    });

    bodyElement.className = 'modal-body';
    bodyElement.append(titleElement, imageElement, backButton);

    showModal({
        title: 'Winner',
        bodyElement,
        onClose: () => {}
    });
}
