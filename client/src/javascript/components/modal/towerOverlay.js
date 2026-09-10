import createElement from '../../helpers/domHelper';
import { createFighterImage } from '../fighterPreview';
import { TOWER_STAGE_PROFILES } from '../../game/arcadeManager';

function createTowerLadderWidget(currentStageIndex) {
    const ladderContainer = createElement({
        tagName: 'div',
        className: 'tower-ladder'
    });

    const title = createElement({
        tagName: 'div',
        className: 'tower-ladder___title'
    });
    title.innerText = 'TOWER PROGRESSION';
    ladderContainer.appendChild(title);

    const rungs = createElement({
        tagName: 'div',
        className: 'tower-ladder___rungs'
    });

    // Render from Stage 6 (top / boss) down to Stage 1 (bottom)
    for (let i = TOWER_STAGE_PROFILES.length - 1; i >= 0; i -= 1) {
        const profile = TOWER_STAGE_PROFILES[i];
        const rung = createElement({
            tagName: 'div',
            className: 'tower-ladder___rung'
        });

        if (i < currentStageIndex) {
            rung.classList.add('tower-ladder___rung--cleared');
        } else if (i === currentStageIndex) {
            rung.classList.add('tower-ladder___rung--active');
        } else {
            rung.classList.add('tower-ladder___rung--locked');
        }

        const stageNumber = createElement({
            tagName: 'span',
            className: 'tower-ladder___stage-num'
        });
        stageNumber.innerText = `STAGE ${profile.stage}`;

        const diffBadge = createElement({
            tagName: 'span',
            className: 'tower-ladder___stage-diff'
        });
        diffBadge.innerText = profile.isBoss ? '👑 BOSS' : profile.difficultyName;

        const statusIcon = createElement({
            tagName: 'span',
            className: 'tower-ladder___status-icon'
        });
        if (i < currentStageIndex) {
            statusIcon.innerText = '✓';
        } else if (i === currentStageIndex) {
            statusIcon.innerText = '⚔️';
        } else {
            statusIcon.innerText = '🔒';
        }

        rung.append(stageNumber, diffBadge, statusIcon);
        rungs.appendChild(rung);
    }

    ladderContainer.appendChild(rungs);
    return ladderContainer;
}

export function showStageClearedModal({ stageIndex, currentOpponent, nextOpponent, onNextStage }) {
    const root = document.getElementById('root');
    const layer = createElement({ tagName: 'div', className: 'modal-layer' });
    const modal = createElement({ tagName: 'div', className: 'modal-root tower-modal tower-modal--cleared' });

    const topAccent = createElement({ tagName: 'div', className: 'winner-modal___top-accent' });

    const header = createElement({ tagName: 'div', className: 'modal-header tower-modal___header' });
    const headerTitle = createElement({ tagName: 'h2', className: 'tower-modal___title' });
    headerTitle.innerText = 'STAGE CLEARED!';

    const headerSubtitle = createElement({ tagName: 'p', className: 'tower-modal___subtitle' });
    headerSubtitle.innerText = `${currentOpponent.name} has been defeated. Prepare for the next floor!`;
    header.append(headerTitle, headerSubtitle);

    const body = createElement({ tagName: 'div', className: 'modal-body tower-modal___body' });

    // Ladder diagram
    const ladder = createTowerLadderWidget(stageIndex + 1);

    // Next opponent preview
    const nextPreview = createElement({ tagName: 'div', className: 'tower-modal___next-preview' });
    const nextLabel = createElement({ tagName: 'div', className: 'tower-modal___next-label' });
    nextLabel.innerText = `NEXT OPPONENT: STAGE ${stageIndex + 2}`;

    const nextName = createElement({ tagName: 'h3', className: 'tower-modal___next-name' });
    nextName.innerText = nextOpponent.name;

    const nextImgContainer = createElement({ tagName: 'div', className: 'tower-modal___next-img' });
    const nextImg = createFighterImage(nextOpponent);
    nextImgContainer.appendChild(nextImg);

    nextPreview.append(nextLabel, nextName, nextImgContainer);

    body.append(ladder, nextPreview);

    const continueBtn = createElement({
        tagName: 'button',
        className: 'winner-modal___action-btn tower-modal___btn',
        attributes: { type: 'button' }
    });
    continueBtn.innerText = `Fight Stage ${stageIndex + 2} ⚔️`;

    const handleContinue = () => {
        layer.remove();
        if (typeof onNextStage === 'function') {
            onNextStage();
        }
    };
    continueBtn.addEventListener('click', handleContinue);
    body.appendChild(continueBtn);

    const bottomAccent = createElement({ tagName: 'div', className: 'winner-modal___bottom-accent' });

    modal.append(topAccent, header, body, bottomAccent);
    layer.appendChild(modal);
    root.appendChild(layer);
}

