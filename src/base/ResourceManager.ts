//----------------------------------------------------------------------------------------------------------------------
// Notes: Manages loading of Resources, which are any data files required by the game. It is designed to do as much work
//        as possible asynchronously, on a worker thread.
//
//        Lifecycle: (See ResourceState)
//        Each type of Resource has a dedicated ResourceLoader which contains all the logic for processing the resource.
//        Typically, ResourceLoader.loadAsync() will run on the worker (unless a synchronous load is requested) to
//        fetch the necessary file(s) before doing as much processing as possible. ResourceLoader.loadSync() is then
//        called on the main thread so that any main-thread-only work can happen (such as GPU upload).
//
//        If a failure is encountered during loading, the resource state is set to Failed, but the resource will remain
//        in the ResourceManager list. When a resource is unloaded, it will be deleted from the list.
//
// Author: Mike Lester
// Date C: 2020/12/08
//----------------------------------------------------------------------------------------------------------------------

import { metaFunc } from "./Meta";
import { loaders, Resource, ResourceLoadingContext, ResourceStatus } from './ResourceTypes';
import Worker from './ResourceManager.worker';
import { assert, assertDefined } from "./Util";
import { Renderer } from "./GfxApiTypes";

//----------------------------------------------------------------------------------------------------------------------
// ResourceManager
//----------------------------------------------------------------------------------------------------------------------
export class ResourceManager {
    worker: Worker;
    context: ResourceLoadingContext;
    messages: MessageEvent[] = [];
    resources: Record< string, Resource> = {}; // @TODO: Use a combined array / Record type

    @metaFunc initialize( gfxDevice: Renderer ): void {
        this.worker = new Worker();
        this.context = { gfxDevice };

        // Buffer messages from the worker until the next update
        // @NOTE: We want to do as little work as possible in events, as they're unscheduled and hard to profile
        this.worker.onmessage = ( msg: MessageEvent ) => this.messages.push( msg );
    }

    @metaFunc update(): void {
        const asyncList: Resource[] = [];

        // Process resources coming from the worker thread
        // @NOTE: This is not done in the message handler to keep it as simple as possible
        //        Accessing msg.data triggers a copy (at least on V8) which can be expensive
        for( const msg of this.messages ) {
            const updatedResources = msg.data as Resource[];
            for( const res of updatedResources ) {
                this.resources[ res.uri ] = res;
            }
        }
        this.messages.length = 0;

        // Process all pending resources
        for( const resource of Object.values( this.resources ) ) {
            const loader = loaders[ resource.type ];

            switch ( resource.status ) {
                case ResourceStatus.Initializing:
                    asyncList.push( resource );
                    resource.status = ResourceStatus.LoadingAsync;
                    break;

                case ResourceStatus.LoadingAsync:
                    break;

                case ResourceStatus.LoadingSync:
                    try {
                        const done = loader.loadSync( resource, this.context );
                        if( done ) { resource.status = ResourceStatus.Loaded; }
                    } catch ( error ) {
                        resource.error = error.message;
                        resource.status = ResourceStatus.Failed;
                        console.warn( "Resource " + resource.uri + " failed to load:", error );
                    }
                    break;

                case ResourceStatus.Loaded:
                    break;

                case ResourceStatus.Unloaded:
                    loader.unload( resource, this.context );
                    delete this.resources[ resource.uri ];
                    break;

                case ResourceStatus.Failed:
                    break;
            }
        }

        // Send any resources that have async work to the worker thread
        if( asyncList.length > 0 ) { this.worker.postMessage( asyncList ); }
    }

    /**
     * Queue all resources in the list for loading.
     */
    loadResourceList( list: Resource[] ): void {
        for( const r of list ) {
            assert( !this.resources[ r.uri ], "Attempt to re-load resource: " + r.uri );
            const resource = this.resources[ r.uri ] = r;
            resource.status = ResourceStatus.Initializing;
        }
    }

    /**
     * Set the status of all resources in the list to "Unloaded". Note that this is not instantaneous.
     * The resource objects will be unloaded and deleted on the next call to ResourceManager.Update().
     */
    unloadResourceList( list: Resource[] ): void {
        for( const r of list ) {
            const res = assertDefined( this.resources[ r.uri ], 'Attempt to unload unknown resource: ' + r.uri );
            res.status = ResourceStatus.Unloaded;
        }
    }
}