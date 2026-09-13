import createElement from '../helpers/domHelper';

export function createRoundMedallions(position) {
    const medallions = createElement({
        tagName: 'div',
        className: `arena___round-medallions arena___round-medallions--${position}`,
        attributes: { id: `${position}-round-medallions` }
    });
    medallions.innerHTML = `
        <span class="arena___round-medallion" data-round="1"></span>
        <span class="arena___round-medallion" data-round="2"></span>
    `;
    return medallions;
}

export function updateRoundMedallions(position, wins) {
    const container = document.getElementById(`${position}-round-medallions`);
    if (!container) return;
    const dots = container.querySelectorAll('.arena___round-medallion');
    dots.forEach((dot, index) => {
        if (index < wins) {
            dot.classList.add('arena___round-medallion--won');
        } else {
            dot.classList.remove('arena___round-medallion--won');
        }
    });
}

export function createSuperBar(position) {
    const container = createElement({
        tagName: 'div',
        className: `arena___super-bar-container arena___super-bar-container--${position}`
    });
    const label = createElement({
        tagName: 'span',
        className: 'arena___super-label',
        attributes: { id: `${position}-super-label` }
    });
    label.innerText = 'SUPER 0%';

    const bar = createElement({
        tagName: 'div',
        className: 'arena___super-bar'
    });
    const fill = createElement({
        tagName: 'div',
        className: 'arena___super-bar-fill',
        attributes: { id: `${position}-super-bar-fill` }
    });
    bar.appendChild(fill);

    container.append(label, bar);
    return container;
}

export function updateSuperBar(position, percent) {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    const fill = document.getElementById(`${position}-super-bar-fill`);
    const label = document.getElementById(`${position}-super-label`);
    if (fill) {
        fill.style.width = `${clamped}%`;
        if (clamped >= 100) {
            fill.classList.add('arena___super-bar-fill--ready');
        } else {
            fill.classList.remove('arena___super-bar-fill--ready');
        }
    }
    if (label) {
        if (clamped >= 100) {
            label.innerText = 'CRIT READY!';
            label.classList.add('arena___super-label--ready');
        } else {
            label.innerText = `SUPER ${clamped}%`;
            label.classList.remove('arena___super-label--ready');
        }
    }
}

export function updateTimerDisplay(seconds) {
    const timerElement = document.getElementById('arena-fight-timer');
    if (!timerElement) return;
    const formatted = Math.max(0, Math.floor(seconds));
    timerElement.innerText = formatted < 10 ? `0${formatted}` : `${formatted}`;
    if (formatted <= 10) {
        timerElement.classList.add('arena___fight-timer--urgent');
    } else {
        timerElement.classList.remove('arena___fight-timer--urgent');
    }
}

export function showMatchAnnouncement(text, type = 'round', durationMs = 1500) {
    const arena = document.querySelector('.arena___battlefield') || document.querySelector('.arena___root');
    if (!arena) return Promise.resolve(null);

    const overlay = createElement({
        tagName: 'div',
        className: 'arena___announcement-overlay'
    });
    const title = createElement({
        tagName: 'h2',
        className: `arena___announcement-title arena___announcement-title--${type}`
    });
    title.innerText = text;
    overlay.appendChild(title);
    arena.appendChild(overlay);

    if (!durationMs) {
        return {
            element: overlay,
            remove: () => overlay.remove(),
            updateText: (newText, newType) => {
                title.innerText = newText;
                if (newType) {
                    title.className = `arena___announcement-title arena___announcement-title--${newType}`;
                }
            }
        };
    }

    return new Promise(resolve => {
        setTimeout(() => {
            overlay.remove();
            resolve();
        }, durationMs);
    });
}