export function showTowerDefeatModal({ stageIndex, opponent, onRetry, onMainMenu }) {
    const root = document.getElementById('root');
    const layer = createElement({ tagName: 'div', className: 'modal-layer' });
    const modal = createElement({ tagName: 'div', className: 'modal-root tower-modal tower-modal--defeat' });

    const topAccent = createElement({
        tagName: 'div',
        className: 'winner-modal___top-accent tower-modal___accent--red'
    });

    const header = createElement({ tagName: 'div', className: 'modal-header tower-modal___header' });
    const title = createElement({ tagName: 'h2', className: 'tower-modal___title tower-modal___title--defeat' });
    title.innerText = 'DEFEAT / GAME OVER';

    const subtitle = createElement({ tagName: 'p', className: 'tower-modal___subtitle' });
    subtitle.innerText = `Fell at Stage ${stageIndex + 1} of 6 against ${opponent.name}`;
    header.append(title, subtitle);

    const body = createElement({ tagName: 'div', className: 'modal-body tower-modal___body' });

    const ladder = createTowerLadderWidget(stageIndex);
    body.appendChild(ladder);

    const btnRow = createElement({ tagName: 'div', className: 'tower-modal___btn-row' });

    const retryBtn = createElement({
        tagName: 'button',
        className: 'winner-modal___action-btn tower-modal___btn tower-modal___btn--retry',
        attributes: { type: 'button' }
    });
    retryBtn.innerText = '🔄 Retry Stage';
    retryBtn.addEventListener('click', () => {
        layer.remove();
        if (typeof onRetry === 'function') onRetry();
    });

    const menuBtn = createElement({
        tagName: 'button',
        className: 'winner-modal___action-btn tower-modal___btn tower-modal___btn--menu',
        attributes: { type: 'button' }
    });
    menuBtn.innerText = '🏠 Main Menu';
    menuBtn.addEventListener('click', () => {
        layer.remove();
        if (typeof onMainMenu === 'function') onMainMenu();
    });

    btnRow.append(retryBtn, menuBtn);
    body.appendChild(btnRow);

    const bottomAccent = createElement({
        tagName: 'div',
        className: 'winner-modal___bottom-accent tower-modal___accent--red'
    });

    modal.append(topAccent, header, body, bottomAccent);
    layer.appendChild(modal);
    root.appendChild(layer);
}

export function showTowerChampionModal({ champion, onMainMenu }) {
    const root = document.getElementById('root');
    const layer = createElement({ tagName: 'div', className: 'modal-layer' });
    const modal = createElement({ tagName: 'div', className: 'modal-root tower-modal tower-modal--champion' });

    const topAccent = createElement({
        tagName: 'div',
        className: 'winner-modal___top-accent tower-modal___accent--gold'
    });

    const header = createElement({ tagName: 'div', className: 'modal-header tower-modal___header' });
    const title = createElement({ tagName: 'h2', className: 'tower-modal___title tower-modal___title--champion' });
    title.innerText = '👑 TOWER CHAMPION 👑';

    const subtitle = createElement({ tagName: 'p', className: 'tower-modal___subtitle' });
    subtitle.innerText = 'All 6 stages conquered! You reign supreme in Arena Clash!';
    header.append(title, subtitle);

    const body = createElement({ tagName: 'div', className: 'modal-body tower-modal___body' });

    const champTitle = createElement({ tagName: 'h3', className: 'winner-modal___fighter-name' });
    champTitle.innerText = champion?.name ?? 'Champion';

    const imgContainer = createElement({ tagName: 'div', className: 'winner-modal___image-container' });
    const img = createFighterImage(champion);
    imgContainer.appendChild(img);

    const ladder = createTowerLadderWidget(6);

    const menuBtn = createElement({
        tagName: 'button',
        className: 'winner-modal___action-btn tower-modal___btn tower-modal___btn--champion',
        attributes: { type: 'button' }
    });
    menuBtn.innerText = '🏆 Return to Main Menu';
    menuBtn.addEventListener('click', () => {
        layer.remove();
        if (typeof onMainMenu === 'function') onMainMenu();
    });

    body.append(champTitle, imgContainer, ladder, menuBtn);

    const bottomAccent = createElement({
        tagName: 'div',
        className: 'winner-modal___bottom-accent tower-modal___accent--gold'
    });

    modal.append(topAccent, header, body, bottomAccent);
    layer.appendChild(modal);
    root.appendChild(layer);
}
