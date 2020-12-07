//----------------------------------------------------------------------------------------------------------------------
// Notes:  Holds the lowest level of camera information for the camera used for final rendering.
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
import { mat4, vec3 } from 'gl-matrix';
import { defaultValue } from './Util';

export class Camera {
  cameraMatrix: mat4;
  viewMatrix: mat4;
  projMatrix: mat4;
  projMatrixInverse: mat4;

  viewProjMatrix: mat4;
  viewProjMatrixInverse: mat4;

  fov: number;
  near: number;
  far: number;
  aspect: number;

  constructor( fovY?: number, aspectRatio?: number, near = 1.0, far = 20000 ) {
    this.cameraMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.projMatrix = mat4.create();
    this.projMatrixInverse = mat4.create();

    this.viewProjMatrix = mat4.create();
    this.viewProjMatrixInverse = mat4.create();

    this.fov = defaultValue( fovY, 60.0 / 180 * Math.PI );
    this.near = defaultValue( near, 1.0 );
    this.far = defaultValue( far, 2000 );
    this.aspect = defaultValue( aspectRatio, 1 );
  }

  getFovX(): number {
    const fovx = Math.atan( Math.tan( this.fov * 0.5 ) * this.aspect ) * 2;
    return fovx;
  }

  getPos( out: vec3 ): vec3 {
    return mat4.getTranslation( out, this.cameraMatrix );
  }
}