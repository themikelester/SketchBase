//----------------------------------------------------------------------------------------------------------------------
// Notes: Low-level listener for mouse events. This is the only class that should be making addEventListener calls. Any
//        module that needs mouse events should subscribe to events from this class.
//
//        // Subscribe to an event:
//        mouse.on( 'mousedown', e => {
//          console.log('event fired', e);
//        });
//
//        Based on the input system from PlayCanvas. See https://github.com/playcanvas/engine
//
// Author: Mike Lester
// Date C: 2020/12/08
//----------------------------------------------------------------------------------------------------------------------
import { assert, assertDefined, defined } from "./Util";
import { EventDispatcher } from "./EventDispatcher";

//----------------------------------------------------------------------------------------------------------------------
// Types
//----------------------------------------------------------------------------------------------------------------------
export interface MouseCoords {
    x: number,
    y: number,
}

export enum MouseButtons {
    Left = 0,
    Middle = 1,
    Right = 2,
}

export enum MouseEvents {
    MouseUp = 'mouseup',
    MouseDown = 'mousedown',
    MouseMove = 'mousemove',
    MouseWheel = 'mousewheel',
}

//----------------------------------------------------------------------------------------------------------------------
// Constants
//----------------------------------------------------------------------------------------------------------------------
const kListenerOptions: AddEventListenerOptions = {
    passive: false,
    capture: false,
};

//----------------------------------------------------------------------------------------------------------------------
// MouseEventWrapper
//----------------------------------------------------------------------------------------------------------------------
/**
 * MouseEvent object that is passed to events 'mousemove', 'mouseup', 'mousedown' and 'mousewheel'.
 * @param {Mouse} mouse - The Mouse device that is firing this event.
 * @param {MouseEvent} event - The original browser event that fired.
 * @property {number} x The x co-ordinate of the mouse pointer relative to the element Mouse is attached to.
 * @property {number} y The y co-ordinate of the mouse pointer relative to the element Mouse is attached to.
 * @property {number} dx The change in x co-ordinate since the last mouse event.
 * @property {number} dy The change in y co-ordinate since the last mouse event.
 * @property {number} button The mouse button associated with this event. Corresponds to the MouseButtons enum.
 * @property {boolean[]} buttons All mouse buttons pressed during this event.
 * @property {number} wheelDelta A value representing the amount the mouse wheel has moved, only
 * valid for {@link mousewheel} events.
 * @property {Element} element The element that the mouse was fired from.
 * @property {boolean} ctrlKey True if the ctrl key was pressed when this event was fired.
 * @property {boolean} shiftKey True if the shift key was pressed when this event was fired.
 * @property {boolean} altKey True if the alt key was pressed when this event was fired.
 * @property {boolean} metaKey True if the meta key was pressed when this event was fired.
 * @property {MouseEvent} event The original browser event.
 */
export class MouseEventWrapper {
    public x: number;
    public y: number;
    public dx: number;
    public dy: number;

    public ctrlKey: boolean;
    public shiftKey: boolean;
    public altKey: boolean;
    public metaKey: boolean;
    public buttons: boolean[];

    public element: EventTarget | null;
    public event: MouseEvent;

    public button?: number;
    public wheelDelta?: number;

    constructor( mouse: Mouse, event: MouseEvent | WheelEvent ) {
        assertDefined( event );
        assert( event instanceof MouseEvent, 'Expected MouseEvent' );

        const coords = mouse._getTargetCoords( event );

        if( coords ) {
            this.x = coords.x;
            this.y = coords.y;
        } else if( Mouse.isPointerLocked() ) {
            this.x = 0;
            this.y = 0;
        } else {
            return;
        }

        // deltaY is in a different range across different browsers. The only thing
        // that is consistent is the sign of the value so snap to -1/+1.
        this.wheelDelta = 0;
        if( event.type === 'wheel' ) {
            const wheelEvent = event as WheelEvent;
            if( wheelEvent.deltaY > 0 ) {
                this.wheelDelta = 1;
            } else if( wheelEvent.deltaY < 0 ) {
                this.wheelDelta = -1;
            }
        }

        // Get the movement delta in this event
        if( Mouse.isPointerLocked() ) {
            this.dx = event.movementX || 0;
            this.dy = event.movementY || 0;
        } else {
            this.dx = this.x - mouse._lastX;
            this.dy = this.y - mouse._lastY;
        }

        if( event.type === 'mousedown' || event.type === 'mouseup' ) {
            this.button = event.button;
        }

        this.buttons = mouse._buttons.slice( 0 );
        this.element = event.target;

        this.ctrlKey = event.ctrlKey || false;
        this.altKey = event.altKey || false;
        this.shiftKey = event.shiftKey || false;
        this.metaKey = event.metaKey || false;

        this.event = event;
    }
}

