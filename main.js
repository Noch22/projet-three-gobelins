import '@/style/app.css';
import WebglApp from '@/webgl';
import { io } from 'socket.io-client';
import QRCode from 'qrcode';
import { Howl } from 'howler';
import { WebHaptics } from 'web-haptics';

class App {
    constructor() {
        const uaDataMobile = navigator.userAgentData?.mobile;
        this.isMobile = uaDataMobile === true || /Android|iPhone|iPad|iPod|CriOS/i.test(navigator.userAgent);

        if (this.isMobile) document.body.classList.add('is-mobile');

        if (!this.isMobile) {
            this.webglApp = new WebglApp({
                isMobile: this.isMobile,
                onButtonPressed: (buttonPressed) => this.handleButtonPressed(buttonPressed),
                onAnimationComplete: () => this.handleAnimationComplete(),
            });
        }
        this.socket = io();
        this.roomCode = null;
        this.currentRoom = null;

        this.modeSelect = document.querySelector('#mode-select');
        this.startButton = document.querySelector('#start-button');
        this.startButtonMobile = document.querySelector('#start-button-mobile');
        this.qrCode = document.querySelector('#qr-code');
        this.roomStatus = document.querySelector('#room-status');
        this.modeDescription = document.querySelector('#mode-description');
        // document.getElementById('mobile-panel').style.display = 'flex';

        this.setupModes();
        this.setupEventListeners();
    }

    setupModes() {
        if (!this.webglApp) return;

        this.webglApp.sceneGlobal.jsonPromise.then((modes) => {
            this.modes = modes;
            this.modeSelect.innerHTML = modes
                .map(
                    (
                        mode,
                        index,
                    ) => `<option value="${index}"><div> <svg aria-hidden='true' viewBox='0 0 24 24' width='16' height='16'>
            <circle cx='12' cy='12' r='8' fill='${mode.color}' />
         </svg> <span>${mode.name}</span></div></option>`,
                )
                .join('');
            this.modeSelect.insertAdjacentHTML('afterbegin', '<button><selectedcontent></selectedcontent></button>');
            this.selectMode(0);
        });
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => {
            new Howl({
                src: ['/music.mp3'],
                autoplay: true,
                loop: true,
                volume: 2,
            });
            this.socket.emit('CREATE_ROOM');
        });

        this.startButtonMobile.addEventListener('click', () => {
            if (this.isMobile && this.currentRoom) {
                this.socket.emit('BUTTON_PRESSED');
            }

            const haptics = new WebHaptics();
            haptics.trigger([{ duration: 10000 }], { intensity: 1 });
        });

        this.modeSelect.addEventListener('change', (event) => {
            this.selectMode(Number(event.target.value));
            this.modeDescription.textContent = `Inspirez pendant ${this.modes?.[Number(event.target.value)]?.breath || ''} secondes. Expirez pendant ${this.modes?.[Number(event.target.value)]?.expire || ''} secondes. ${this.modes?.[Number(event.target.value)]?.brake ? `Faites une pause pendant ${this.modes?.[Number(event.target.value)]?.brake || ''} secondes.` : ''}`;
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

            // a remettre si on veut que le panel mobile s'affiche
            this.isMobile && (document.getElementById('mobile-panel').style.display = 'flex');
        });
        this.socket.on('START_ANIMATION', () => {
            const scene = this.webglApp?.sceneGlobal;
            if (scene && !scene.timeline.isActive()) scene.startAnimation();
        });
        this.socket.on('RESET_ROOM', () => {
            // window.location.replace(window.location.pathname);
        });
    }

    selectMode(index) {
        const mode = this.modes?.[index];
        if (!mode) return;

        this.webglApp.sceneGlobal.setMode(mode);
    }

    handleButtonPressed(buttonPressed) {
        if (this.isMobile && buttonPressed && this.currentRoom) {
            this.socket.emit('BUTTON_PRESSED');
        }
    }

    handleAnimationComplete() {
        if (this.currentRoom) {
            this.socket.emit('ANIMATION_COMPLETE');
            document.body.classList.remove('is-experience-active', 'has-room');
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
}

new App();
