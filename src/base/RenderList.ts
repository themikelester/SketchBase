//----------------------------------------------------------------------------------------------------------------------
// Notes:  A collection of primitives that will be rendered this frame. The only way to draw a RenderPrimitive is to add
//         it to a RenderList which is referenced by the RenderOutline. Because RenderOutline is statically defined, we
//         always know the context in which a primitive added to this list will be rendered. E.g. the blending mode.
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
import { IRenderPrimitive } from './RenderPrimitive';
import { Id, CullMode, DepthStateDescriptor, RenderFormat } from './gfx/GfxTypes';

export class RenderList {
    primitives: IRenderPrimitive[] = [];
    defaultDepthStateId: Id;

    constructor(
        public defaultCullMode: CullMode,
        public defaultDepthState: DepthStateDescriptor,
        public renderFormat: RenderFormat ) {}

    push( primitive: IRenderPrimitive ): void {
        // @TODO: Validate primitive
        this.primitives.push( primitive );
    }
}