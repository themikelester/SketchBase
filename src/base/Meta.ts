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
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
import { Reflection as Reflect } from '@abraham/reflection';

//----------------------------------------------------------------------------------------------------------------------
// Internal Types
//----------------------------------------------------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReflectType = any;
type TypeName = string;

//----------------------------------------------------------------------------------------------------------------------
// Exported Types
//----------------------------------------------------------------------------------------------------------------------
export interface MemVar
{
    type: TypeName;
}

export interface MemFunc
{
    returnType: TypeName;
    paramTypes: TypeName[];
}

export class Class 
{
    vars: Record< string, MemVar > = {};
    funcs: Record< string, MemFunc > = {};
}

export const MetaTable: Record<string, Class> = {};

//----------------------------------------------------------------------------------------------------------------------
// Decorators. Use these to meta-register methods and member variables.
//----------------------------------------------------------------------------------------------------------------------
export const MetaVar: PropertyDecorator = ( target, propertyKey: string | symbol ) => {
    // Create the table entry for this class if it does not already exist
    if( !MetaTable[target.constructor.name] ) { MetaTable[target.constructor.name] = new Class(); }

    // Add this property to the class
    const type = Reflect.getMetadata( 'design:type', target, propertyKey ) as ReflectType;
    if ( typeof propertyKey === 'string' ) {
        MetaTable[target.constructor.name].vars[propertyKey] = { type: type.name };
    }
};

export const MetaFunc: MethodDecorator = ( target, propertyKey: string | symbol ) => {
    // Create the table entry for this class if it does not already exist
    if( !MetaTable[target.constructor.name] ) { MetaTable[target.constructor.name] = new Class(); }

    // Add this method and the types of each of its parameters to the class
    const paramTypes = Reflect.getMetadata( 'design:paramtypes', target, propertyKey ) as ReflectType[];
    const returnType = Reflect.getMetadata( 'design:returntype', target, propertyKey ) as ReflectType;
    if ( typeof propertyKey === 'string' ) {
        MetaTable[target.constructor.name].funcs[propertyKey] = { 
            paramTypes: paramTypes.map(p => p.name),
            returnType: returnType ? returnType.name : "null"
        };
    }
};
