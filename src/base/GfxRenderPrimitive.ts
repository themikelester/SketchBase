//----------------------------------------------------------------------------------------------------------------------
// Notes:  The most basic information needed to render something to the screen. Add this primitive to a RenderList.
//         Essentially an encapsulation of a draw call.
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------

import { Id, BufferView, PrimitiveType, Type, CullMode } from './GfxApiTypes';

export class RenderPrimitive {
    public resourceTable: Id;
    public vertexTable: Id;
    public renderPipeline: Id;
    public elementCount: number;
    public type: PrimitiveType;

    public indexBuffer?: BufferView;
    public indexType?: Type

    public depthMode?: Id;
    public cullMode?: CullMode;

    public instanceCount?: number;

    constructor( renderPipeline: Id, vertexTable: Id, resourceTable: Id ) {
        this.resourceTable = resourceTable;
        this.vertexTable = vertexTable;
        this.renderPipeline = renderPipeline;

        this.elementCount = 0;
        this.type = PrimitiveType.Triangles;
    }
}