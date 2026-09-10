import createFighters from './components/fightersView';
import fighterService from './services/fightersService';
import { preloadAllAssets } from './helpers/assetPreloader';

class App {
    static rootElement = document.getElementById('root');

    static loadingElement = document.getElementById('loading-backdrop');

    static async startApplication(isRestart = false) {
        const progressBar = document.getElementById('loading-progress-bar');
        const statusText = document.getElementById('loading-status-text');

        if (App.loadingElement) {
            App.loadingElement.style.display = 'flex';
            App.loadingElement.classList.remove('loading-backdrop--hidden');
        }

        if (isRestart) {
            try {
                if (statusText) statusText.textContent = 'Returning to Champion Selection...';
                if (progressBar) progressBar.style.width = '100%';
                const fighters = await fighterService.getFighters();
                const fightersElement = createFighters(fighters);
                App.rootElement.innerHTML = '';
                App.rootElement.appendChild(fightersElement);
                await new Promise(resolve => {
                    setTimeout(resolve, 350);
                });
            } catch (error) {
                console.warn(error);
            } finally {
                if (App.loadingElement) {
                    App.loadingElement.classList.add('loading-backdrop--hidden');
                    setTimeout(() => {
                        App.loadingElement.style.display = 'none';
                    }, 650);
                }
            }
            return;
        }

        const stages = [
            { text: 'We are looking for the best fighters...', progress: 28, pause: 600 },
            { text: 'Preparing battle arenas & battlegrounds...', progress: 62, pause: 650 },
            { text: 'Sharpening weapons & charging combat cores...', progress: 88, pause: 650 },
            { text: 'Arenas ready! Entering Arena Clash...', progress: 100, pause: 500 }
        ];

        const typeText = async (text, speed = 16) => {
            if (!statusText) return;
            statusText.textContent = '';
            for (let i = 0; i < text.length; i += 1) {
                statusText.textContent += text[i];
                // eslint-disable-next-line no-await-in-loop
                await new Promise(resolve => {
                    setTimeout(resolve, speed);
                });
            }
        };

        const playSteps = async () => {
            for (let i = 0; i < stages.length; i += 1) {
                const stage = stages[i];
                if (progressBar) {
                    progressBar.style.width = `${stage.progress}%`;
                }
                // eslint-disable-next-line no-await-in-loop
                await typeText(stage.text, 16);
                // eslint-disable-next-line no-await-in-loop
                await new Promise(resolve => {
                    setTimeout(resolve, stage.pause);
                });
            }
        };

        try {
            App.rootElement.innerHTML = '';

            const [fighters] = await Promise.all([fighterService.getFighters(), preloadAllAssets(), playSteps()]);

            const fightersElement = createFighters(fighters);
            App.rootElement.appendChild(fightersElement);
        } catch (error) {
            console.warn(error);
            App.rootElement.innerText = 'Failed to load data';
        } finally {
            if (App.loadingElement) {
                App.loadingElement.classList.add('loading-backdrop--hidden');
                setTimeout(() => {
                    App.loadingElement.style.display = 'none';
                }, 650);
            }
        }
    }
}

window.addEventListener('new-fight', () => {
    App.startApplication(true);
});

export default App;
