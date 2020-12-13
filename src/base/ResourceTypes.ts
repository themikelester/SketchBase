//----------------------------------------------------------------------------------------------------------------------
// Notes:  Resource-related types shared between the ResourceManager and its WebWorker. These definitions need to live
//         in a separate file accessible to both modules to avoid an infinite include loop of worker->main->worker.
//
// Author: Mike Lester
// Date C: 2020/13/27
//----------------------------------------------------------------------------------------------------------------------
import { Renderer } from "./GfxApiTypes";
import { TextureLoader } from "./ResourceTexture";

//----------------------------------------------------------------------------------------------------------------------
// Exported types
//----------------------------------------------------------------------------------------------------------------------
export enum ResourceStatus {
    Initializing,
    LoadingAsync,
    LoadingSync,
    Loaded,
    Unloaded,
    Failed,
}

export interface Resource {
    uri: string;
    type: string;
    status: ResourceStatus;
    error?: string;
}

export interface ResourceLoadingContext {
    gfxDevice: Renderer;
}

//----------------------------------------------------------------------------------------------------------------------
// ResourceLoader
//----------------------------------------------------------------------------------------------------------------------
export interface ResourceLoader {
    /**
     * Called from a worker thread. Resources should do as much processing as possible in this function, as long as the
     * result data is Transferrable, as structured cloning is very slow.
     * @see https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast
     * @param res The partially loaded resource. Any properties set by the constructor will be present.
     * @param uriData The result of fetch'ing the resource uri. Any server errors are handle previously.
     * @returns A list of Transferable objects within this resource. This is very important for performance.
     */
    loadAsync( res: Resource, uriData: Blob ): Promise< Transferable[] >;

    /**
     * Called on the main thread. Any main-thread-only work (such as GPU upload) should happen here.
     * @param res The partially loaded resource. Any properties set by loadAsync will be present.
     * @param context Contains any modules that might be required by this function, such as the GPU API wrapper.
     * @returns True if done loading, false otherwise. If false, loadSync will be called on the next frame.
     */
    loadSync( res: Resource, context: ResourceLoadingContext ): boolean;

    /**
     * Queue the resource for unloading. Note that this does not begin unloading immediately, unloading will begin on
     * the next call to ResourceManager.update().
     * @param res The loaded (or partially loaded) resource.
     * @param context Contains any modules that might be required by this function, such as the GPU API wrapper.
     */
    unload( res: Resource, context: ResourceLoadingContext ): void;
}

//----------------------------------------------------------------------------------------------------------------------
// Resource Loader Map
// @NOTE: The loaders listed here determine the files that will be packaged in the worker bundle (and thus its size)
//----------------------------------------------------------------------------------------------------------------------
export const loaders: Record< string, ResourceLoader > = {
    'Texture': new TextureLoader(),
};