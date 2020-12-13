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
import { AxisY, clamp } from "./Math";
import { metaFunc } from "./Meta";
import { assertDefined } from "./Util";

//----------------------------------------------------------------------------------------------------------------------
// Constants
//----------------------------------------------------------------------------------------------------------------------
const kFadeInTimeMs = 1000.0;
const kFadeOutTimeMs = 1000.0;

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

        this.input.mouse.on( 'mousemove', ( event: MouseEventWrapper ) => {
            if( this.camNode && event.buttons[ MouseButtons.Left ] ) {
                this.camNode.azimuth += event.dx * Math.PI / 500;
                this.camNode.pitch += event.dy * Math.PI / 500;

                this.camNode.azimuth = this.camNode.azimuth % ( Math.PI * 2.0 )
                this.camNode.pitch = clamp( this.camNode.pitch, 0.01, Math.PI * 0.49 )
            }
        } );
    }

    @metaFunc update(): void {
        if( !this.enabled ) { return; }


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