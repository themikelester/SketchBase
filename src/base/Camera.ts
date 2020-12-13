//----------------------------------------------------------------------------------------------------------------------
// Notes:  Holds the lowest level of camera information for the camera used for final rendering.
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
import { mat4, vec3 } from 'gl-matrix';

export class Camera {
    public cameraMatrix = mat4.create();
    public viewMatrix = mat4.create();
    public projMatrix = mat4.create();
    public projMatrixInverse = mat4.create();

    public viewProjMatrix = mat4.create();
    public viewProjMatrixInverse = mat4.create();

    public fov: number = 60.0 / 180 * Math.PI;
    public near: number = 1.0;
    public far: number = 20000.0;
    public aspect: number = 1;

    getFovX(): number {
        const fovx = Math.atan( Math.tan( this.fov * 0.5 ) * this.aspect ) * 2;
        return fovx;
    }

    getPos( out: vec3 ): vec3 {
        return mat4.getTranslation( out, this.cameraMatrix );
    }
}