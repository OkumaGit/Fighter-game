import createElement from '../helpers/domHelper';
import fighterService from '../services/fightersService';
import renderArena from './arena';
import { createFighterPreview } from './fighterPreview';

const fighterDetailsMap = new Map();

export async function getFighterInfo(fighterId) {
    if (!fighterId) return null;

    if (fighterDetailsMap.has(fighterId)) {
        return fighterDetailsMap.get(fighterId);
    }

    const fighter = await fighterService.getFighterDetails(fighterId);

    if (fighter) {
        fighterDetailsMap.set(fighterId, fighter);
    }

    return fighter ?? null;
}

function startFight(selectedFighters) {
    if (selectedFighters.every(Boolean)) {
        renderArena(selectedFighters);
    }
}

function updateFighterCards(selectedFighters, currentFighter) {
    document.querySelectorAll('.fighters___fighter').forEach(card => {
        const fighterId = card.getAttribute('data-fighter-id');
        const isSelected = selectedFighters.some(fighter => fighter && fighter._id === fighterId);
        const isCurrent = currentFighter && currentFighter._id === fighterId;
        let slot = '';

        if (selectedFighters[0] && selectedFighters[0]._id === fighterId) {
            slot = 'P1';
        } else if (selectedFighters[1] && selectedFighters[1]._id === fighterId) {
            slot = 'P2';
        } else if (currentFighter && currentFighter._id === fighterId) {
            slot = selectedFighters[0] ? 'P2' : 'P1';
        }

        card.classList.toggle('fighters___fighter--selected', isCurrent || isSelected);
        card.classList.toggle('fighters___fighter--confirmed', isSelected);

        let badge = card.querySelector('.fighters___fighter-badge');
        if (!badge) {
            badge = createElement({ tagName: 'span', className: 'fighters___fighter-badge' });
            card.appendChild(badge);
        }

        badge.innerText = slot;
        badge.classList.toggle('fighters___fighter-badge--visible', Boolean(slot));
    });
}

function renderSelectedFighters(selectedFighters, currentFighter = null) {
    const fightersPreview = document.querySelector('.preview-container___root');
    if (!fightersPreview) return;

    fightersPreview.innerHTML = '';

    const title = createElement({ tagName: 'h2', className: 'fighters___title' });

    if (selectedFighters.every(Boolean)) {
        title.innerText = 'Ready to fight';
    } else if (selectedFighters[0] && !selectedFighters[1]) {
        title.innerText = 'Choose second fighter';
    } else {
        title.innerText = 'Choose first fighter';
    }
    fightersPreview.append(title);

    const showBothSelected = selectedFighters[0] && selectedFighters[1];
    if (showBothSelected) {
        const topRow = createElement({ tagName: 'div', className: 'preview-container___selected-row' });
        const player1 = createFighterPreview(selectedFighters[0], 'left');
        const player2 = createFighterPreview(selectedFighters[1], 'right');

        topRow.append(player1, player2);
        fightersPreview.append(topRow);
    }

    if (currentFighter) {
        const focusCard = createElement({ tagName: 'div', className: 'preview-container___focus-card' });
        const focusTitle = createElement({ tagName: 'h3', className: 'preview-container___focus-title' });
        const focusText = createElement({ tagName: 'p', className: 'preview-container___focus-text' });

        focusTitle.innerText = `Selected: ${currentFighter.name}`;
        focusText.innerText = `Health ${currentFighter.health ?? '—'} · Attack ${
            currentFighter.attack ?? '—'
        } · Defense ${currentFighter.defense ?? '—'}`;

        focusCard.append(focusTitle, focusText);
        fightersPreview.append(focusCard);
    }

    const canStartFight = selectedFighters.every(Boolean);
    if (canStartFight) {
        const fightButton = createElement({
            tagName: 'button',
            className: 'preview-container___fight-btn'
        });

        fightButton.innerText = 'Fight';
        fightButton.addEventListener('click', () => startFight(selectedFighters), false);
        fightersPreview.append(fightButton);
    }
    updateFighterCards(selectedFighters, currentFighter);
}

export function createFightersSelector() {
    let selectedFighters = [null, null];
    let currentFighter = null;

    const renderSelection = () => {
        renderSelectedFighters(selectedFighters, currentFighter);
    };

    return async (event, fighterId) => {
        const fighter = await getFighterInfo(fighterId);
        if (!fighter) return;

        const isSameFighter = currentFighter && currentFighter._id === fighter._id;
        const nextSlot = selectedFighters[0] ? 1 : 0;

        if (isSameFighter) {
            if (selectedFighters[nextSlot] && selectedFighters[nextSlot]._id === fighter._id) return;
            selectedFighters = [...selectedFighters];
            selectedFighters[nextSlot] = fighter;
            currentFighter = null;
            renderSelection();
            return;
        }

        currentFighter = fighter;
        renderSelection();
    };
}
