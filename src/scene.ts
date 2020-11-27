import { RenderList } from './base/RenderList';
import { CullMode, Renderer } from './base/gfx/GfxTypes';
import { assertDefined } from './base/Util';
import { MetaFunc } from './base/Meta';

// @TODO: Better outline
type RenderPassDescriptor = number;
type RenderOutline = Array<RenderList | RenderPassDescriptor>

const renderLists: Record<string, RenderList> = {
    opaque: new RenderList( CullMode.Back, { depthWriteEnabled: true, depthTestEnabled: true }, { blendingEnabled: false } ),
    ui: new RenderList( CullMode.None, { depthWriteEnabled: false, depthTestEnabled: false }, { blendingEnabled: true } ),
}

const renderOutline: RenderOutline = [
    renderLists.opaque,
    renderLists.ui
];

export class Scene {
    @MetaFunc initialize( gfxDevice: Renderer ): void
    {
        // Parse RenderLists and allocate any GFX resources they may need
        for ( const list in renderLists ) {
            renderLists[list].defaultDepthStateId = gfxDevice.createDepthStencilState( renderLists[list].defaultDepthState );
        }        
    }

    GetRenderList( name: string ): RenderList {
        return assertDefined( renderLists[ name ], "Expected render list " + name + " is not defined" );
    }

    GetRenderOutline(): RenderOutline {
        return renderOutline;
    }

    ClearRenderLists(): void {
        for( const listName in renderLists ) {
            renderLists[ listName ].primitives.length = 0;
        }
    }
}