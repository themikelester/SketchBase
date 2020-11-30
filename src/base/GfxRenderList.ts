//----------------------------------------------------------------------------------------------------------------------
// Notes:  A collection of primitives that will be rendered this frame. The only way to draw a RenderPrimitive is to add
//         it to a RenderList which is referenced by the RenderOutline. Because RenderOutline is statically defined, we
//         always know the context in which a primitive added to this list will be rendered. E.g. the blending mode.
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
import { RenderPrimitive } from './GfxRenderPrimitive';
import { Id, CullMode, DepthStateDescriptor, RenderFormat } from './GfxApiTypes';

export class RenderList {
    primitives: RenderPrimitive[] = [];
    defaultDepthStateId: Id;

    constructor(
        public defaultCullMode: CullMode,
        public defaultDepthState: DepthStateDescriptor,
        public renderFormat: RenderFormat ) {}

    push( primitive: RenderPrimitive ): void {
        // @TODO: Validate primitive
        this.primitives.push( primitive );
    }
}