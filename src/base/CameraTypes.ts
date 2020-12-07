//----------------------------------------------------------------------------------------------------------------------
// Notes:  Basic camera types. Create and push them onto the camera stack via the CameraSystem.
//
// Author: Mike Lester
// Date C: 2020/12/07
//----------------------------------------------------------------------------------------------------------------------
import { vec3 } from "gl-matrix";
import { CameraNode, CameraState } from "./CameraSystem";
import { Clock } from "./Clock";
import { AxisY, saturate } from "./Math";
import { assertDefined } from "./Util";

/**
 * The most basic camera. Look at a fixed position, from a fixed position.
 */
export class FixedCamera extends CameraNode {
    constructor( pos: vec3, target: vec3, up: vec3 = AxisY ) {
        super();
        this.state.lookAtWithPos( pos, target, up );
    }
}

/**
 * Blend smoothly between the previous two cameras on the stack.
 * Call beginFadeOut() to transition back to the older of the two cameras.
 * Once fade out is complete, both this and the previous camera will be removed.
 */
export class BlendCamera extends CameraNode {
    private fadeOut = false;
    private inTicker = 0.0;
    private outTicker = 0.0;
    private target: CameraNode;

    constructor( private clock: Clock, public fadeInDuration = 1000.0, public fadeOutDuration = 1000.0 ) {
        super();
    }

    initialize(): void {
        this.target = assertDefined( this.prev );
        this.outTicker = 0.0;
        this.inTicker = 0.0;
    }

    update(): void {
        const child = assertDefined( this.prev );
        const grandChild = assertDefined( child.prev );

        if( !this.fadeOut ) { this.inTicker += this.clock.gameDt }
        else { this.outTicker += this.clock.gameDt; }

        let inT = this.fadeInDuration > 0.0 ? saturate( this.inTicker / this.fadeInDuration ) : 1.0;
        inT = -Math.cos( inT * Math.PI ) * 0.5 + 0.5;
        this.state = CameraState.lerp( this.state, grandChild.state, child.state, inT, true );

        let outT = this.fadeOutDuration > 0.0 ? saturate( this.outTicker / this.fadeOutDuration ) : 1.0;
        outT = this.fadeOut ? ( -Math.cos( outT * Math.PI ) * 0.5 + 0.5 ) : 0.0;
        this.state = CameraState.lerp( this.state, this.state, grandChild.state, outT, true );

        if( outT >= 1.0 ) {
            this.deactivate();
            this.target.deactivate();
        }
    }

    beginFadeOut(): void { this.fadeOut = true; }

	skipFadeOut(): void { this.fadeOut = true; this.fadeOutDuration = 0; }
}