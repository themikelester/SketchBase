//----------------------------------------------------------------------------------------------------------------------
// Notes:  Holds the lowest level of camera information for the camera used for final rendering.
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
import { mat4, vec3 } from 'gl-matrix';

export class Camera {
  cameraMatrix = mat4.create();
  viewMatrix = mat4.create();
  projMatrix = mat4.create();
  projMatrixInverse = mat4.create();

  viewProjMatrix = mat4.create();
  viewProjMatrixInverse = mat4.create();

  fov: number = 60.0 / 180 * Math.PI;
  near: number = 1.0;
  far: number = 20000.0;
  aspect: number = 1;

  getFovX(): number {
    const fovx = Math.atan( Math.tan( this.fov * 0.5 ) * this.aspect ) * 2;
    return fovx;
  }

  getPos( out: vec3 ): vec3 {
    return mat4.getTranslation( out, this.cameraMatrix );
  }
}