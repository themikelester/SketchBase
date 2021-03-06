//----------------------------------------------------------------------------------------------------------------------
// Notes: Low-level listener for keyboard events. This is the only class that should be making addEventListener calls.
//        Any module that needs mouse events should subscribe to events from this class.
//
//        // Subscribe to an event:
//        keyboard.on( 'keydown', e => {
//          console.log('event fired', e);
//        });
//
//        Based on the input system from PlayCanvas. See https://github.com/playcanvas/engine
//
// Author: Mike Lester
// Date C: 2020/12/08
//----------------------------------------------------------------------------------------------------------------------
import { EventDispatcher } from "./EventDispatcher";
import { defaultValue } from "./Util";

//----------------------------------------------------------------------------------------------------------------------
// Types
//----------------------------------------------------------------------------------------------------------------------
export interface KeyboardOptions {
    preventDefault?: boolean;
    stopPropagation?: boolean;
}

//----------------------------------------------------------------------------------------------------------------------
// Keyboard
//----------------------------------------------------------------------------------------------------------------------
/**
 * @augments pc.EventHandler
 * @classdesc A Keyboard device bound to an Element. Allows you to detect the state of the key presses.
 * Note, Keyboard object must be attached to an Element before it can detect any key presses.
 * Create a new Keyboard object.
 * @param {Element|Window} [element] - Element to attach Keyboard to. Note that elements like <div> can't
 * accept focus by default. To use keyboard events on an element like this it must have a value of 'tabindex'
 * e.g. tabindex="0". For more details: <a href="http://www.w3.org/WAI/GL/WCAG20/WD-WCAG20-TECHS/SCR29.html">
 * http://www.w3.org/WAI/GL/WCAG20/WD-WCAG20-TECHS/SCR29.html</a>.
 * @param {object} [options] - Optional options object.
 * @param {boolean} [options.preventDefault] - Call preventDefault() in key event handlers. This stops the default
 * action of the event occurring. e.g. Ctrl+T will not open a new browser tab
 * @param {boolean} [options.stopPropagation] - Call stopPropagation() in key event handlers. This stops the event
 * bubbling up the DOM so no parent handlers will be notified of the event
 * @example
 * var keyboard = new pc.Keyboard(window); // attach keyboard listeners to the window
 */
export class Keyboard extends EventDispatcher {
    private element?: Element | Window;

    private handleKeyDown: ( e: Event ) => void;
    private handleKeyUp: ( e: Event ) => void;

    private preventDefault: boolean;
    private stopPropagation: boolean;

    // Tri-state. undefined = not pressed, false = pressed but not this frame, true = pressed this frame.
    private keysDown: Map<string, boolean> = new Map();

    constructor( element: Element | Window, options: KeyboardOptions = {} ) {
        super();

        this.handleKeyDown = this.onKeyDown.bind( this );
        this.handleKeyUp = this.onKeyUp.bind( this );

        this.attach( element );

        this.preventDefault = defaultValue( options.preventDefault, false );
        this.stopPropagation = defaultValue( options.stopPropagation, false );
    }


    /**
     * Attach the keyboard event handlers to an Element.
     * @param {Element} element - The element to listen for keyboard events on.
     */
    attach( element: Element | Window ): void {
        if( this.element ) {
            // remove previous attached element
            this.detach();
        }
        this.element = element;
        this.element.addEventListener( "keydown", this.handleKeyDown, false );
        this.element.addEventListener( "keyup", this.handleKeyUp, false );
    }

    /**
     * Detach the keyboard event handlers from the element it is attached to.
     */
    detach(): void {
        if( this.element ) {
            this.element.removeEventListener( "keydown", this.handleKeyDown );
            this.element.removeEventListener( "keyup", this.handleKeyUp );
            this.element = undefined;
        }
    }

    private onKeyDown( event: KeyboardEvent ): void {
        const code = event.code;

        // If the user is holding down the key, ignore subsequent events
        if( event.repeat ) { return; }

        // Google Chrome auto-filling of login forms could raise a malformed event
        if( code === undefined ) { return; }

        this.keysDown.set( code, true );

        this.fire( "keydown", event );

        if( this.preventDefault ) {
            event.preventDefault();
        }
        if( this.stopPropagation ) {
            event.stopPropagation();
        }
    }

    private onKeyUp( event: KeyboardEvent ): void {
        const code = event.code;

        // Google Chrome auto-filling of login forms could raise a malformed event
        if( code === undefined ) { return; }

        this.keysDown.delete( code );

        this.fire( "keyup", event );

        if( this.preventDefault ) {
            event.preventDefault();
        }
        if( this.stopPropagation ) {
            event.stopPropagation();
        }
    }

    /**
     * Called once per frame to update internal state.
     */
    update(): void {
        this.keysDown.forEach( ( v, k ) => {
            this.keysDown.set( k, false );
        } );
    }

    /**
     * Return true if the key is currently down.
     * @param {number} key - The key code. See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
     * @returns {boolean} True if the key was pressed, false if not.
     */
    isPressed( key: string ): boolean {
        return this.keysDown.has( key );
    }

    /**
     * Returns true if the key was pressed since the last update.
     * @param {number} key - The key code. See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
     * @returns {boolean} True if the key was pressed this frame, but not last frame.
     */
    wasPressed( key: string ): boolean {
        return !!this.keysDown.get( key );
    }

    clear(): void {
        this.fire( "clear", event );
        this.keysDown.clear();
    }
}