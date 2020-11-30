import { Camera } from './base/Camera';
import { DebugGrid } from './base/DebugGrid';
import { IS_DEVELOPMENT } from './base/Version';
import { DebugMenu } from './base/DebugMenu';
import { MetaVar } from './base/Meta';
import { WebGlRenderer } from './base/GfxApiWebGl';
import { Module, ModuleBarn, ModuleDirection } from './base/Module';
import { Renderer } from './base/GfxApiTypes';

import { Compositor } from './base/GfxCompositor';
import { Scene } from './scene';
import { GlobalUniforms } from './base/GfxGlobalUniforms';

import { mat4, vec3 } from 'gl-matrix';

export class Game {
    @MetaVar rootElement: HTMLElement;
    @MetaVar canvas: HTMLCanvasElement = document.createElement( 'canvas' );
    @MetaVar camera: Camera = new Camera();
    @MetaVar gfxDevice: Renderer = new WebGlRenderer();
    @MetaVar debugMenu: DebugMenu = new DebugMenu();

    moduleBarn: ModuleBarn = new ModuleBarn();
    @Module scene: Scene = new Scene();
    @Module compositor: Compositor = new Compositor();
    @Module globalUniforms: GlobalUniforms = new GlobalUniforms();
    @Module debugGrid: DebugGrid = new DebugGrid();

    public initialize(): void {
        // DOM creation
        this.rootElement = document.createElement( 'div' );
        document.body.appendChild( this.rootElement );
        this.rootElement.appendChild( this.canvas );
        this.canvas.width

        // Graphics initialization
        this.gfxDevice.setDebugEnabled( IS_DEVELOPMENT );
        const success = this.gfxDevice.initialize( this.canvas );
        if( success ) { this.gfxDevice.resize( this.canvas.width, this.canvas.height ); }
        else { return; } // @TODO: FatalError function. Displays a fullscreen error message a la Ayvri
        this.onResize();

        // Register for Events
        window.onresize = this.onResize.bind( this );
        window.onbeforeunload = this.onUnload.bind( this );
        window.onclick = this.onClick.bind( this );
        document.onvisibilitychange = this.onVisibility.bind( this );

        // Show debug menu by default on development builds
        if( IS_DEVELOPMENT ) {
            this.debugMenu.show();
        }

        // Initialize the module barn
        const kModuleFunctions = [
            "initialize",
            "terminate",
            "hotload",
            "update",
            "render",
        ];
        this.moduleBarn.initialize( this, kModuleFunctions );

        // Call "Initialize()" for all modules
        this.moduleBarn.callFunction( "initialize", ModuleDirection.Forward );

        // @HACK:
        mat4.lookAt( this.camera.viewMatrix, vec3.fromValues( 0, 100, 500 ),
            vec3.fromValues( 0, 0, 0 ), vec3.fromValues( 0, 1, 0 ) );
        this.camera.viewMatrixUpdated();
        this.globalUniforms.buffer.setMat4( "g_viewProj", this.camera.viewProjMatrix );
    }

    public terminate(): void {
        this.moduleBarn.callFunction( "terminate", ModuleDirection.Reverse );
    }

    public hotload(): void {
        this.moduleBarn.callFunction( "hotload", ModuleDirection.Forward );
    }

    public update(): void {
        this.debugMenu.update();
        this.moduleBarn.callFunction( "update", ModuleDirection.Forward );
        this.moduleBarn.callFunction( "render", ModuleDirection.Forward );
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

        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.canvas.style.position = 'absolute';

        this.camera.setPerspective( 60.0 / 180 * Math.PI, this.canvas.width / this.canvas.height, 1.0, 10000.0 );
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
        this.terminate();
    }
}