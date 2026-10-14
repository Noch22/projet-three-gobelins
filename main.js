import '@/style/app.scss';
import WebglApp from '@/webgl';

const homeScreen = document.querySelector('#home-screen');
const startButton = document.querySelector('#start-button');

let webglApp = null;

startButton.addEventListener('click', () => {
    document.body.classList.add('is-experience-active');

    webglApp = new WebglApp();
});
