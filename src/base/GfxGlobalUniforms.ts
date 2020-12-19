//----------------------------------------------------------------------------------------------------------------------
// Notes:  A buffer of uniforms that may be useful to many shaders, e.g. camera parameters. It is the systems'
//         responsibilty to update the values each frame, via setUniform. `GlobalUniforms.bufferLayout` is static so
//         that shaders can reference it in their resource layout.
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
import * as Gfx from './GfxApiTypes';
import { computePackedBufferLayout, UniformBuffer } from './GfxUniformBuffer';
import { metaFunc } from './Meta';

// --------------------------------------------------------------------------------
//
// --------------------------------------------------------------------------------
export class GlobalUniforms {
    public static bufferLayout: Gfx.BufferLayout = computePackedBufferLayout( {
        g_proj: { type: Gfx.Type.Float4x4 },
        g_viewProj: { type: Gfx.Type.Float4x4 },
        g_camPos: { type: Gfx.Type.Float3 },
        g_viewVec: { type: Gfx.Type.Float3 },
    } );

    public buffer: UniformBuffer;
    public bufferView: Gfx.BufferView;
    private renderer: Gfx.Renderer;

    @metaFunc
    initialize( gfxDevice: Gfx.Renderer ): void {
        this.renderer = gfxDevice;
        this.buffer = new UniformBuffer( 'GlobalUniforms', this.renderer, GlobalUniforms.bufferLayout );
        this.bufferView = this.buffer.getBufferView();
    }

    @metaFunc
    update(): void {
        this.buffer.write( this.renderer );
    }
}