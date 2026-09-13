import createElement from '../../helpers/domHelper';

export default function showCountdownOverlay(onComplete) {
    const root = document.getElementById('root');
    const layer = createElement({ tagName: 'div', className: 'modal-layer online-countdown-layer' });
    const countText = createElement({ tagName: 'div', className: 'online-countdown-text' });
    countText.innerText = '3';
    layer.appendChild(countText);
    root.appendChild(layer);

    const playNumber = (text, isFight = false) => {
        countText.innerText = text;
        countText.classList.toggle('online-countdown-text--fight', isFight);
        countText.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        countText.offsetHeight; // trigger reflow for zoomCountdown animation
        countText.style.animation = '';
    };

    let count = 3;
    const interval = setInterval(() => {
        count -= 1;
        if (count > 0) {
            playNumber(String(count));
        } else if (count === 0) {
            playNumber('FIGHT!', true);
        } else {
            clearInterval(interval);
            layer.remove();
            if (typeof onComplete === 'function') onComplete();
        }
    }, 750);
}
