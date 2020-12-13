//----------------------------------------------------------------------------------------------------------------------
// Notes:  A WebWorker which handles the async portion of Resource loading. See its partner at ResourceManager.ts.
//         Its main responsibilities are to fetch necessary files, and call `loadAsync` for each resource.
//
// Author: Mike Lester
// Date C: 2020/13/27
//----------------------------------------------------------------------------------------------------------------------
import { loaders, Resource, ResourceStatus } from './ResourceTypes';

//----------------------------------------------------------------------------------------------------------------------
// Constants
//----------------------------------------------------------------------------------------------------------------------

// Trick typescript into assuming that we're using the Worker global interface, not Window
// See https://github.com/Microsoft/TypeScript/issues/20595
const ctx = self as unknown as Worker;

// Trickery to fix TypeScript since this will be done by "worker-loader"
export default {} as typeof Worker & ( new () => Worker );

const kTickIntervalMs: number = 33; // Send messages at most every 33ms

//----------------------------------------------------------------------------------------------------------------------
// AsyncResourceManager
//----------------------------------------------------------------------------------------------------------------------
class AsyncResourceManager {
    private transferList: Transferable[] = [];
    private processed: Resource[] = [];

    constructor() {
        setInterval( () => this.update(), kTickIntervalMs );
    }

    async onMessage( msg: MessageEvent ) {
        const resources = msg.data as Resource[];
        for( const resource of resources ) {
            this.loadResource( resource );
        }
    }

    async loadResource( resource: Resource ) {
        try {
            // Lookup the correct loader based on resource type
            const loader = loaders[ resource.type ];
            if( !loader ) { throw new Error( "No loader found for resource type " + resource.type ); }

            // Download the necessary data
            const response = await fetch( resource.uri );
            if( response.status != 200 ) { throw new Error( "Fetch failed. Result " + response.status ); }
            const dataBlob = await response.blob();

            // Let the resource load
            const transferrables = await loader.loadAsync( resource, dataBlob );
            Array.prototype.push.apply( this.transferList, transferrables );

            resource.status = ResourceStatus.LoadingSync;

        } catch ( error ) {
            resource.error = error.message;
            resource.status = ResourceStatus.Failed;
            console.warn( "Resource " + resource.uri + " failed to load:", error );
        }

        this.processed.push( resource );
    }

    update() {
        if( this.processed.length > 0 ) {
            ctx.postMessage( this.processed, this.transferList );

            this.transferList.length = 0;
            this.processed.length = 0;
        }
    }
}

//----------------------------------------------------------------------------------------------------------------------
// MainThread Interface
//----------------------------------------------------------------------------------------------------------------------
onmessage = async ( msg ) => { manager.onMessage( msg ) }

const manager = new AsyncResourceManager();