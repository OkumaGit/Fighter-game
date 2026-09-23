import createElement from './domHelper';

/**
 * Manages mobile orientation, prompts the user to rotate to landscape mode,
 * and requests screen orientation lock / fullscreen where supported.
 */
class MobileOrientationManager {
    constructor() {
        this.guardElement = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.createGuard();
        this.bindEvents();
        this.checkOrientation();
    }

    createGuard() {
        if (this.guardElement) return;

        const guard = createElement({
            tagName: 'div',
            className: 'orientation-guard'
        });

        const content = createElement({
            tagName: 'div',
            className: 'orientation-guard___content'
        });

        const topAccent = createElement({
            tagName: 'div',
            className: 'orientation-guard___top-accent'
        });

        const iconWrap = createElement({
            tagName: 'div',
            className: 'orientation-guard___icon-wrap'
        });

        const phoneIcon = createElement({
            tagName: 'div',
            className: 'orientation-guard___phone-icon'
        });

        const phoneNotch = createElement({
            tagName: 'div',
            className: 'orientation-guard___phone-notch'
        });

        const phoneScreen = createElement({
            tagName: 'div',
            className: 'orientation-guard___phone-screen'
        });

        phoneIcon.append(phoneNotch, phoneScreen);
        iconWrap.append(phoneIcon);

        const title = createElement({
            tagName: 'h2',
            className: 'orientation-guard___title',
            innerText: 'ROTATE DEVICE'
        });

        const desc = createElement({
            tagName: 'p',
            className: 'orientation-guard___desc',
            innerText: 'Arena Clash is an arcade fighting game optimized for Landscape Mode. Please rotate your phone.'
        });

        const pill = createElement({
            tagName: 'div',
            className: 'orientation-guard___pill',
            innerText: '↺ LANDSCAPE REQUIRED'
        });

        content.append(topAccent, iconWrap, title, desc, pill);
        guard.append(content);

        // Allow user tap to request orientation lock or fullscreen
        guard.addEventListener('click', () => {
            this.tryLockLandscape();
        });

        document.body.appendChild(guard);
        this.guardElement = guard;
    }

    bindEvents() {
        const handleOrientationChange = () => {
            setTimeout(() => {
                this.checkOrientation();
                window.dispatchEvent(new Event('resize'));
            }, 100);
        };

        window.addEventListener('resize', () => this.checkOrientation());
        window.addEventListener('orientationchange', handleOrientationChange);

        // Attempt landscape lock on first user interaction with the document
        const onFirstTouch = () => {
            this.tryLockLandscape();
            document.removeEventListener('touchstart', onFirstTouch);
            document.removeEventListener('click', onFirstTouch);
        };
        document.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });
        document.addEventListener('click', onFirstTouch, { once: true });
    }

    tryLockLandscape() {
        try {
            if (window.screen?.orientation && typeof window.screen.orientation.lock === 'function') {
                window.screen.orientation
                    .lock('landscape')
                    .then(() => {
                        this.isLocked = true;
                    })
                    .catch(() => {
                        // Orientation lock not supported or denied by browser policy, ignore silently
                    });
            }
        } catch (e) {
            // Ignore if restricted
        }
    }

    checkOrientation() {
        if (!this.guardElement) return;

        const isMobileOrTablet =
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches ||
            window.innerWidth <= 1024;

        const isPortrait = window.innerHeight > window.innerWidth;

        if (isMobileOrTablet && isPortrait) {
            this.guardElement.classList.add('orientation-guard--visible');
            this.guardElement.classList.remove('orientation-guard--hidden');
        } else {
            this.guardElement.classList.remove('orientation-guard--visible');
            this.guardElement.classList.add('orientation-guard--hidden');
        }
    }
}

const mobileOrientation = new MobileOrientationManager();
export default mobileOrientation;
