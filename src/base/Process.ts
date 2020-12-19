//----------------------------------------------------------------------------------------------------------------------
// Notes: A "Process" is a generic piece of dynamically loaded code that has an update() function called every frame.
//        It is intended to be used for higher level logic than a "Module", which are statically loaded. Where a Module
//        might be the CameraSystem or ResourceManager, a Process might be an Actor or Event. They are not critical to
//        the engine, so it can initialize (and run) without them.
//
// Author: Mike Lester
// Date C: 2020/19/08
//----------------------------------------------------------------------------------------------------------------------

import { Game } from "../game";
import { metaFunc, MetaTable } from "./Meta";
import { arrayRemove, assertDefined, nArray } from "./Util";

//----------------------------------------------------------------------------------------------------------------------
// Constants
//----------------------------------------------------------------------------------------------------------------------
const kExecListCount = 16;

//----------------------------------------------------------------------------------------------------------------------
// Types
//----------------------------------------------------------------------------------------------------------------------
type ProcessType = string;

export const enum ProcessStatus {
    Loading,
    Complete,
    Error,
}

class ProcessLayer {
    public readonly processes: BaseProcess[] = [];
    public readonly name: string;
    public readonly layerId: number;

    constructor( name: string, layerId: number ) { this.name = name; this.layerId = layerId; }
}

interface ProcessConstructor {
    new( processId: number, parameters: number, layerId: number, execListId: number ): BaseProcess;
}

//----------------------------------------------------------------------------------------------------------------------
// BaseProcess
//----------------------------------------------------------------------------------------------------------------------
export class BaseProcess {
    public parameters: number;

    /**
     * Monotonically increasing identifier for this process instance
     */
    public processId: number;

    /**
     * Determines the order of execution relative to other Processes. Each process belongs to a list. List 0 procs are
     * executed first, and so on. The order within a list is determined by the creation order (so essentially random).
     */
    public execListId: number;

    /**
     * Useful for debugging. A logical grouping of processes. Has no impact on logic.
     */
    public layerId: number;

    constructor( processId: number, parameters: number, layerId: number, execListId: number ) {
        this.processId = processId;
        this.parameters = parameters;
        this.layerId = layerId;
        this.execListId = execListId;
    }

    /**
     * Called immediately after construction. Many processes can be loaded in one frame, so split up large workloads by
     * returning 'Loading' to have this called again on the next frame.
     */
    initialize( game: Game, userData?: unknown ): ProcessStatus {
        return ProcessStatus.Complete;
    }

    /**
     * Called once per frame after load() has completed, until deleted.
     */
    update( game: Game ): void {

    }

    delete( ): void {

    }
}

//----------------------------------------------------------------------------------------------------------------------
// ProcessBarn
//----------------------------------------------------------------------------------------------------------------------
export class ProcessBarn {
    private deleteQueue: BaseProcess[] = [];
    private createQueue: ProcessCreateRequest< unknown >[] = [];

    private layers: ProcessLayer[] = [ new ProcessLayer( "Root", 0 ) ];
    private execLists: BaseProcess[][] = nArray( kExecListCount, () => [] );

    private game: Game;
    private processId: number = 0;

    setGame( game: Game ): void {
        this.game = game;
    }

    @metaFunc update(): void {
        this.updateDelete();
        this.updateCreate();
        this.updateExec();
    }

    createLayer( name: string ): number {
        const layerId = this.layers.length;
        this.layers[ layerId ] = new ProcessLayer( name, layerId );
        return layerId;
    }

    createProcess< T >( layerId: number, processType: ProcessType, userData?: T ): boolean {
        const layer = this.layers[ layerId ];
        const processId = this.processId++;

        const req = new ProcessCreateRequest( layer, processId, processType, userData );
        this.createQueue.push( req );

        return true;
    }

    private updateDelete() {
        for( let i = 0; i < this.deleteQueue.length; i++ ) {
            const proc = this.deleteQueue[ i ];
            arrayRemove( this.execLists[ proc.execListId ], proc );
            proc.delete();
        }
        this.deleteQueue.length = 0;
    }

    private updateCreate() {
        for( let i = 0; i < this.createQueue.length; i++ ) {
            const req = this.createQueue[ i ];
            let shouldDelete = false;

            const status = req.do( this.game );

            if( status === ProcessStatus.Complete ) {
                const process = assertDefined( req.process );
                req.layer.processes.push( process );
                this.execLists[ process.execListId ].push( process );
                shouldDelete = true;

            } else if( status === ProcessStatus.Error ) {
                console.error( `Failed to create process ${req.processId} with data ${req.userData}` );
                shouldDelete = true;
            }

            if( shouldDelete ) {
                this.createQueue.splice( i--, 1 );
            }
        }
    }

    private updateExec() {
        for( let i = 0; i < this.execLists.length; i++ ) {
            for( let j = 0; j < this.execLists[ i ].length; j++ ) {
                const proc = this.execLists[ i ][ j ];
                proc.update( this.game );
            }
        }
    }
}


//----------------------------------------------------------------------------------------------------------------------
// ProcessCreateRequest
//----------------------------------------------------------------------------------------------------------------------
class ProcessCreateRequest< T > {
    public process?: BaseProcess;

    constructor(
        public layer: ProcessLayer,
        public processId: number,
        public processType: string,
        public userData: T ) {}

    do( game: Game ): ProcessStatus {
        if( !this.process ) {
            const metaClass = MetaTable[ this.processType ];
            if( !metaClass ) {
                console.warn( `Failed to find meta-registered class for process: ${ this.processType }` );
                return ProcessStatus.Error;
            }

            const Konstructor = metaClass.cons as ProcessConstructor;
            this.process = new Konstructor( this.processId, 0, this.layer.layerId, 0 );
        }

        const status = assertDefined( this.process ).initialize( game, this.userData );
        return status;
    }
}