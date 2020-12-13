//----------------------------------------------------------------------------------------------------------------------
// Notes:  Manages (and enables) a debug camera for easy navigation/investigation.
//
// Author: Mike Lester
// Date C: 2020/13/27
//----------------------------------------------------------------------------------------------------------------------

import { vec3 } from "gl-matrix";
import { CameraNode, CameraSystem } from "./CameraSystem";
import { BlendCamera } from "./CameraTypes";
import { Clock } from "./Clock";
import { DebugMenu } from "./DebugMenu";
import { InputManager } from "./Input";
import { MouseButtons, MouseEventWrapper } from "./InputMouse";
import { AxisY, clamp, fadeOut, lerp } from "./Math";
import { metaFunc } from "./Meta";
import { assertDefined } from "./Util";

//----------------------------------------------------------------------------------------------------------------------
// Constants
//----------------------------------------------------------------------------------------------------------------------
const kFadeInTimeMs = 1000.0;
const kFadeOutTimeMs = 1000.0;
const kInertiaDecay = 0.2;

//----------------------------------------------------------------------------------------------------------------------
// DebugCameraNode
//----------------------------------------------------------------------------------------------------------------------
class DebugCameraNode extends CameraNode {
    public dist: number = 100;
    public azimuth: number = 0;
    public pitch: number = Math.PI * 0.3;

    public eyePos: vec3 = vec3.fromValues( 100, 0, 0 );
    public target: vec3 = vec3.fromValues( 0, 0, 0 );

    initialize(): void {
    }

    update(): void {
        const polar = Math.cos( this.pitch );
        const x = Math.cos( this.azimuth ) * polar * this.dist;
        const z = Math.sin( this.azimuth ) * polar * this.dist;
        const y = Math.sin( this.pitch ) * this.dist;

        vec3.set( this.eyePos, x, y, z );
        this.state.lookAtWithPos( this.eyePos, this.target, AxisY );
    }
}

//----------------------------------------------------------------------------------------------------------------------
// DebugCamera
//----------------------------------------------------------------------------------------------------------------------
export class DebugCamera {
    private camNode?: DebugCameraNode;
    private blendNode?: BlendCamera;

    private cameraSystem: CameraSystem;
    private clock: Clock;
    private input: InputManager;

    private enabled: boolean = true;

    private touchActive: boolean = false;
    private touchX: number = 0.0;
    private touchY: number = 0.0;
    private touchPrevX: number = 0.0;
    private touchPrevY: number = 0.0;

    private camVelX: number = 0.0;
    private camVelY: number = 0.0;

    @metaFunc initialize( cameraSystem: CameraSystem, clock: Clock, debugMenu: DebugMenu, input: InputManager ): void {
        this.cameraSystem = cameraSystem;
        this.clock = clock;
        this.input = input;

        const menu = debugMenu.addFolder( 'DebugMenu' );
        menu.add( this, 'enabled' ).onChange( enabled => {
            if( enabled ) { this.enable(); } else { this.disable(); }
        } );

        if( this.enabled ) { this.enable(); }

        this.input.mouse.on( 'mousewheel', ( event: MouseEventWrapper ) => {
            const zoomDir = assertDefined( event.wheelDelta );
            if( this.camNode ) {
                this.camNode.dist += zoomDir * 10.0;
            }
        } );

        this.input.mouse.on( 'mousedown', ( event: MouseEventWrapper ) => {
            if( event.buttons[ MouseButtons.Left ] ) {
                this.touchActive = true;
                this.touchX = event.x;
                this.touchY = event.y;
                this.touchPrevX = event.x;
                this.touchPrevY = event.y;
            }
        } );

        this.input.mouse.on( 'mouseup', ( event: MouseEventWrapper ) => {
            if( !event.buttons[ MouseButtons.Left ] )
            {
                this.touchActive = false;
                this.touchX = 0;
                this.touchY = 0;
                this.touchPrevX = 0;
                this.touchPrevY = 0;
            }
        } );

        this.input.mouse.on( 'mousemove', ( event: MouseEventWrapper ) => {
            if( event.buttons[ MouseButtons.Left ] ) {
                this.touchX = event.x;
                this.touchY = event.y;
            }
        } );
    }

    @metaFunc update( clock: Clock ): void {
        if( !this.camNode ) { return; }

        const touchDx = this.touchX - this.touchPrevX;
        const touchDy = this.touchY - this.touchPrevY;
        this.touchPrevX = this.touchX;
        this.touchPrevY = this.touchY;

        if( this.touchActive ) {
            const newVelX = touchDx * Math.PI / 500;
            const newVelY = touchDy * Math.PI / 500;

            this.camVelX = lerp( this.camVelX, newVelX, 0.5 );
            this.camVelY = lerp( this.camVelY, newVelY, 0.5 );
        } else {
            this.camVelX = fadeOut( clock.realDt, kInertiaDecay, this.camVelX );
            this.camVelY = fadeOut( clock.realDt, kInertiaDecay, this.camVelY );
        }

        this.camNode.azimuth += this.camVelX;
        this.camNode.pitch += this.camVelY;

        this.camNode.azimuth = this.camNode.azimuth % ( Math.PI * 2.0 );
        this.camNode.pitch = clamp( this.camNode.pitch, 0.01, Math.PI * 0.49 );
    }

    enable(): void {
        this.camNode = new DebugCameraNode();
        this.blendNode = new BlendCamera( this.clock, kFadeInTimeMs, kFadeOutTimeMs );
        this.cameraSystem.pushCamera( this.camNode, 1 );
        this.cameraSystem.pushCamera( this.blendNode, 1 );

        this.enabled = true;
    }

    disable(): void {
        const blendCam = assertDefined( this.blendNode );
        blendCam.beginFadeOut();

        this.enabled = false;
    }
}