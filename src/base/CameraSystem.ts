//----------------------------------------------------------------------------------------------------------------------
// Notes:  Manages a stack of virtual cameras, blending between them to produce a final camera for rendering.
//
// Author: Mike Lester
// Date C: 2020/12/02
//----------------------------------------------------------------------------------------------------------------------

import { mat3, mat4, quat, vec3 } from "gl-matrix";
import { Camera } from "./Camera";
import { GlobalUniforms } from "./GfxGlobalUniforms";
import { AxisY, lerp, MathConstants } from "./Math";
import { metaFunc } from "./Meta";

//----------------------------------------------------------------------------------------------------------------------
// Scratch
//----------------------------------------------------------------------------------------------------------------------
const kScratchMat3 = mat3.create();
const kScratchVec3A = vec3.create();
const kScratchVec3B = vec3.create();
const kScratchVec3C = vec3.create();
const kScratchVec3D = vec3.create();
const kScratchQuatA = quat.create();
const kScratchQuatB = quat.create();

//----------------------------------------------------------------------------------------------------------------------
// CameraState
//----------------------------------------------------------------------------------------------------------------------
export class CameraState {
    fov: number = 60 * MathConstants.DEG_TO_RAD;
    mtx: mat4 = mat4.create();

    setPos( pos: vec3 ): void {
        this.mtx[ 12 ] = pos[ 0 ];
        this.mtx[ 13 ] = pos[ 1 ];
        this.mtx[ 14 ] = pos[ 2 ];
    }

    lookAt( target: vec3, up: vec3 ): void {
        mat4.targetTo( this.mtx, this.pos( kScratchVec3A ), target, up );
    }

    lookAtWithPos( eyePos: vec3, target: vec3, up: vec3 ): void {
        mat4.targetTo( this.mtx, eyePos, target, up );
    }

    pos( dst: vec3 ): vec3 { return mat4.getTranslation( dst, this.mtx ); }
    right( dst: vec3 ): vec3 { return vec3.set( dst, this.mtx[ 0 ], this.mtx[ 1 ], this.mtx[ 2 ] ); }
    up( dst: vec3 ): vec3 { return vec3.set( dst, this.mtx[ 4 ], this.mtx[ 5 ], this.mtx[ 6 ] ); }
    forward( dst: vec3 ): vec3 { return vec3.set( dst, this.mtx[ 8 ], this.mtx[ 9 ], this.mtx[ 10 ] ); }

    lerp( dst: CameraState, a: CameraState, b: CameraState, t: number, forceUp: boolean ): CameraState {
        dst.fov = lerp( a.fov, b.fov, t );

        const rotA = quat.fromMat3( kScratchQuatA, mat3.fromMat4( kScratchMat3, a.mtx ) );
        const rotB = quat.fromMat3( kScratchQuatB, mat3.fromMat4( kScratchMat3, b.mtx ) );
        if( quat.dot( rotA, rotB ) < 0.0 ) { quat.invert( rotA, rotA ); }
        const rotNew = mat3.fromQuat( kScratchMat3, quat.slerp( kScratchQuatA, rotA, rotB, t ) );

        const posNew = vec3.lerp( kScratchVec3A, a.pos( kScratchVec3A ), b.pos( kScratchVec3B ), t );
        const z = vec3.set( kScratchVec3B, rotNew[ 6 ], this.mtx[ 7 ], this.mtx[ 8 ] );
        const y = vec3.set( kScratchVec3C, rotNew[ 3 ], this.mtx[ 4 ], this.mtx[ 5 ] );

        dst.lookAtWithPos( posNew, vec3.subtract( kScratchVec3D, posNew, z ), forceUp ? AxisY : y );
        return dst;
    }
}

//----------------------------------------------------------------------------------------------------------------------
// CameraNode
//----------------------------------------------------------------------------------------------------------------------
export abstract class CameraNode {
    active: boolean;
    state: CameraState;

    initialize(): void {}
    update(): void {}
}

//----------------------------------------------------------------------------------------------------------------------
// CameraSystem
//----------------------------------------------------------------------------------------------------------------------
export class CameraSystem {
    camera: Camera;
    stack: CameraNode[];

    @metaFunc initialize( camera: Camera ): void {
        this.camera = camera;
    }

    @metaFunc update( globalUniforms: GlobalUniforms ): void {
        // Remove inactive cameras

        // Update remaining cameras

        // Compute final camera for this frame
        this.flush( globalUniforms );
    }

    flush( globalUniforms: GlobalUniforms ): void {
        // Compute final camera matrices for rendering

        // Update uniform buffers with final camera data
        globalUniforms.buffer.setMat4( "g_viewProj", this.camera.viewProjMatrix );
    }
}