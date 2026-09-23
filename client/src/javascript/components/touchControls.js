import createElement from '../helpers/domHelper';

/**
 * High-performance virtual arcade touch controls for mobile landscape.
 * Translates multi-touch interactions into zero-latency KeyboardEvents.
 */
export default function createTouchControls() {
    const container = createElement({
        tagName: 'div',
        className: 'touch-controls'
    });

    const activeKeys = new Map(); // touchId -> keyCode
    const buttonElements = new Map(); // keyCode -> element

    const dispatchKeyEvent = (type, code) => {
        const event = new KeyboardEvent(type, {
            code,
            key: code,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    };

    const pressKey = (code, element) => {
        if (!code) return;
        dispatchKeyEvent('keydown', code);
        if (element) {
            element.classList.add('touch-btn--active');
        }
    };

    const releaseKey = (code, element) => {
        if (!code) return;
        dispatchKeyEvent('keyup', code);
        if (element) {
            element.classList.remove('touch-btn--active');
        }
    };

    const triggerSuperCombo = () => {
        const combo = ['KeyQ', 'KeyW', 'KeyE'];
        combo.forEach((key, index) => {
            setTimeout(() => {
                dispatchKeyEvent('keydown', key);
                dispatchKeyEvent('keyup', key);
            }, index * 25);
        });
    };

    const bindTouchButton = (btn, code, isSuper = false) => {
        buttonElements.set(code, btn);

        const handleStart = event => {
            event.preventDefault();
            event.stopPropagation();

            if (isSuper) {
                btn.classList.add('touch-btn--active');
                triggerSuperCombo();
                setTimeout(() => {
                    btn.classList.remove('touch-btn--active');
                }, 180);
                return;
            }

            Array.from(event.changedTouches || [event]).forEach(touch => {
                const id = touch.identifier ?? 'mouse';
                activeKeys.set(id, code);
                pressKey(code, btn);
            });
        };

        const handleEnd = event => {
            event.preventDefault();
            event.stopPropagation();

            if (isSuper) return;

            Array.from(event.changedTouches || [event]).forEach(touch => {
                const id = touch.identifier ?? 'mouse';
                if (activeKeys.get(id) === code) {
                    activeKeys.delete(id);
                    releaseKey(code, btn);
                }
            });
        };

        btn.addEventListener('touchstart', handleStart, { passive: false });
        btn.addEventListener('touchend', handleEnd, { passive: false });
        btn.addEventListener('touchcancel', handleEnd, { passive: false });

        // Mouse fallbacks for testing in desktop emulators
        btn.addEventListener('mousedown', handleStart);
        btn.addEventListener('mouseup', handleEnd);
        btn.addEventListener('mouseleave', handleEnd);
    };

    // --- Create Left D-Pad ---
    const dpad = createElement({ tagName: 'div', className: 'touch-dpad' });
    const hub = createElement({ tagName: 'div', className: 'touch-dpad___hub' });
    const hubDot = createElement({ tagName: 'div', className: 'touch-dpad___hub-dot' });
    hub.append(hubDot);

    const btnUp = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--up',
        attributes: { type: 'button', 'aria-label': 'Jump' }
    });
    btnUp.innerHTML = '<span class="touch-btn___icon">▲</span><span class="touch-btn___sub">JUMP</span>';
    bindTouchButton(btnUp, 'Space');

    const btnDown = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--down',
        attributes: { type: 'button', 'aria-label': 'Block or Crouch' }
    });
    btnDown.innerHTML = '<span class="touch-btn___icon">🛡</span><span class="touch-btn___sub">BLOCK</span>';
    bindTouchButton(btnDown, 'KeyS');

    const btnLeft = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--left',
        attributes: { type: 'button', 'aria-label': 'Move Left' }
    });
    btnLeft.innerHTML = '<span class="touch-btn___icon">◀</span><span class="touch-btn___sub">LEFT</span>';
    bindTouchButton(btnLeft, 'KeyA');

    const btnRight = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--right',
        attributes: { type: 'button', 'aria-label': 'Move Right' }
    });
    btnRight.innerHTML = '<span class="touch-btn___icon">▶</span><span class="touch-btn___sub">RIGHT</span>';
    bindTouchButton(btnRight, 'KeyD');

    dpad.append(hub, btnUp, btnDown, btnLeft, btnRight);

    // --- Create Right Action Cluster ---
    const actions = createElement({ tagName: 'div', className: 'touch-actions' });

    const btnPunch = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--punch',
        attributes: { type: 'button', 'aria-label': 'Punch' }
    });
    btnPunch.innerHTML = '<span class="touch-btn___icon">👊</span><span class="touch-btn___sub">PUNCH [J]</span>';
    bindTouchButton(btnPunch, 'KeyJ');

    const btnKick = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--kick',
        attributes: { type: 'button', 'aria-label': 'Kick' }
    });
    btnKick.innerHTML = '<span class="touch-btn___icon">🦵</span><span class="touch-btn___sub">KICK [K]</span>';
    bindTouchButton(btnKick, 'KeyK');

    const btnSpecial = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--special',
        attributes: { type: 'button', 'aria-label': 'Special Magic Move' }
    });
    btnSpecial.innerHTML = '<span class="touch-btn___icon">✦</span><span class="touch-btn___sub">MAGIC [U]</span>';
    bindTouchButton(btnSpecial, 'KeyU');

    const btnSuper = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--super',
        attributes: { type: 'button', 'aria-label': 'Super Critical Combo' }
    });
    btnSuper.innerHTML = '<span class="touch-btn___icon">⚡ SUPER</span><span class="touch-btn___sub">Q-W-E</span>';
    bindTouchButton(btnSuper, 'SUPER', true);

    actions.append(btnSuper, btnSpecial, btnPunch, btnKick);

    container.append(dpad, actions);

    return {
        element: container,

        mount(parent) {
            if (parent && !parent.contains(container)) {
                parent.appendChild(container);
            }
        },

        show() {
            container.classList.remove('touch-controls--hidden');
        },

        hide() {
            // Release any currently active keys to prevent sticky movement
            activeKeys.forEach(code => {
                const btn = buttonElements.get(code);
                releaseKey(code, btn);
            });
            activeKeys.clear();
            container.classList.add('touch-controls--hidden');
        },

        setSuperMeter(meter) {
            if (meter >= 100) {
                btnSuper.classList.add('touch-btn--super-charged');
            } else {
                btnSuper.classList.remove('touch-btn--super-charged');
            }
        },

        destroy() {
            this.hide();
            if (container.parentElement) {
                container.parentElement.removeChild(container);
            }
            buttonElements.clear();
        }
    };
}
