import { Camera } from './base/Camera';
import { DebugGrid } from './base/DebugGrid';
import { IS_DEVELOPMENT } from './base/Version';
import { DebugMenu } from './base/DebugMenu';
import { metaVar } from './base/Meta';
import { WebGlRenderer } from './base/GfxApiWebGl';
import { module, ModuleBarn, ModuleDirection } from './base/Module';
import { Renderer } from './base/GfxApiTypes';

import { Compositor } from './base/GfxCompositor';
import { Scene } from './scene';
import { GlobalUniforms } from './base/GfxGlobalUniforms';

import { mat4, vec3 } from 'gl-matrix';
import { ProfileHud, Profile } from './base/DebugProfiler';

class HotloadData {}

export class Game {
    @metaVar rootElement: HTMLElement;
    @metaVar canvas: HTMLCanvasElement = document.createElement( 'canvas' );
    @metaVar camera: Camera = new Camera();
    @metaVar gfxDevice: Renderer = new WebGlRenderer();
    @metaVar debugMenu: DebugMenu = new DebugMenu();
    @metaVar hotLoadData?: HotloadData;

    profileHud: ProfileHud = new ProfileHud();
    moduleBarn: ModuleBarn = new ModuleBarn();

    // Modules. The order here determines the function call order (e.g. Update)
    @module scene: Scene = new Scene();
    @module globalUniforms: GlobalUniforms = new GlobalUniforms();
    @module debugGrid: DebugGrid = new DebugGrid();
    @module compositor: Compositor = new Compositor();

    public initialize(): void {
        // DOM creation
        this.rootElement = document.createElement( 'div' );
        document.body.appendChild( this.rootElement );
        this.rootElement.appendChild( this.canvas );

        // Debug initialization
        // @TODO: Only in Dev builds
        this.profileHud.initialize( this.rootElement, this.debugMenu );

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

    /**
     * Called just before an ES module is removed for replacement
     * Any properties added to hotLoadData will be available in the hotLoad() callback
     */
    public hotUnload( data: ObjectType ): void {
        console.log( "HotUnloading" );
        this.hotLoadData = data;
        this.moduleBarn.callFunction( "hotload", ModuleDirection.Forward );
    }

    /**
     * Called after new the new ES module code has executed
     * The hotLoadData object contains any properties added to it during hotUnload()
     */
    public hotLoad(): void {
        console.log( "HotLoaded" );
        this.moduleBarn.callFunction( "hotload", ModuleDirection.Forward );
        this.hotLoadData = undefined;
    }

    public update(): void {
        Profile.begin( 'Game.update' );

        this.debugMenu.update();

        this.moduleBarn.callFunction( "update", ModuleDirection.Forward );
        this.moduleBarn.callFunction( "render", ModuleDirection.Forward );

        Profile.end( 'Game.update' );
        this.profileHud.update();
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