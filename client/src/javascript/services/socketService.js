import { io } from 'socket.io-client';

class SocketService {
    socket = null;

    currentRoom = null;

    role = null; // 'host' | 'guest'

    connect() {
        if (this.socket && this.socket.connected) {
            return this.socket;
        }

        const isDevVite = window.location.port === '7800';
        const serverUrl = isDevVite ? 'http://localhost:3000' : undefined;

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            timeout: 10000
        });

        return this.socket;
    }

    getSocket() {
        if (!this.socket) {
            return this.connect();
        }
        return this.socket;
    }

    createRoom() {
        const socket = this.getSocket();
        socket.emit('create-room');
    }

    joinRoom(roomCode) {
        const socket = this.getSocket();
        socket.emit('join-room', roomCode);
    }

    selectFighter(roomCode, fighter, role) {
        const socket = this.getSocket();
        socket.emit('select-fighter', { roomCode, fighter, role });
    }

    setPlayerReady(roomCode, role) {
        const socket = this.getSocket();
        socket.emit('player-ready', { roomCode, role });
    }

    sendInput(roomCode, inputData) {
        if (!this.socket) return;
        this.socket.emit('player-input', { roomCode, ...inputData });
    }

    sendSyncState(roomCode, stateData) {
        if (!this.socket) return;
        this.socket.emit('sync-state', { roomCode, state: stateData });
    }

    requestRematch(roomCode, role) {
        if (!this.socket) return;
        this.socket.emit('rematch', { roomCode, role });
    }

    leaveRoom(roomCode) {
        if (!this.socket) return;
        this.socket.emit('leave-room', { roomCode });
        this.currentRoom = null;
        this.role = null;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.currentRoom = null;
            this.role = null;
        }
    }
}

const socketService = new SocketService();
export default socketService;
