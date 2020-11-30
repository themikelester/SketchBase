//----------------------------------------------------------------------------------------------------------------------
// Notes:  A convenience class which allocates a uniform buffer based on a BufferLayout, and also provides functions to
//         write data to that buffer based on a uniform name.
//
//         NOTE: !!! Data will not be written to the GPU buffer until you call write() !!!
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
import * as Gfx from './GfxApiTypes';
import { assertDefined, defaultValue } from './Util';

//----------------------------------------------------------------------------------------------------------------------
// Defining a PackedBuffer is a lot easier than manually computing offsets. E.g:
//   public static bufferLayout: Gfx.BufferLayout = computePackedBufferLayout({
//     g_camPos: { type: Gfx.Type.Float3 },
//     g_proj: { type: Gfx.Type.Float4x4 },
//     g_viewProj: { type: Gfx.Type.Float4x4 },
//   });
//----------------------------------------------------------------------------------------------------------------------
export interface BufferPackedLayout {
  [name: string]: {
    type: Gfx.Type,
    count?: number,
  }
}

export function computePackedBufferLayout( packedLayout: BufferPackedLayout ): Gfx.BufferLayout {
  const layout: Gfx.BufferLayout = {};

  let bufferSize = 0;
  const names = Object.keys( packedLayout );
  for( let i = 0; i < names.length; i++ ) {
      const attrib = packedLayout[ names[ i ] ];
      layout[ names[ i ] ] = {
        ...attrib,
        offset: bufferSize,
      };
      bufferSize += Gfx.translateTypeToSize( attrib.type ) * defaultValue( attrib.count, 1 );
  }

  return layout;
}

//----------------------------------------------------------------------------------------------------------------------
// UniformBuffer
//----------------------------------------------------------------------------------------------------------------------
export class UniformBuffer {
  private readonly bufferLayout: Gfx.BufferLayout;

  private bufferSize = 0;
  private bufferData: ArrayBuffer;
  private bufferBytes: Uint8Array;
  private bufferFloats: Float32Array;
  private buffer: Gfx.Id;

  getBufferView(): Gfx.BufferView { return { buffer: this.buffer, byteOffset: 0 }; }
  getBufferLayout(): Gfx.BufferLayout { return this.bufferLayout; }

  // @TODO: Allow constructor to take a BufferView instead of creating one. Allow multiple UniformBuffers per GPU buffer
  constructor( name: string, renderer: Gfx.Renderer, bufferLayout: Gfx.BufferLayout ) {
    this.bufferLayout = bufferLayout;

    // If we're creating the buffer, size it so that the uniform with the highest offset just fits
    const names = Object.keys( this.bufferLayout );
    let lastUniform = this.bufferLayout[ names[ 0 ] ];
    for( let i = 1; i < names.length; i++ ) {
      const uniform = this.bufferLayout[ names[ i ] ];
      if( uniform.offset > lastUniform.offset ) { lastUniform = uniform; }
    }
    this.bufferSize = lastUniform.offset + getUniformSize( lastUniform );

    this.bufferData = new ArrayBuffer( this.bufferSize );
    this.bufferBytes = new Uint8Array( this.bufferData );
    this.bufferFloats = new Float32Array( this.bufferData );
    this.buffer = renderer.createBuffer( name, Gfx.BufferType.Uniform, Gfx.Usage.Dynamic, this.bufferSize );
  }

  setFloat( name: string, value: number ): void {
    const uniform = assertDefined( this.bufferLayout[ name ], `Attempted to set unknown uniform ${name}` );
    this.bufferFloats[ uniform.offset / 4 ] = value;
  }

  setVec2( name: string, v: ArrayLike<number> ): void {
    const uniform = assertDefined( this.bufferLayout[ name ], `Attempted to set unknown uniform ${name}` );
    this.bufferFloats.set( v, uniform.offset / 4 );
  }

  setVec3( name: string, v: ArrayLike<number> ): void {
    const uniform = assertDefined( this.bufferLayout[ name ], `Attempted to set unknown uniform ${name}` );
    this.bufferFloats.set( v, uniform.offset / 4 );
  }

  setVec4( name: string, v: ArrayLike<number> ): void {
    const uniform = assertDefined( this.bufferLayout[ name ], `Attempted to set unknown uniform ${name}` );
    this.bufferFloats.set( v, uniform.offset / 4 );
  }

  setMat4( name: string, m: ArrayLike<number> ): void {
    const uniform = assertDefined( this.bufferLayout[ name ], `Attempted to set unknown uniform ${name}` );
    this.bufferFloats.set( m, uniform.offset / 4 );
  }

  setBytes( name: string, value: ArrayLike<number> ): void {
    const uniform = assertDefined( this.bufferLayout[ name ], `Attempted to set unknown uniform ${name}` );
    if( value.length !== getUniformSize( uniform ) ) { throw new Error( 'Invalid size' ); }
    this.bufferBytes.set( value, uniform.offset );
  }

  setFloats( name: string, value: ArrayLike<number> ): void {
    const uniform = assertDefined( this.bufferLayout[ name ], `Attempted to set unknown uniform ${name}` );
    if( value.length > getUniformSize( uniform ) / 4 ) { throw new Error( 'Invalid size' ); }
    this.bufferFloats.set( value, uniform.offset / 4 );
  }

  getFloatArray( name: string ): Float32Array {
    const uniform = this.bufferLayout[ name ];
    if( !uniform ) { throw new Error( `Attempted to set unknown uniform ${name}` ); }
    return new Float32Array( this.bufferData, uniform.offset, getUniformSize( uniform ) / 4 );
  }

  write( renderer: Gfx.Renderer ): void {
    renderer.writeBufferData( this.buffer, 0, this.bufferBytes );
  }

  terminate( renderer: Gfx.Renderer ): void {
    renderer.removeBuffer( this.buffer );
  }
}

function getUniformSize( uniform: Gfx.BufferLayout[0]): number {
  return Gfx.translateTypeToSize( uniform.type ) * defaultValue( uniform.count, 1 );
}