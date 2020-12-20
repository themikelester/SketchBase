//----------------------------------------------------------------------------------------------------------------------
// Notes:
//
// Author: Mike Lester
// Date C: 2020/12/20
//----------------------------------------------------------------------------------------------------------------------
interface LevelInfo {
    near: number, /** Near Z plane */
    far: number, /** Far Z plane */
}

interface LevelActors {
    type: string,
    parameters: number,
    pos: number[],
    rot: number[],
    scale: number
}

interface LevelData {
    levelInfo: LevelInfo,
    actors: LevelActors[],
}