//----------------------------------------------------------------------------------------------------------------------
// Mouse
//----------------------------------------------------------------------------------------------------------------------
/**
 * @class
 * @name Mouse
 * @augments EventHandler
 * @classdesc A Mouse Device, bound to a DOM Element.
 * @description Create a new Mouse device.
 * @param {Element} [element] - The Element that the mouse events are attached to.
 */
export class Mouse extends EventDispatcher {
    public _buttons: boolean[];

    public _lastX: number;
    public _lastY: number;
    public _lastButtons: boolean[];

    private target: Nullable<Element>;
    private attached = false;

    private onUp: ( e: Event ) => void;
    private onDown: ( e: Event ) => void;
    private onMove: ( e: Event ) => void;
    private onWheel: ( e: Event ) => void;
    private onContextMenu: ( e: Event ) => void;


    constructor( element: Element ) {
        super();

        // Clear the mouse state
        this._lastX = 0;
        this._lastY = 0;
        this._buttons = [ false, false, false ];
        this._lastButtons = [ false, false, false ];

        // Setup event handlers so they are bound to the correct 'this'
        this.onUp = this.handleUp.bind( this );
        this.onDown = this.handleDown.bind( this );
        this.onMove = this.handleMove.bind( this );
        this.onWheel = this.handleWheel.bind( this );
        this.onContextMenu = ( e: Event ) => { e.preventDefault(); };

        this.attach( element );
    }

    /**
     * Check if the mouse pointer has been locked, using {@link Mouse#enabledPointerLock}.
     * @returns {boolean} True if locked.
     */
    static isPointerLocked(): boolean {
        return !!document.pointerLockElement;
    }

    /**
     * @function
     * @name Mouse#attach
     * @description Attach mouse events to an Element.
     * @param {Element} element - The DOM element to attach the mouse to.
     */
    attach( element: Element ): void {
        this.target = element;

        if( this.attached ) { return; }
        this.attached = true;

        window.addEventListener( "mouseup", this.onUp, kListenerOptions );
        window.addEventListener( "mousedown", this.onDown, kListenerOptions );
        window.addEventListener( "mousemove", this.onMove, kListenerOptions );
        window.addEventListener( "wheel", this.onWheel, kListenerOptions );
    }

    /**
     * @function
     * @name Mouse#detach
     * @description Remove mouse events from the element that it is attached to.
     */
    detach(): void {
        if( !this.attached ) { return; }
        this.attached = false;
        this.target = null;

        window.removeEventListener( "mouseup", this.onUp, kListenerOptions );
        window.removeEventListener( "mousedown", this.onDown, kListenerOptions );
        window.removeEventListener( "mousemove", this.onMove, kListenerOptions );
        window.removeEventListener( "wheel", this.onWheel, kListenerOptions );
    }

    /**
     * @function
     * @name Mouse#disableContextMenu
     * @description Disable the context menu usually activated with right-click.
     */
    disableContextMenu(): void {
        if( !this.target ) { return; }
        this.target.addEventListener( "contextmenu", this.onContextMenu );
    }

    /**
     * @function
     * @name Mouse#enableContextMenu
     * @description Enable the context menu usually activated with right-click. This option is active by default.
     */
    enableContextMenu(): void {
        if( !this.target ) { return; }
        this.target.removeEventListener( "contextmenu", this.onContextMenu );
    }

