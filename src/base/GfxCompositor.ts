//----------------------------------------------------------------------------------------------------------------------
// Notes:  All of the rendering for the frame is performed here. Compositor's job is to process a RenderOutline into
//         graphics API calls. It also creates the graphics API objects that are described by the RenderOutline, such as
//         render passes, state objects, and command lists.
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
import * as Gfx from './gfx/GfxTypes';
import { RenderList } from './GfxRenderList';
import { assertDefined, defined, defaultValue } from './Util';
import { DebugMenu } from './DebugMenu';
import { MetaFunc } from './Meta';
import { Scene } from '../scene';

export class Compositor {
    private width: number;
    private height: number;

    public resolutionScale = 1.0;

    @MetaFunc initialize( debugMenu: DebugMenu ): void {
        // Debug
        const folder = debugMenu.addFolder( 'Compositor' );
        folder.add( this, 'resolutionScale', 1, 16, 1 );
    }

    @MetaFunc render( canvas: HTMLCanvasElement, gfxDevice: Gfx.Renderer, scene: Scene ): void {
        // Resize the back buffer if either the canvas size of resolution scale has changed
        this.width = Math.round( canvas.clientWidth * devicePixelRatio / this.resolutionScale );
        this.height = Math.round( canvas.clientHeight * devicePixelRatio / this.resolutionScale );
        if( this.width !== canvas.width || this.height !== canvas.height ) {
            canvas.width = this.width;
            canvas.height = this.height;
            if( gfxDevice ) { gfxDevice.resize( canvas.width, canvas.height ); }
        }

        const outline = scene.getRenderOutline();

        // All the drawing work goes here
        gfxDevice.beginFrame();
        gfxDevice.bindRenderPass( Gfx.kDefaultRenderPass );
        {
            for( const cmd of outline ) {
                if( cmd instanceof RenderList ) { executeRenderList( gfxDevice, cmd ); }
            }
        }
        gfxDevice.endFrame();

        // Clear render lists
        scene.clearRenderLists();
    }
}

function executeRenderList( gfxDevice: Gfx.Renderer, list: RenderList ) {
    const primCount = list.primitives.length;
    for( let i = 0; i < primCount; i++ ) {
        const prim = list.primitives[ i ];

        gfxDevice.bindPipeline( prim.renderPipeline );
        gfxDevice.bindVertices( prim.vertexTable );
        gfxDevice.bindResources( prim.resourceTable );

        gfxDevice.setCullMode( list.defaultCullMode );
        gfxDevice.setDepthStencilState( list.defaultDepthStateId );

        if( defined( prim.indexBuffer ) ) {
            const indexSize = prim.indexType === Gfx.Type.Ushort ? 2 : 4;
            const indexOffset = defaultValue( prim.indexBuffer.byteOffset, 0 ) / indexSize;
            if( defined( prim.instanceCount ) ) {
                gfxDevice.drawInstanced( prim.type, prim.indexBuffer.buffer, assertDefined( prim.indexType ),
                    indexOffset, prim.elementCount, prim.instanceCount )
            } else {
                gfxDevice.draw( prim.type, prim.indexBuffer.buffer, assertDefined( prim.indexType ),
                    indexOffset, prim.elementCount );
            }
        }
        else {
            gfxDevice.drawNonIndexed( prim.type, 0, prim.elementCount );
        }
    }
}