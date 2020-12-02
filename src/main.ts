import { Game } from './game';
import { GITHUB_REVISION_URL, IS_DEVELOPMENT } from './base/Version';
import { Profile } from './base/DebugProfiler';

// Declare useful objects for easy access.
declare global {
    interface Window {
        game: Game;
    }
}

/**
 * All accepted URL parameters are documented here.
 * E.g. The URL 'http://myPublishUrl.io?debug' will show the debug menu
 */
const kUrlParameters: Record<string, ( game: Game, value: string ) => void> = {
    'debug': ( game: Game ) => game.debugMenu.show(),
}

function main() {
    console.log( `Source for this build available at ${GITHUB_REVISION_URL}` );

    if( !IS_DEVELOPMENT ) {
        // Initialize Rollbar/Sentry for error reporting
    }

    // Start loading and running the game
    const game = new Game();
    window.game = game;

    game.initialize();

    // Parse and apply URL parameters
    // See kUrlParameters for potential values
    const urlParams = new URLSearchParams( window.location.search );
    urlParams.forEach( ( value: string, key: string ) => {
        const func = kUrlParameters[ key ];
        if( func ) { func( game, value ); }
    } );

    window.requestAnimationFrame( Update );
}

function Update() {
    Profile.begin( 'FrameStart' );
    window.game.update();
    window.requestAnimationFrame( Update );
}

if( module.hot ) {
    // @TODO: If a compile time error occurs, no more hot reloads are accepted. Need to investigate further.
    //        To repro, add garbage such as "fkl" to the end of Game.update(), then remove it.
    //        [Edit] I think this is caused by check() function being called too early. It's downloading the old bundle,
    //               before the new one has finished compiling. If noEmitOnErrors is true, it will fail with a 404. If
    //               false, it will first load the old bundle, then call check() again, which finally loads the correct
    //               new bundle. But if that old bundle contains an error, the program can crash on code that never
    //               should have been loaded (e.g. the "fkl" case above). This could be worked around by using a hotload
    //               shortcut rather than every save.
    module.hot.accept( [ "./game" ], () => {
        console.log( "Hotloaded" );
        window.game.hotload();
    } );
}

main();
