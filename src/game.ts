//----------------------------------------------------------------------------------------------------------------------
// Notes:  One class to rule them all. Intended to be rewritten / heavily modified for each game project.
//
// Author: Mike Lester
// Date C: 2020/11/25
//----------------------------------------------------------------------------------------------------------------------
import { IS_DEBUG_MODE } from './base/Version';
import { metaVar } from './base/Meta';
import { devModule, module, ModuleBarn, ModuleDirection } from './base/Module';
import { vec3 } from 'gl-matrix';

// Development
import { ProfileHud, Profile } from './base/DebugProfiler';
import { DebugMenu } from './base/DebugMenu';

// Modules
import { Camera } from './base/Camera';
import { Compositor } from './base/GfxCompositor';
import { DebugGrid } from './base/DebugGrid';
import { GlobalUniforms } from './base/GfxGlobalUniforms';
import { Renderer } from './base/GfxApiTypes';
import { Scene } from './scene';
import { WebGlRenderer } from './base/GfxApiWebGl';
import { CameraSystem } from './base/CameraSystem';
import { BlendCamera, FixedCamera } from './base/CameraTypes';
import { Clock } from './base/Clock';
import { InputManager } from './base/Input';
import { ResourceManager } from './base/ResourceManager';
import { DebugCamera } from './base/DebugCamera';

//----------------------------------------------------------------------------------------------------------------------
// Types
//----------------------------------------------------------------------------------------------------------------------
class HotloadData {}

//----------------------------------------------------------------------------------------------------------------------
// Constants
//----------------------------------------------------------------------------------------------------------------------
const kUrlParameters: Record<string, ( game: Game, value: string ) => void> = {
    // Add any URL parameters you'd like to parse
};

//----------------------------------------------------------------------------------------------------------------------
// Game
//----------------------------------------------------------------------------------------------------------------------
export class Game {
    @metaVar public rootElement: HTMLElement;
    @metaVar public canvas: HTMLCanvasElement = document.createElement( 'canvas' );
    @metaVar public camera: Camera = new Camera();
    @metaVar public gfxDevice: Renderer = new WebGlRenderer();
    @metaVar public hotLoadData?: HotloadData;

    // DevModules. Only loaded and executed in debug mode (false by default in production)
    @devModule public debugMenu: DebugMenu;
    @devModule public profileHud: ProfileHud;

    // Modules. The order here determines the function call order (e.g. Update)
    @module public clock: Clock;
    @module public cameraSystem: CameraSystem;
    @module public input: InputManager;
    @module public debugCamera: DebugCamera;
    @module public scene: Scene;
    @module public globalUniforms: GlobalUniforms;
    @module public debugGrid: DebugGrid;
    @module public compositor: Compositor;
    @module public resources: ResourceManager;

    private moduleBarn: ModuleBarn = new ModuleBarn();

    public initialize( urlParams: URLSearchParams ): void {
        // DOM creation
        this.rootElement = document.createElement( 'div' );
        document.body.appendChild( this.rootElement );
        this.rootElement.appendChild( this.canvas );

        // Graphics initialization
        this.gfxDevice.setDebugEnabled( IS_DEBUG_MODE );
        const success = this.gfxDevice.initialize( this.canvas );
        if( success ) { this.gfxDevice.resize( this.canvas.width, this.canvas.height ); }
        else { return; } // @TODO: FatalError function. Displays a fullscreen error message a la Ayvri
        this.onResize();

        // Register for Events
        window.onresize = this.onResize.bind( this );
        window.onbeforeunload = this.onUnload.bind( this );
        document.onvisibilitychange = this.onVisibility.bind( this );

        // Initialize the module barn
        const kModuleFunctions = [
            "initialize",
            "terminate",
            "hotload",

            "update",
            "render",
            "endFrame",
        ];
        this.moduleBarn.initialize( this, kModuleFunctions, IS_DEBUG_MODE );

        // Call "Initialize()" for all modules
        this.moduleBarn.callFunction( "initialize", ModuleDirection.Forward );

        // Apply any URL parameter options
        urlParams.forEach( ( value: string, key: string ) => {
            const func = kUrlParameters[ key ];
            if( func ) { func( this, value ); }
        } );

        // @HACK:
        this.cameraSystem.pushCamera( new FixedCamera( vec3.fromValues( 0, 100, 500 ), vec3.fromValues( 0, 0, 0 ) ) );
        this.cameraSystem.pushCamera( new FixedCamera( vec3.fromValues( 500, 100, 0 ), vec3.fromValues( 0, 0, 0 ) ) );
        this.cameraSystem.pushCamera( new BlendCamera( this.clock, 10000.0, 1000.0 ) );
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

        this.moduleBarn.callFunction( "update", ModuleDirection.Forward );
        this.moduleBarn.callFunction( "render", ModuleDirection.Forward );
        this.moduleBarn.callFunction( "endFrame", ModuleDirection.Forward );

        Profile.end( 'Game.update' );
        if( this.profileHud ) { this.profileHud.update(); }
    }

    /**
     * Fires when the main body of the window is resized (including bringing up dev tools)
     */
    private onResize() {
        console.log( "Window resized to (" + window.innerWidth + ", " + window.innerHeight + ")" );

        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;

        this.camera.aspect = window.innerWidth / window.innerHeight;
    }

    /**
     * Fires when the window becomes hidden (minimized or obscured by another window), or visible again.
     * This is the only API that will fire reliably at the end of a mobile session.
     * See https://www.igvita.com/2015/11/20/dont-lose-user-and-app-state-use-page-visibility/
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