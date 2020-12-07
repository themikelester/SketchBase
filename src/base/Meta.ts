//----------------------------------------------------------------------------------------------------------------------
// Notes:  Collects type information about Classes/Methods/MemberVariables so that dependencies between Modules are easy
//         to manage. The Module system uses this information to pass all necessary variables to member functions such
//         as initialize(), update(), etc.
//
//         Currently, Typescript "decorators" are used to register things with the meta system. These decorators make
//         use of an extension to the Javascript Reflection system which is polyfilled by the "reflect-metadata"
//         package (but actually we use a smaller subset of that package). This metadata Reflection extension is a
//         proposal for ES7, at which point the dependency could be removed.
//
//         Member variables can also store arbitrary metadata in the form of key value pairs.
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
import { Reflection as Reflect } from '@abraham/reflection';
import { assert, assertDefined, assertString } from './Util';

//----------------------------------------------------------------------------------------------------------------------
// Internal Types
//----------------------------------------------------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReflectType = any;
type TypeName = string;

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
type Constructor = new ( ...args: any[] ) => Object;

//----------------------------------------------------------------------------------------------------------------------
// Exported Types
//----------------------------------------------------------------------------------------------------------------------
export interface MemVar
{
    type: TypeName;
    metadata: Record< string, string >;
}

export interface MemFunc
{
    returnType: TypeName;
    paramTypes: TypeName[];
}

export class Class
{
    cons: Constructor;
    vars: Record< string, MemVar > = {};
    funcs: Record< string, MemFunc > = {};
}

export const MetaTable: Record<string, Class> = {};

//----------------------------------------------------------------------------------------------------------------------
// Decorators. Use these to meta-register methods and member variables.
//----------------------------------------------------------------------------------------------------------------------
export const metaClass: ClassDecorator = target => {
    if( !MetaTable[ target.name ] ) {
        MetaTable[ target.name ] = new Class();
        MetaTable[ target.name ].cons = target as unknown as Constructor;
    }
    else {
        // In the event of a Hotload, the new constructor will have the updated prototype. Exisiting objects still use
        // the old prototype. Copy all the properties to the new prototype, which essentially updates all functions.
        const currentPrototype = MetaTable[ target.name ].cons.prototype;
        const newPrototype = target.prototype;
        if( currentPrototype != newPrototype ) {
            updateObjectMembers( currentPrototype, newPrototype );
        }
    }
}

export const metaVar: PropertyDecorator = ( target, propertyKey: string | symbol ) => {
    const className = target.constructor.name;

    // Create the table entry for this class if it does not already exist
    metaClass( target.constructor );

    // Add this property to the class
    const type = Reflect.getMetadata( 'design:type', target, propertyKey ) as ReflectType;
    assert( type.name !== "Object", "Unable to determine the type of " + propertyKey.toString()
        + " for object " + className + ". Try explicitly setting the type." );

    MetaTable[ className ].vars[ assertString( propertyKey ) ] = { type: type.name, metadata: {}};
};

export const metaFunc: MethodDecorator = ( target, propertyKey: string | symbol ) => {
    const className = target.constructor.name;

    // Create the table entry for this class if it does not already exist
    metaClass( target.constructor );

    // Add this method and the types of each of its parameters to the class
    const paramTypes = Reflect.getMetadata( 'design:paramtypes', target, propertyKey ) as ReflectType[];
    const returnType = Reflect.getMetadata( 'design:returntype', target, propertyKey ) as ReflectType;

    MetaTable[ className ].funcs[ assertString( propertyKey ) ] = {
        paramTypes: paramTypes.map( p => p.name ),
        returnType: returnType ? returnType.name : "null"
    };
};

//----------------------------------------------------------------------------------------------------------------------
// Functions
//----------------------------------------------------------------------------------------------------------------------
export function setMemVarMetadata( className: string, memVarName: string, key: string, value: string ): void {
    const metaClass = assertDefined(  MetaTable[ className ] );
    const memVar = assertDefined( metaClass.vars[ memVarName ] );
    memVar.metadata[ key ] = value;
}

export function getMemVarMetadata( className: string, memVarName: string, metaDataKey: string ): string {
    const metaClass = assertDefined(  MetaTable[ className ] );
    const memVar = assertDefined( metaClass.vars[ memVarName ] );
    return memVar.metadata[ metaDataKey ];
}

//----------------------------------------------------------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------------------------------------------------------
function updateObjectMembers( dst: ObjectType, src: ObjectType ) {
    const currentProperties = new Set( Object.getOwnPropertyNames( dst ) );
    const newProperties = new Set( Object.getOwnPropertyNames( src ) );

    // Add new and overwrite existing properties/methods
    for( const prop of Object.getOwnPropertyNames( src ) ) {
      const descriptor = Object.getOwnPropertyDescriptor( src, prop );
      if( descriptor && descriptor.configurable ) {
        Object.defineProperty( dst, prop, descriptor );
      }
    }

    // Delete removed properties
    for( const existingProp of currentProperties ) {
      if( !newProperties.has( existingProp ) ) {
        try {
          delete dst[ existingProp ];
        } catch {
            // Do nothing
        }
      }
    }
  }