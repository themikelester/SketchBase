//----------------------------------------------------------------------------------------------------------------------
// Notes: Input system which aggregates events from Mouse, Keyboard, Touch, and Gamepad.
//
// Author: Mike Lester
// Date C: 2020/12/08
//----------------------------------------------------------------------------------------------------------------------
import screenfull, { Screenfull } from "screenfull";
import { Keyboard } from "./InputKeyboard";
import { Mouse } from "./InputMouse";
import { TouchDevice } from "./InputTouch";
import { metaFunc } from "./Meta";

//----------------------------------------------------------------------------------------------------------------------
// InputManager
//----------------------------------------------------------------------------------------------------------------------
export class InputManager {
    public mouse: Mouse;
    public keyboard: Keyboard;
    public touch: TouchDevice;

    @metaFunc initialize( rootElement: HTMLElement ): void {
        this.mouse = new Mouse( rootElement );
        this.touch = new TouchDevice( rootElement );

        // Keyboard listeners only work on <div> elements if they have a tabindex set.
        // It makes more sense to capture keys for the whole window, at least for now.
        this.keyboard = new Keyboard( window );

        // Clear all key presses when the root element loses focus
        // E.g. while holding 'w' to run forward in a game, pressing Cmd+D while open the bookmark dialog.
        // Without this, the character will continue to run forward until you refocus the window and re-release the keys
        window.addEventListener( 'blur', () => {
            this.keyboard.clear();
        } );

        // Clear all key presses when entering or exiting fullscreen
        // The listeners stop firing during this time, so we can miss a keyup and the key will appear to be stuck
        if( screenfull.isEnabled ) {
            ( screenfull as Screenfull ).onchange( () => {
                this.keyboard.clear();
            } );
        }

        // Disable the context menu
        this.mouse.disableContextMenu();
    }

    @metaFunc endFrame(): void {
        this.mouse.update();
        this.keyboard.update();
    }
}