//----------------------------------------------------------------------------------------------------------------------
// Notes:  A texture resource that handles GPU upload.
//
// Author: Mike Lester
// Date C: 2020/13/27
//----------------------------------------------------------------------------------------------------------------------
import * as Gfx from "./GfxApiTypes";
import { Resource, ResourceLoader, ResourceLoadingContext, ResourceStatus } from "./ResourceTypes";
import { defined } from "./Util";

//----------------------------------------------------------------------------------------------------------------------
// Texture Resource
//----------------------------------------------------------------------------------------------------------------------
export class Texture implements Resource {
    public width: number = 0;
    public height: number = 0;
    public texture?: Gfx.Id = -1;
    public hasMips?: boolean = false;

    // Resource properties
    public uri: string;
    public type: string;
    public status: ResourceStatus;
    public error?: string | undefined;

    // Loading properties
    public imageBuffer?: ArrayBuffer;
    public imageBitmap?: ImageBitmap;
    public imageElement?: HTMLImageElement;
}

//----------------------------------------------------------------------------------------------------------------------
// TextureLoader
//----------------------------------------------------------------------------------------------------------------------
export class TextureLoader implements ResourceLoader {
    async loadAsync( res: Texture, uriData: Blob ): Promise< Transferable[] > {
        // Fall back to decoding the JPEG on the main thread if createImageBitmap is unavailable (Safari)
        {
            res.imageBuffer = await uriData.arrayBuffer();
            return [ res.imageBuffer ];
        }
    }

    loadSync( res: Texture, context: ResourceLoadingContext ): boolean {
        if( res.imageBitmap ) {
            res.texture = !context.gfxDevice ? -1 : context.gfxDevice.createTexture( res.uri, {
                usage: Gfx.Usage.Static,
                type: Gfx.TextureType.Texture2D,
                format: Gfx.TexelFormat.U8x4,
                maxAnistropy: 16,
                defaultWrapS: Gfx.TextureWrap.Clamp,
                defaultWrapT: Gfx.TextureWrap.Clamp,
            }, res.imageBitmap );

            res.width = res.imageBitmap.width;
            res.height = res.imageBitmap.height;

            res.imageBitmap.close();
            delete res.imageBitmap;

            return true;
        } else {
            // This browser (Safari) doesn't support createImageBitmap(), which means we have to do JPEG decompression
            // here on the main thread. Use an HtmlImageElement to do this before submitting to WebGL.
            if( res.imageBuffer ) {
                // @TODO: Support other file type (PNG) by using the mimetype from the response
                const blob = new Blob( [ res.imageBuffer ], { type: "image/jpeg" } );
                const imageUrl = window.URL.createObjectURL( blob );
                delete res.imageBuffer;

                // Create an image element to do async JPEG/PNG decoding
                res.imageElement = new Image();
                res.imageElement.src = imageUrl;
            }

            if( defined( res.imageElement ) && res.imageElement.complete ) {
                res.texture = !context.gfxDevice ? -1 : context.gfxDevice.createTexture( res.uri, {
                    usage: Gfx.Usage.Static,
                    type: Gfx.TextureType.Texture2D,
                    format: Gfx.TexelFormat.U8x4,
                    maxAnistropy: 16,
                }, res.imageElement );

                res.width = res.imageElement.width;
                res.height = res.imageElement.height;

                delete res.imageElement;

                return true;
            }

            // Continue calling loadSync until the image is loaded and decoded
            return false;
        }
    }

    unload( res: Texture, context: ResourceLoadingContext ): void {
        if( defined( res.texture ) && context.gfxDevice ) { context.gfxDevice.removeTexture( res.texture ); }
        if( defined( res.imageBitmap ) ) { res.imageBitmap.close(); }
    }
}