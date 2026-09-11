import createElement from './domHelper';

export const ICONS = {
    pvp: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 1H4V3H3V1ZM10 1H11V3H10V1ZM1 3H3V4H1V3ZM11 3H13V4H11V3ZM3 4H4V5H3V4ZM10 4H11V5H10V4ZM0 7L3 4L4 5L2 7L4 9L3 10L0 7ZM14 7L11 4L10 5L12 7L10 9L11 10L14 7Z" fill="currentColor"/>
<path opacity="0.5" d="M5 6H9V8H5V6Z" fill="currentColor"/>
</svg>`,

    pve: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 4H4C3.44772 4 3 4.44772 3 5V9C3 9.55228 3.44772 10 4 10H10C10.5523 10 11 9.55228 11 9V5C11 4.44772 10.5523 4 10 4Z" stroke="currentColor" stroke-width="1.2"/>
<path d="M5 8C5.55228 8 6 7.55228 6 7C6 6.44772 5.55228 6 5 6C4.44772 6 4 6.44772 4 7C4 7.55228 4.44772 8 5 8Z" fill="currentColor"/>
<path d="M9 8C9.55228 8 10 7.55228 10 7C10 6.44772 9.55228 6 9 6C8.44772 6 8 6.44772 8 7C8 7.55228 8.44772 8 9 8Z" fill="currentColor"/>
<path d="M5.5 2.5V4M8.5 2.5V4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
<path d="M1 6.5H3M11 6.5H13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>`,

    tower: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.8" d="M10 6H4V13H10V6Z" fill="currentColor"/>
<path d="M5 4H3V7H5V4Z" fill="currentColor"/>
<path d="M8 4H6V7H8V4Z" fill="currentColor"/>
<path d="M11 4H9V7H11V4Z" fill="currentColor"/>
<path d="M12 3H2V4.5H12V3Z" fill="currentColor"/>
<path opacity="0.4" d="M8 8H6V13H8V8Z" fill="currentColor"/>
</svg>`,

    online: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7 12.5C10.0376 12.5 12.5 10.0376 12.5 7C12.5 3.96243 10.0376 1.5 7 1.5C3.96243 1.5 1.5 3.96243 1.5 7C1.5 10.0376 3.96243 12.5 7 12.5Z" stroke="currentColor" stroke-width="1.2"/>
<path d="M7 12.5C8.38071 12.5 9.5 10.0376 9.5 7C9.5 3.96243 8.38071 1.5 7 1.5C5.61929 1.5 4.5 3.96243 4.5 7C4.5 10.0376 5.61929 12.5 7 12.5Z" stroke="currentColor"/>
<path d="M1.5 5H12.5M1.5 9H12.5" stroke="currentColor"/>
<path d="M11 5C12.1046 5 13 4.10457 13 3C13 1.89543 12.1046 1 11 1C9.89543 1 9 1.89543 9 3C9 4.10457 9.89543 5 11 5Z" fill="#22C55E"/>
</svg>`,

    dice: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="1.5" y="1.5" width="11" height="11" rx="2.5" stroke="currentColor" stroke-width="1.2"/>
<circle cx="4.5" cy="4.5" r="1" fill="currentColor"/>
<circle cx="9.5" cy="4.5" r="1" fill="currentColor"/>
<circle cx="7" cy="7" r="1" fill="currentColor"/>
<circle cx="4.5" cy="9.5" r="1" fill="currentColor"/>
<circle cx="9.5" cy="9.5" r="1" fill="currentColor"/>
</svg>`,

    swords: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.5 1.5L8.5 5.5M1.5 12.5L3.5 10.5L1.5 8.5L3 7L5 9L9.5 4.5L11 6L6.5 10.5L8.5 12.5L7 14L5 12L3 14L1.5 12.5Z" fill="currentColor"/>
<path d="M1.5 1.5L5.5 5.5M12.5 12.5L10.5 10.5L12.5 8.5L11 7L9 9L4.5 4.5L3 6L7.5 10.5L5.5 12.5L7 14L9 12L11 14L12.5 12.5Z" fill="currentColor" opacity="0.6"/>
</svg>`,

    crown: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.5 11.5H12.5V13H1.5V11.5ZM2 10.5L1 3.5L4.5 6.5L7 1.5L9.5 6.5L13 3.5L12 10.5H2Z" fill="currentColor"/>
</svg>`,

    copy: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
<path d="M9.5 2.5H3C2.44772 2.5 2 2.94772 2 3.5V10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>`,

    link: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 8L8 6M5.5 9.5L4 11C2.89543 12.1046 1.10457 12.1046 0 11C-1.10457 9.89543 -1.10457 8.10457 0 7L1.5 5.5M8.5 4.5L10 3C11.1046 1.89543 12.8954 1.89543 14 3C15.1046 4.10457 15.1046 5.89543 14 7L12.5 8.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>`,

    check: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,

    lock: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="2.5" y="6" width="9" height="6.5" rx="1.5" fill="currentColor"/>
<path d="M4.5 6V4C4.5 2.61929 5.61929 1.5 7 1.5C8.38071 1.5 9.5 2.61929 9.5 4V6" stroke="currentColor" stroke-width="1.2"/>
</svg>`,

    gamepad: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.5 3H10.5C12.433 3 14 4.567 14 6.5C14 8.433 12.433 10 10.5 10L9 8H5L3.5 10C1.567 10 0 8.433 0 6.5C0 4.567 1.567 3 3.5 3Z" stroke="currentColor" stroke-width="1.2"/>
<path d="M4 6.5H6M5 5.5V7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
<circle cx="9.5" cy="6" r="0.75" fill="currentColor"/>
<circle cx="11" cy="7" r="0.75" fill="currentColor"/>
</svg>`
};

export function createIcon(name, extraClass = '') {
    const iconContainer = createElement({
        tagName: 'span',
        className: `app-icon app-icon--${name}${extraClass ? ` ${extraClass}` : ''}`
    });
    iconContainer.innerHTML = ICONS[name] || '';
    return iconContainer;
}

export function createButtonWithIcon({ iconName, text, className = '', attributes = {} }) {
    const button = createElement({
        tagName: 'button',
        className,
        attributes
    });
    const icon = createIcon(iconName);
    const textSpan = createElement({ tagName: 'span', className: 'app-btn__text' });
    textSpan.innerText = text;
    button.append(icon, textSpan);
    return button;
}
