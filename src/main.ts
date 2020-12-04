//----------------------------------------------------------------------------------------------------------------------
// Notes:  The entry point of the project. Takes care of setting up the rendering loop, hotloading, and any other
//         boilerplate that is shared between projects.
//
// Author: Mike Lester
// Date C: 2020/11/25
//----------------------------------------------------------------------------------------------------------------------
import { Game } from './game';
import { GITHUB_REVISION_URL, IS_DEVELOPMENT } from './base/Version';
import { Profile } from './base/DebugProfiler';

//----------------------------------------------------------------------------------------------------------------------
// Global Types
//----------------------------------------------------------------------------------------------------------------------
declare global {
    interface Window {
        game: Game;
    }
}

//----------------------------------------------------------------------------------------------------------------------
// Main function
//----------------------------------------------------------------------------------------------------------------------
function main() {
    console.log( `Source for this build available at ${GITHUB_REVISION_URL}` );

    // Parse and apply URL parameters
    // See kUrlParameters for potential values
    const urlParams = new URLSearchParams( window.location.search );

    if( !IS_DEVELOPMENT ) {
        // Initialize Rollbar/Sentry for error reporting
    }

    // Start loading and running the game
    const game = new Game();
    window.game = game;

    game.initialize( urlParams );

    window.requestAnimationFrame( Update );
}

//----------------------------------------------------------------------------------------------------------------------
// Main Loop
//----------------------------------------------------------------------------------------------------------------------
function Update() {
    Profile.begin( 'FrameStart' );
    window.game.update();
    window.requestAnimationFrame( Update );
}

//----------------------------------------------------------------------------------------------------------------------
// Hotloading
//----------------------------------------------------------------------------------------------------------------------
if( IS_DEVELOPMENT ) {
    if( module.hot ) {
        // Register a callback that will fire when this module is unloaded (just before the new version is executed)
        module.hot.dispose( data => {
            window.game.hotUnload( data );
        } );

        // If we're currently hotloading, all the new modules have been executed, and the status is "apply"
        if( module.hot.status() === "apply" ) {
            window.game.hotLoad();
        }

        // @TODO: If a compile time error occurs, no more hot reloads are accepted. Need to investigate further.
        //        To repro, add garbage such as "fkl" to the end of Game.update(), then remove it.
        //
        //        I think this is caused by check() function being called too early. It's downloading the old bundle,
        //        before the new one has finished compiling. If noEmitOnErrors is true, it will fail with a 404. If
        //        false, it will first load the old bundle, then call check() again, which finally loads the correct
        //        new bundle. But if that old bundle contains an error, the program can crash on code that never
        //        should have been loaded (e.g. the "fkl" case above). This could be worked around by using a hotload
        //        shortcut rather than every save.
        module.hot.accept( error => {
            console.error( "Hotload failed:", error );
        } );
    }

    // Only call main if we're not hotloading
    if( !module.hot || module.hot.status() !== "apply" ) {
        main();
    }
}

if( !IS_DEVELOPMENT ) {
    main();
}
