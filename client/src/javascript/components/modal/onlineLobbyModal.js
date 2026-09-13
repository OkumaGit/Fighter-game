import createElement from '../../helpers/domHelper';
import socketService from '../../services/socketService';
import { createIcon } from '../../helpers/icons';

export default function showOnlineLobbyModal({ onRoomReady, onCancel }) {
    const root = document.getElementById('root');
    const layer = createElement({ tagName: 'div', className: 'modal-layer' });
    const modal = createElement({ tagName: 'div', className: 'modal-root online-modal' });

    // Top cyan accent
    const topAccent = createElement({ tagName: 'div', className: 'online-modal___accent' });

    // Header
    const header = createElement({ tagName: 'div', className: 'modal-header online-modal___header' });
    const headerLeft = createElement({ tagName: 'div', className: 'online-modal___header-left' });
    const subtitle = createElement({ tagName: 'span', className: 'winner-modal___subtitle online-modal___subtitle' });
    subtitle.innerText = 'ONLINE MULTIPLAYER';

    const title = createElement({ tagName: 'h2', className: 'winner-modal___title online-modal___title' });
    title.innerText = '1V1 MATCH LOBBY';
    headerLeft.append(subtitle, title);

    const closeBtn = createElement({
        tagName: 'button',
        className: 'close-btn winner-modal___close-btn',
        attributes: { type: 'button', 'aria-label': 'Close' }
    });
    closeBtn.innerText = '×';
    header.append(headerLeft, closeBtn);

    // Body
    const body = createElement({ tagName: 'div', className: 'modal-body online-modal___body' });

    // Tab Switcher
    const tabContainer = createElement({ tagName: 'div', className: 'online-modal___tabs' });
    const hostTabBtn = createElement({
        tagName: 'button',
        className: 'online-modal___tab-btn online-modal___tab-btn--active',
        attributes: { type: 'button' }
    });
    hostTabBtn.append(createIcon('crown'), createElement({ tagName: 'span', innerText: 'Host Match' }));

    const joinTabBtn = createElement({
        tagName: 'button',
        className: 'online-modal___tab-btn',
        attributes: { type: 'button' }
    });
    joinTabBtn.append(createIcon('gamepad'), createElement({ tagName: 'span', innerText: 'Join Match' }));
    tabContainer.append(hostTabBtn, joinTabBtn);

    // Host Panel
    const hostPanel = createElement({ tagName: 'div', className: 'online-modal___panel online-modal___panel--host' });
    const hostDesc = createElement({ tagName: 'p', className: 'online-modal___desc' });
    hostDesc.innerText = 'Create a new room and share the 5-character code with your opponent.';

    const createBtn = createElement({
        tagName: 'button',
        className: 'winner-modal___action-btn online-modal___btn online-modal___btn--create',
        attributes: { type: 'button' }
    });
    createBtn.innerText = 'Generate Room Code ⚡';

    const hostCodeSection = createElement({
        tagName: 'div',
        className: 'online-modal___code-section',
        attributes: { style: 'display: none;' }
    });

    const codeLabel = createElement({ tagName: 'div', className: 'online-modal___code-label' });
    codeLabel.innerText = 'YOUR ROOM CODE';

    const codeDisplay = createElement({ tagName: 'div', className: 'online-modal___code-display' });
    codeDisplay.innerText = '-----';

    const copyBtnRow = createElement({ tagName: 'div', className: 'online-modal___btn-row' });
    const copyCodeBtn = createElement({
        tagName: 'button',
        className: 'online-modal___action-btn',
        attributes: { type: 'button' }
    });
    copyCodeBtn.append(createIcon('copy'), createElement({ tagName: 'span', innerText: 'Copy Code' }));

    const copyLinkBtn = createElement({
        tagName: 'button',
        className: 'online-modal___action-btn',
        attributes: { type: 'button' }
    });
    copyLinkBtn.append(createIcon('link'), createElement({ tagName: 'span', innerText: 'Copy Invite Link' }));
    copyBtnRow.append(copyCodeBtn, copyLinkBtn);

    const waitingSpinner = createElement({ tagName: 'div', className: 'online-modal___waiting' });
    waitingSpinner.innerHTML =
        '<span class="online-modal___radar"></span><span>Waiting for opponent to connect...</span>';

    hostCodeSection.append(codeLabel, codeDisplay, copyBtnRow, waitingSpinner);
    hostPanel.append(hostDesc, createBtn, hostCodeSection);

    // Join Panel
    const joinPanel = createElement({
        tagName: 'div',
        className: 'online-modal___panel online-modal___panel--join',
        attributes: { style: 'display: none;' }
    });
    const joinDesc = createElement({ tagName: 'p', className: 'online-modal___desc' });
    joinDesc.innerText = 'Enter the 5-character room code shared by the host to join the battle.';

    const joinInputGroup = createElement({ tagName: 'div', className: 'online-modal___input-group' });
    const codeInput = createElement({
        tagName: 'input',
        className: 'online-modal___input',
        attributes: {
            type: 'text',
            placeholder: 'e.g. FG742',
            maxlength: '5',
            spellcheck: 'false',
            autocomplete: 'off'
        }
    });

    const joinBtn = createElement({
        tagName: 'button',
        className: 'winner-modal___action-btn online-modal___btn online-modal___btn--join',
        attributes: { type: 'button' }
    });
    joinBtn.append(createIcon('swords'), createElement({ tagName: 'span', innerText: 'Join Match' }));
    joinInputGroup.append(codeInput, joinBtn);

    const errorMsg = createElement({
        tagName: 'div',
        className: 'online-modal___error',
        attributes: { style: 'display: none;' }
    });
    joinPanel.append(joinDesc, joinInputGroup, errorMsg);

    // Connection Status Footer
    const statusFooter = createElement({ tagName: 'div', className: 'online-modal___status-footer' });
    const statusDot = createElement({ tagName: 'span', className: 'online-modal___status-dot' });
    const statusText = createElement({ tagName: 'span', className: 'online-modal___status-text' });
    statusText.innerText = 'Connecting to server...';
    statusFooter.append(statusDot, statusText);

    body.append(tabContainer, hostPanel, joinPanel, statusFooter);

    const bottomAccent = createElement({ tagName: 'div', className: 'online-modal___accent' });
    modal.append(topAccent, header, body, bottomAccent);
    layer.appendChild(modal);
    root.appendChild(layer);

    // Socket Initialization
    const socket = socketService.connect();
    let currentRole = null;
    let currentCode = null;

    const updateConnectionStatus = isConnected => {
        if (isConnected) {
            statusDot.classList.add('online-modal___status-dot--connected');
            statusText.innerText = 'Online Server Connected (Ready)';
        } else {
            statusDot.classList.remove('online-modal___status-dot--connected');
            statusText.innerText = 'Connecting to server...';
        }
    };

    updateConnectionStatus(socket.connected);
    socket.on('connect', () => updateConnectionStatus(true));
    socket.on('disconnect', () => updateConnectionStatus(false));

    // Tab switching logic
    const switchTab = tab => {
        if (tab === 'host') {
            hostTabBtn.classList.add('online-modal___tab-btn--active');
            joinTabBtn.classList.remove('online-modal___tab-btn--active');
            hostPanel.style.display = 'flex';
            joinPanel.style.display = 'none';
        } else {
            joinTabBtn.classList.add('online-modal___tab-btn--active');
            hostTabBtn.classList.remove('online-modal___tab-btn--active');
            joinPanel.style.display = 'flex';
            hostPanel.style.display = 'none';
            codeInput.focus();
        }
    };

    hostTabBtn.addEventListener('click', () => switchTab('host'));
    joinTabBtn.addEventListener('click', () => switchTab('join'));

    // Check URL parameters for ?room=XYZ
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        switchTab('join');
        codeInput.value = roomParam.trim().toUpperCase();
    }

    // Host room action
    createBtn.addEventListener('click', () => {
        createBtn.disabled = true;
        createBtn.innerText = 'Creating Room...';
        socketService.createRoom();
    });

    socket.on('room-created', ({ roomCode, role }) => {
        currentCode = roomCode;
        currentRole = role;
        socketService.currentRoom = roomCode;
        socketService.role = role;
        createBtn.style.display = 'none';
        hostCodeSection.style.display = 'flex';
        codeDisplay.innerText = roomCode;
    });

    // Copy actions
    copyCodeBtn.addEventListener('click', async () => {
        if (!currentCode) return;
        try {
            await navigator.clipboard.writeText(currentCode);
            copyCodeBtn.innerHTML = '';
            copyCodeBtn.append(createIcon('check'), createElement({ tagName: 'span', innerText: 'Copied!' }));
            setTimeout(() => {
                copyCodeBtn.innerHTML = '';
                copyCodeBtn.append(createIcon('copy'), createElement({ tagName: 'span', innerText: 'Copy Code' }));
            }, 1800);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    });

    copyLinkBtn.addEventListener('click', async () => {
        if (!currentCode) return;
        const link = `${window.location.origin}${window.location.pathname}?room=${currentCode}`;
        try {
            await navigator.clipboard.writeText(link);
            copyLinkBtn.innerHTML = '';
            copyLinkBtn.append(createIcon('check'), createElement({ tagName: 'span', innerText: 'Link Copied!' }));
            setTimeout(() => {
                copyLinkBtn.innerHTML = '';
                copyLinkBtn.append(
                    createIcon('link'),
                    createElement({ tagName: 'span', innerText: 'Copy Invite Link' })
                );
            }, 1800);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    });

    // Join room action
    const handleJoin = () => {
        const enteredCode = codeInput.value.trim().toUpperCase();
        if (enteredCode.length < 3) {
            errorMsg.innerText = 'Please enter a valid room code.';
            errorMsg.style.display = 'block';
            return;
        }
        errorMsg.style.display = 'none';
        joinBtn.disabled = true;
        joinBtn.innerText = 'Joining...';
        socketService.joinRoom(enteredCode);
    };

    joinBtn.addEventListener('click', handleJoin);
    codeInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') handleJoin();
    });
    codeInput.addEventListener('input', () => {
        codeInput.value = codeInput.value.toUpperCase();
        errorMsg.style.display = 'none';
    });

    socket.on('room-joined', ({ roomCode, role }) => {
        currentCode = roomCode;
        currentRole = role;
        socketService.currentRoom = roomCode;
        socketService.role = role;
    });

    socket.on('room-error', message => {
        errorMsg.innerText = message;
        errorMsg.style.display = 'block';
        joinBtn.disabled = false;
        joinBtn.innerHTML = '';
        joinBtn.append(createIcon('swords'), createElement({ tagName: 'span', innerText: 'Join Match' }));
        createBtn.disabled = false;
        createBtn.innerText = 'Generate Room Code ⚡';
    });

    const cleanup = () => {
        socket.off('room-created');
        socket.off('room-joined');
        socket.off('room-ready');
        socket.off('room-error');
    };

    // When both players are in the room!
    socket.on('room-ready', ({ roomCode }) => {
        cleanup();
        layer.remove();
        if (typeof onRoomReady === 'function') {
            onRoomReady({
                roomCode,
                role: currentRole || socketService.role,
                socket
            });
        }
    });

    const closeModal = () => {
        cleanup();
        if (currentCode) {
            socketService.leaveRoom(currentCode);
        }
        layer.remove();
        if (typeof onCancel === 'function') {
            onCancel();
        }
    };

    closeBtn.addEventListener('click', closeModal);
}