    /**
     * @function
     * @name Mouse#enablePointerLock
     * @description Request that the browser hides the mouse cursor and locks the mouse to the element.
     * Allowing raw access to mouse movement input without risking the mouse exiting the element.
     * Notes:
     *
     * * In some browsers this only works in fullscreen mode. See {@link Application#enableFullscreen}
     * * Pointer lock can only be initiated by a user action e.g. in the event handler for a mouse or keyboard input.
     *
     * @param {callbacks.LockMouse} [success] - Function called if the request for mouse lock is successful.
     * @param {callbacks.LockMouse} [error] - Function called if the request for mouse lock is unsuccessful.
     */
    enablePointerLock( success: () => void, error: () => void ): void {
        if( !document.body.requestPointerLock ) {
            if( error )
                { error(); }

            return;
        }

        if( success ) {
            const s = () => {
                success();
                document.removeEventListener( 'pointerlockchange', s );
            };
            document.addEventListener( 'pointerlockchange', s, false );
        }

        if( error ) {
            const e = () => {
                error();
                document.removeEventListener( 'pointerlockerror', e );
            };
            document.addEventListener( 'pointerlockerror', e, false );
        }

        document.body.requestPointerLock();
    }

    /**
     * @function
     * @name Mouse#disablePointerLock
     * @description Return control of the mouse cursor to the user.
     * @param {callbacks.LockMouse} [success] - Function called when the mouse lock is disabled.
     */
    disablePointerLock( success?: () => void ): void {
        if( !document.exitPointerLock ) {
            return;
        }

        if( defined( success ) ) {
            const s = () => {
                success();
                document.removeEventListener( 'pointerlockchange', s );
            };
            document.addEventListener( 'pointerlockchange', s, false );
        }
        document.exitPointerLock();
    }

    /**
     * @function
     * @name Mouse#update
     * @description Update method, should be called once per frame.
     */
    update(): void {
        // Copy current button state
        this._lastButtons[ 0 ] = this._buttons[ 0 ];
        this._lastButtons[ 1 ] = this._buttons[ 1 ];
        this._lastButtons[ 2 ] = this._buttons[ 2 ];
    }

    /**
     * @function
     * @name Mouse#isPressed
     * @description Returns true if the mouse button is currently pressed.
     * @returns {boolean} True if the mouse button is current pressed.
     */
    isPressed( button: MouseButtons ): boolean {
        return this._buttons[ button ];
    }

    /**
     * @function
     * @name Mouse#wasPressed
     * @description Returns true if the mouse button was pressed this frame (since the last call to update).
     * @returns {boolean} True if the mouse button was pressed since the last update.
     */
    wasPressed( button: MouseButtons ): boolean {
        return ( this._buttons[ button ] && !this._lastButtons[ button ] );
    }

    /**
     * @function
     * @name Mouse#wasReleased
     * @description Returns true if the mouse button was released this frame (since the last call to update).
     * @returns {boolean} True if the mouse button was released since the last update.
     */
    wasReleased( button: MouseButtons ): boolean {
        return ( !this._buttons[ button ] && this._lastButtons[ button ] );
    }

    handleUp( event: MouseEvent ): void {
        // disable released button
        this._buttons[ event.button ] = false;

        const e = new MouseEventWrapper( this, event );
        if( !e.event ) { return; }

        // send 'mouseup' event
        this.fire( MouseEvents.MouseUp, e );
    }

    handleDown( event: MouseEvent ): void {
        // Store which button has affected
        this._buttons[ event.button ] = true;

        const e = new MouseEventWrapper( this, event );
        if( !e.event ) { return; }

        this.fire( MouseEvents.MouseDown, e );
    }

    handleMove( event: MouseEvent ): void {
        const e = new MouseEventWrapper( this, event );
        if( !e.event ) { return; }

        this.fire( MouseEvents.MouseMove, e );

        // Store the last offset position to calculate deltas
        this._lastX = e.x;
        this._lastY = e.y;
    }

    handleWheel( event: MouseEvent ): void {
        const e = new MouseEventWrapper( this, event );
        if( !e.event ) { return; }

        this.fire( MouseEvents.MouseWheel, e );
    }

    _getTargetCoords( event: MouseEvent ): Nullable<MouseCoords> {
        const target = assertDefined( this.target );
        const rect = target.getBoundingClientRect();
        const left = Math.floor( rect.left );
        const top = Math.floor( rect.top );

        // mouse is outside of canvas
        if( event.clientX < left ||
            event.clientX >= left + target.clientWidth ||
            event.clientY < top ||
            event.clientY >= top + target.clientHeight ) {

            return null;
        }

        return {
            x: event.clientX - left,
            y: event.clientY - top
        };
    }
}