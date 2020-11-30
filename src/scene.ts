import { RenderList } from './base/GfxRenderList';
import { CullMode, Renderer } from './base/gfx/GfxTypes';
import { assertDefined } from './base/Util';
import { MetaFunc } from './base/Meta';

// @TODO: Better outline
type RenderPassDescriptor = number;
type RenderOutline = Array<RenderList | RenderPassDescriptor>

const blendingOff = { blendingEnabled: false };
const blendingOn = { blendingEnabled: true };

const renderLists: Record<string, RenderList> = {
    opaque: new RenderList( CullMode.Back, { depthWriteEnabled: true, depthTestEnabled: true }, blendingOff ),
    ui: new RenderList( CullMode.None, { depthWriteEnabled: false, depthTestEnabled: false }, blendingOn ),
}

const renderOutline: RenderOutline = [
    renderLists.opaque,
    renderLists.ui
];

export class Scene {
    @MetaFunc initialize( gfxDevice: Renderer ): void {
        // Parse RenderLists and allocate any GFX resources they may need
        for( const listName in renderLists ) {
            const list = renderLists[ listName ];
            list.defaultDepthStateId = gfxDevice.createDepthStencilState( list.defaultDepthState );
        }
    }

    getRenderList( name: string ): RenderList {
        return assertDefined( renderLists[ name ], "Expected render list " + name + " is not defined" );
    }

    getRenderOutline(): RenderOutline {
        return renderOutline;
    }

    clearRenderLists(): void {
        for( const listName in renderLists ) {
            renderLists[ listName ].primitives.length = 0;
        }
    }
}