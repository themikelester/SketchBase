
export function assert( b: boolean, message = "" ): void {
    if( !b ) {
        const error = new Error( `Assert fail: ${message}` );
        console.error( error.stack );
        throw error;
    }
}

export function assertDefined<T>( v: T | null | undefined, msg?: string ): NonNullable<T> {
    if( v !== undefined && v !== null )
        { return v as NonNullable<T>; }
    else
        { throw new Error( defaultValue( msg, "Missing object" ) ); }
}

export function assertString<T>( v: T, msg?: string ): NonNullable<string> {
    if( typeof v == "string" )
        { return v; }
    else
        { throw new Error( defaultValue( msg, "Expected Object to be a non-null string" ) ); }
}

export function defined<T>( v: T ): v is NonNullable<T> {
    return v !== undefined && v !== null;
}

export function defaultValue<T>( v: T | undefined, fallback: T ): T {
    return ( v !== undefined && v !== null ) ? v : fallback;
}

// Remove the element n from an array, or assert if it does not exist
export function arrayRemove<T>( L: T[], n: T ): number {
    const idx = L.indexOf( n );
    assert( idx >= 0 );
    L.splice( idx, 1 );
    return idx;
}

// Create an array of length n and initialize each element with the constructor c
export function nArray<T>( n: number, c: () => T ): T[] {
    const d = new Array( n );
    for( let i = 0; i < n; i++ )
        { d[ i ] = c(); }
    return d;
}

/**
 * Hash a string into a 32-bit integer
 * @param str The string to hash
 */
export function hashString32( str: string ): number {
    let hash = 0;
    for( let i = 0; i < str.length; i++ ) {
        { hash = Math.imul( 31, hash ) + str.charCodeAt( i ) | 0; }
    }

    return hash;
}