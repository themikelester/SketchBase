//----------------------------------------------------------------------------------------------------------------------
// Notes:  Holds the lowest level of camera information for the camera used for final rendering.
//
// Author: Mike Lester
// Date C: 2020/12/07
//----------------------------------------------------------------------------------------------------------------------
import { metaFunc } from "./Meta";

export class Clock {
    // All times are in milliseconds (ms) and are updated each display frame
    public realTime: number = 0; // The actual accumulated CPU time since start
    public gameTime: number = 0; // A modulation of realTime, since gameTime can be paused and slowed

    // Time deltas are updated each display frame
    public realDt: number = 0; // The actual CPU-time delta since last display frame
    public gameDt: number = 0; // A modulated form of realDt (can be paused, slowed, etc).

    private speed: number = 1.0;
    private paused: boolean = false;

    @metaFunc update(): void {
        const time = performance.now();

        // Measure the real time since the last tick()
        this.realDt = time - this.realTime;
        this.realTime = time;

        this.gameDt = this.realDt * this.speed;
        this.gameTime += this.gameDt;
    }
}