//----------------------------------------------------------------------------------------------------------------------
// Notes:  A simple module to render a debug grid. Size and style is configurable via the debug menu.
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
import * as Gfx from '../base/GfxApiTypes';
import vertShaderSource from '../base/shaders/grid.vert';
import fragShaderSource from '../base/shaders/grid.frag';
import { GlobalUniforms } from '../base/GfxGlobalUniforms';
import { RenderPrimitive } from '../base/GfxRenderPrimitive';
import { computePackedBufferLayout, UniformBuffer } from '../base/GfxUniformBuffer';
import { vec4 } from 'gl-matrix';
import { metaClass } from '../base/Meta';
import { BaseProcess, ProcessStatus } from '../base/Process';
import { Game } from '../game';

class GridShader implements Gfx.ShaderDescriptor {
    private static vert = vertShaderSource;
    private static frag = fragShaderSource;

    public static UniformLayout = computePackedBufferLayout( {
        u_baseColor: { type: Gfx.Type.Float4 },
        u_lineColor: { type: Gfx.Type.Float4 },
        u_gridUnit: { type: Gfx.Type.Float },
        u_gridRadius: { type: Gfx.Type.Float },
    } );

    public static resourceLayout = {
        globalUniforms: { index: 0, type: Gfx.BindingType.UniformBuffer, layout: GlobalUniforms.bufferLayout },
        uniforms: { index: 1, type: Gfx.BindingType.UniformBuffer, layout: GridShader.UniformLayout }
    };

    public readonly name = 'GridShader';
    public readonly vertSource = GridShader.vert.sourceCode;
    public readonly fragSource = GridShader.frag.sourceCode;
    public id: Gfx.Id;
}

@metaClass
export class DebugGrid extends BaseProcess {
    private baseColor = vec4.fromValues( 0.3, 0.3, 0.3, 1.0 );
    private lineColor = vec4.fromValues( 1.0, 1.0, 1.0, 1.0 );
    private gridUnit = 100.0;
    private gridRadius = 5000.0;
    private enabled = true;

    private primitive: RenderPrimitive;
    private uniforms: UniformBuffer;

    initialize( game: Game ): ProcessStatus {
        const gfxDevice = game.gfxDevice;
        const globalUniforms = game.globalUniforms;
        const debugMenu = game.debugMenu;

        // Safari does not support WebGL2, so no version 300 GLSL which we use for derivatives
        // This could be written as a 100 shader with an extension, but its just a debug feature
        if( !gfxDevice.isGfxFeatureSupported( Gfx.Feature.ShaderGlsl300 ) ) {
            console.warn( 'GLSL version 300 not supported, disabling DebugGrid' );
            this.enabled = false;
            return ProcessStatus.Error;
        }

        const shader = gfxDevice.createShader( new GridShader() );
        const renderFormat: Gfx.RenderFormat = { blendingEnabled: false };
        const resourceLayout = GridShader.resourceLayout;
        const vertexLayout: Gfx.VertexLayout = {
            buffers: [{
                stride: 2,
                layout: {
                    a_pos: { type: Gfx.Type.Char2, offset: 0 }
                }
            }]
        };

        const pipeline = gfxDevice.createRenderPipeline( shader, renderFormat, vertexLayout, resourceLayout );

        const vtxData = new Int8Array( [ -1, -1, 1, -1, -1, 1, 1, 1 ] );
        const idxData = new Uint16Array( [ 0, 2, 1, 1, 2, 3 ] );
        const vertexBuffer = gfxDevice.createBuffer( 'GridVertices', Gfx.BufferType.Vertex, Gfx.Usage.Static, vtxData );
        const indexBuffer = gfxDevice.createBuffer( 'GridIndices', Gfx.BufferType.Index, Gfx.Usage.Static, idxData );

        const resources = gfxDevice.createResourceTable( resourceLayout );
        this.uniforms = new UniformBuffer( 'GridUniforms', gfxDevice, GridShader.UniformLayout );
        gfxDevice.setBuffer( resources, 0, globalUniforms.bufferView );
        gfxDevice.setBuffer( resources, 1, this.uniforms.getBufferView() );

        const vertexTable = gfxDevice.createVertexTable( pipeline );
        gfxDevice.setVertexBuffer( vertexTable, 0, { buffer: vertexBuffer } );

        this.primitive = new RenderPrimitive( pipeline, vertexTable, resources );
        this.primitive.indexBuffer = { buffer: indexBuffer };
        this.primitive.indexType = Gfx.Type.Ushort;
        this.primitive.elementCount = 6;

        if( debugMenu ) {
            const menu = debugMenu.addFolder( 'DebugGrid' );
            menu.add( this, 'enabled' );
            menu.add( this, 'gridUnit', 1, 100, 10 );
            menu.add( this, 'gridRadius' );
        }

        return ProcessStatus.Complete;
    }

    update( game: Game ): void {
        if( this.enabled ) {
            this.uniforms.setVec4( 'u_baseColor', this.baseColor );
            this.uniforms.setVec4( 'u_lineColor', this.lineColor );
            this.uniforms.setFloat( 'u_gridUnit', this.gridUnit );
            this.uniforms.setFloat( 'u_gridRadius', this.gridRadius );
            this.uniforms.write( game.gfxDevice );

            game.scene.getRenderList( "opaque" ).push( this.primitive );
        }
    }
}