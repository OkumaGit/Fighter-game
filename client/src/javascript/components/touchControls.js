import createElement from '../helpers/domHelper';

/**
 * Console-grade translucent arcade touch controls inspired by Shadow Fight.
 * Features an analog virtual joystick on the left and an ergonomic radial action fan on the right.
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

    // ==========================================
    // 1. LEFT VIRTUAL ANALOG JOYSTICK
    // ==========================================
    const joystickWrap = createElement({ tagName: 'div', className: 'touch-joystick' });
    const joystickBase = createElement({ tagName: 'div', className: 'touch-joystick___base' });

    const arrowUp = createElement({
        tagName: 'div',
        className: 'touch-joystick___arrow touch-joystick___arrow--up',
        innerText: '▲'
    });
    const arrowDown = createElement({
        tagName: 'div',
        className: 'touch-joystick___arrow touch-joystick___arrow--down',
        innerText: '▼'
    });
    const arrowLeft = createElement({
        tagName: 'div',
        className: 'touch-joystick___arrow touch-joystick___arrow--left',
        innerText: '◀'
    });
    const arrowRight = createElement({
        tagName: 'div',
        className: 'touch-joystick___arrow touch-joystick___arrow--right',
        innerText: '▶'
    });

    const knob = createElement({ tagName: 'div', className: 'touch-joystick___knob' });

    joystickBase.append(arrowUp, arrowDown, arrowLeft, arrowRight, knob);
    joystickWrap.append(joystickBase);

    let joystickTouchId = null;
    let isMouseDownOnJoystick = false;
    const currentDirections = new Set();

    const setArrowActive = (code, active) => {
        if (code === 'KeyA') arrowLeft.classList.toggle('touch-joystick___arrow--active', active);
        if (code === 'KeyD') arrowRight.classList.toggle('touch-joystick___arrow--active', active);
        if (code === 'Space') arrowUp.classList.toggle('touch-joystick___arrow--active', active);
        if (code === 'KeyS') arrowDown.classList.toggle('touch-joystick___arrow--active', active);
    };

    const updateJoystickPosition = (clientX, clientY) => {
        const rect = joystickBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);
        const maxRadius = rect.width * 0.32; // ~55px travel limit
        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;
        knob.style.transform = `translate(${knobX}px, ${knobY}px)`;
        knob.classList.add('touch-joystick___knob--active');

        const deadzone = 14;
        const desiredDirections = new Set();

        if (dist > deadzone) {
            const normX = dx / dist;
            const normY = dy / dist;

            if (normX < -0.38) desiredDirections.add('KeyA');
            if (normX > 0.38) desiredDirections.add('KeyD');
            if (normY < -0.38) desiredDirections.add('Space');
            if (normY > 0.38) desiredDirections.add('KeyS');
        }

        // Release keys no longer active
        currentDirections.forEach(code => {
            if (!desiredDirections.has(code)) {
                dispatchKeyEvent('keyup', code);
                currentDirections.delete(code);
                setArrowActive(code, false);
            }
        });

        // Press newly active keys
        desiredDirections.forEach(code => {
            if (!currentDirections.has(code)) {
                dispatchKeyEvent('keydown', code);
                currentDirections.add(code);
                setArrowActive(code, true);
            }
        });
    };

    const resetJoystick = () => {
        knob.style.transform = 'translate(0px, 0px)';
        knob.classList.remove('touch-joystick___knob--active');
        currentDirections.forEach(code => {
            dispatchKeyEvent('keyup', code);
            setArrowActive(code, false);
        });
        currentDirections.clear();
        joystickTouchId = null;
        isMouseDownOnJoystick = false;
    };

    // Joystick Touch Handlers
    const onJoystickTouchStart = event => {
        event.preventDefault();
        event.stopPropagation();
        if (joystickTouchId !== null) return;
        const touch = event.changedTouches[0];
        if (!touch) return;
        joystickTouchId = touch.identifier;
        updateJoystickPosition(touch.clientX, touch.clientY);
    };

    const onWindowTouchMove = event => {
        if (joystickTouchId === null) return;
        const touch = Array.from(event.touches).find(t => t.identifier === joystickTouchId);
        if (touch) {
            updateJoystickPosition(touch.clientX, touch.clientY);
        }
    };

    const onWindowTouchEnd = event => {
        if (joystickTouchId === null) return;
        const touch = Array.from(event.changedTouches).find(t => t.identifier === joystickTouchId);
        if (touch) {
            resetJoystick();
        }
    };

    // Joystick Mouse Handlers (Desktop / Testing fallback)
    const onJoystickMouseDown = event => {
        event.preventDefault();
        isMouseDownOnJoystick = true;
        updateJoystickPosition(event.clientX, event.clientY);
    };

    const onWindowMouseMove = event => {
        if (!isMouseDownOnJoystick) return;
        updateJoystickPosition(event.clientX, event.clientY);
    };

    const onWindowMouseUp = () => {
        if (!isMouseDownOnJoystick) return;
        resetJoystick();
    };

    joystickBase.addEventListener('touchstart', onJoystickTouchStart, { passive: false });
    window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
    window.addEventListener('touchend', onWindowTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onWindowTouchEnd, { passive: false });

    joystickBase.addEventListener('mousedown', onJoystickMouseDown);
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    // ==========================================
    // 2. RIGHT ACTION CLUSTER (SHADOW FIGHT ARC)
    // ==========================================
    const actions = createElement({ tagName: 'div', className: 'touch-actions' });

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

        btn.addEventListener('mousedown', handleStart);
        btn.addEventListener('mouseup', handleEnd);
        btn.addEventListener('mouseleave', handleEnd);
    };

    // Punch Button (Fist)
    const btnPunch = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--punch',
        attributes: { type: 'button', 'aria-label': 'Punch' }
    });
    btnPunch.innerHTML = `
        <svg viewBox="0 0 24 24" class="touch-btn___svg" width="28" height="28" fill="currentColor">
            <path d="M19 10.5V8.5C19 7.67 18.33 7 17.5 7C17.3 7 17.11 7.04 16.94 7.11C16.63 6.46 15.97 6 15.2 6C14.86 6 14.54 6.1 14.28 6.27C13.97 5.53 13.25 5 12.4 5C11.41 5 10.6 5.81 10.6 6.8V11.5L9.62 10.42C9.07 9.81 8.16 9.77 7.55 10.32C6.94 10.87 6.9 11.78 7.45 12.39L10.9 16.2C11.83 17.23 13.16 17.82 14.54 17.82H17.2C18.67 17.82 19.9 16.71 20.06 15.25L20.5 11.29C20.5 11.26 20.5 11.23 20.5 11.2C20.5 10.81 20.19 10.5 19.8 10.5H19Z"/>
        </svg>
        <span class="touch-btn___label">PUNCH</span>
    `;
    bindTouchButton(btnPunch, 'KeyJ');

    // Kick Button (Foot)
    const btnKick = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--kick',
        attributes: { type: 'button', 'aria-label': 'Kick' }
    });
    btnKick.innerHTML = `
        <svg viewBox="0 0 24 24" class="touch-btn___svg" width="28" height="28" fill="currentColor">
            <path d="M17 3c-.55 0-1 .45-1 1v6.2l-4.5-3c-.45-.3-1.05-.2-1.45.25L5.6 13.6c-.3.4-.3 1 0 1.4l4.8 5.6c.9 1.1 2.25 1.7 3.65 1.7H20c.55 0 1-.45 1-1v-4.5c0-.55-.45-1-1-1h-2.5v-4l3.5-2.35c.35-.25.55-.65.55-1.05V4c0-.55-.45-1-1-1h-3.5z"/>
        </svg>
        <span class="touch-btn___label">KICK</span>
    `;
    bindTouchButton(btnKick, 'KeyK');

    // Special Magic Button (Swirl / Flame)
    const btnSpecial = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--special',
        attributes: { type: 'button', 'aria-label': 'Special Magic' }
    });
    btnSpecial.innerHTML = `
        <svg viewBox="0 0 24 24" class="touch-btn___svg" width="28" height="28" fill="currentColor">
            <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6L12 2zm0 5.4l-1.4 3.9L6.7 12l3.9 1.4L12 17.3l1.4-3.9 3.9-1.4-3.9-1.4L12 7.4z"/>
        </svg>
        <span class="touch-btn___label">MAGIC</span>
    `;
    bindTouchButton(btnSpecial, 'KeyU');

    // Super Combo Button (Lightning Star / Super)
    const btnSuper = createElement({
        tagName: 'button',
        className: 'touch-btn touch-btn--super',
        attributes: { type: 'button', 'aria-label': 'Super Critical Strike' }
    });
    btnSuper.innerHTML = `
        <svg viewBox="0 0 24 24" class="touch-btn___svg" width="28" height="28" fill="currentColor">
            <path d="M14 2L5 13h6l-1.8 9 9.8-12h-6.2L14 2z"/>
        </svg>
        <span class="touch-btn___label">SUPER</span>
    `;
    bindTouchButton(btnSuper, 'SUPER', true);

    actions.append(btnSpecial, btnSuper, btnKick, btnPunch);
    container.append(joystickWrap, actions);

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
            resetJoystick();
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
            window.removeEventListener('touchmove', onWindowTouchMove);
            window.removeEventListener('touchend', onWindowTouchEnd);
            window.removeEventListener('touchcancel', onWindowTouchEnd);
            window.removeEventListener('mousemove', onWindowMouseMove);
            window.removeEventListener('mouseup', onWindowMouseUp);

            if (container.parentElement) {
                container.parentElement.removeChild(container);
            }
            buttonElements.clear();
        }
    };
}
