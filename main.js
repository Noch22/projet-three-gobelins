import '@/style/app.scss';
import WebglApp from '@/webgl';
import { io } from 'socket.io-client';
import QRCode from 'qrcode';
import { Howl, Howler } from 'howler';
import { WebHaptics } from 'web-haptics';
import eruda from 'eruda';

if (new URLSearchParams(window.location.search).has('debug')) {
    eruda.init();
}

class App {
    constructor() {
        const uaDataMobile = navigator.userAgentData?.mobile;
        this.isMobile =
            typeof uaDataMobile === 'boolean' ? uaDataMobile : /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        this.webglApp = new WebglApp({
            isMobile: this.isMobile,
            onButtonPressed: (buttonPressed) => this.handleButtonPressed(buttonPressed),
        });
        this.socket = io();
        this.roomCode = null;
        this.currentRoom = null;

        this.modeSelect = document.querySelector('#mode-select');
        this.startButton = document.querySelector('#start-button');
        this.startButtonMobile = document.querySelector('#start-button-mobile');
        this.qrCode = document.querySelector('#qr-code');
        this.roomStatus = document.querySelector('#room-status');

        this.setupModes();
        this.setupEventListeners();

        if (this.isMobile) document.body.classList.add('is-mobile');
    }

    setupModes() {
        this.webglApp.sceneGlobal.jsonPromise.then((modes) => {
            this.modes = modes;
            this.modeSelect.innerHTML = modes
                .map((mode, index) => `<option value="${index}">${mode.name}</option>`)
                .join('');
            this.selectMode(0);
        });
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => {
            var sound = new Howl({
                src: ['/music.mp3'],
                autoplay: true,
                loop: true,
                volume: 2,
            });
            this.socket.emit('CREATE_ROOM');
        });

        this.modeSelect.addEventListener('change', (event) => {
            this.selectMode(Number(event.target.value));
        });

        this.socket.on('connect', () => this.handleSocketConnection());
        this.socket.on('ROOM_CREATED', (data) => this.handleRoomCreated(data));
        this.socket.on('PLAYER_JOINED', ({ message }) => {
            this.roomStatus.textContent = message;
        });
        this.socket.on('READY_TO_START', ({ message }) => {
            this.roomStatus.textContent = message;
            document.body.classList.add('is-experience-active', 'has-room');
            document.getElementById('mobile-screen').style.display = 'none';
        });
        this.socket.on('START_ANIMATION', () => {
            this.webglApp.sceneGlobal.startAnimation();
        });
    }

    selectMode(index) {
        const mode = this.modes?.[index];
        if (!mode) return;

        this.webglApp.sceneGlobal.setMode(mode);
        console.log('Mode changed:', mode);
    }

    handleButtonPressed(buttonPressed) {
        console.log('Button pressed:', buttonPressed);

        if (this.isMobile && buttonPressed && this.currentRoom) {
            this.socket.emit('BUTTON_PRESSED');
        }
    }

    handleSocketConnection() {
        this.socket.emit('CONNECT', this.isMobile);

        const roomFromUrl = new URLSearchParams(window.location.search).get('room');
        if (this.isMobile && roomFromUrl) {
            this.currentRoom = roomFromUrl.toUpperCase();
            this.roomStatus.textContent = `Connexion a la room ${this.currentRoom}...`;
            this.socket.emit('JOIN_ROOM', this.currentRoom);
        }
    }

    async handleRoomCreated({ roomCode }) {
        this.roomCode = roomCode;
        this.currentRoom = roomCode;
        document.body.classList.add('has-room');

        const roomUrl = new URL(window.location.href);
        roomUrl.searchParams.set('room', roomCode);
        await QRCode.toCanvas(this.qrCode, roomUrl.toString(), { width: 240, margin: 2 });

        this.roomStatus.textContent = `Room ${roomCode} - scannez le QR code avec votre mobile`;
    }

    handleButtonMobileClick() {
        const haptics = new WebHaptics();
        this.startButtonMobile.addEventListener('click', () => haptics.trigger());
    }
}

new App();
