import { IS_DEVELOPMENT } from './base/Version';
import { DebugMenu } from './base/DebugMenu';
import { MetaVar } from './base/Meta';
import { Renderer } from './base/gfx/GfxTypes';
import { WebGlRenderer } from './base/gfx/WebGl';

export class Game {
    @MetaVar public rootElement: HTMLElement;
    @MetaVar public canvas: HTMLCanvasElement = document.createElement( 'canvas' );
    @MetaVar public gfxDevice: Renderer = new WebGlRenderer();
    
    @MetaVar public debugMenu: DebugMenu = new DebugMenu();

    public initialize(): void {
        // DOM creation
        this.rootElement = document.createElement( 'div' );
        document.body.appendChild( this.rootElement );
        this.rootElement.appendChild( this.canvas );

        // Graphics initialization
        this.gfxDevice.setDebugEnabled( IS_DEVELOPMENT );
        const success = this.gfxDevice.initialize( this.canvas );
        if ( success ) this.gfxDevice.resize( this.canvas.width, this.canvas.height );
        else return; // @TODO: FatalError function. Displays a fullscreen error message a la Ayvri
        this.onResize();

        // Events
        window.onresize = this.onResize.bind( this );
        window.onbeforeunload = this.onUnload.bind( this );
        window.onclick = this.onClick.bind( this );
        document.onvisibilitychange = this.onVisibility.bind( this );

        // Show debug menu by default on development builds
        if ( IS_DEVELOPMENT ) {
            this.debugMenu.show();
        }
    }

    public update(): void {
        this.debugMenu.update();
    }

    /**
     * Fires when the mouse is clicked within the window (duh)
     */
    private onClick( e: MouseEvent ) {
        console.log( "Mouse clicked at (" + e.x + ", " + e.y + ")" );
    }

    /**
     * Fires when the main body of the window is resized (including bringing up dev tools)
     */
    private onResize() {
        console.log( "Window resized to (" + window.innerWidth + ", " + window.innerHeight + ")" );
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Fires when the window becomes hidden (minimized or obscured by another window), or visible again
     */
    private onVisibility() {
        const hidden = document.hidden;
        console.log( hidden ? "Window hidden" : "Window visible" );
    }

    /**
     * Fires just before the page is unloaded. The user is either navigating away, or closing the window.
     */
    private onUnload() {
        console.log( "Unloading" );
    }
}