import { Game } from './game';
import { GITHUB_REVISION_URL, IS_DEVELOPMENT} from './base/version';

// Google Analytics
declare var gtag: (command: string, eventName: string, eventParameters: { [key: string]: string }) => void;

// Declare useful objects for easy access.
declare global {
    interface Window {
        game: any;
        debug: any;
        config: any;
    }
}

/**
 * All accepted URL parameters are documented here. 
 * E.g. The URL 'moonduel.io?debug' will show the debug menu
 */
const kUrlParameters: Record<string, (game: Game, value: any) => void> = {
    // 'debug': (game: Game) => game.debugMenu.show(),
}

function Main() {
    console.log(`Source for this build available at ${GITHUB_REVISION_URL}`);

    // Start loading and running the game
    const game = new Game();
    window.game = game;
    
    // Parse and apply URL parameters
    // See kUrlParameters for potential values
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value: string, key: string) => {
        const func = kUrlParameters[key];
        if (func) func(game, value);
    });
    
    game.initialize();
}

Main();
