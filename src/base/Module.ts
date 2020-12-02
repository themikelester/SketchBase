//----------------------------------------------------------------------------------------------------------------------
// Notes:  Module is an interface for subsystems. The idea is large contexts, like Game, should mainly be a collection
//         of modules. Modules can have their meta-registered functions called automatically by this system. The
//         parameters will be filled based on their meta-type from the specified game object. E.g:
//
//         callFunction( "initialize", kDirection_Forward ) will call initialize() on each of the objects from Game that
//         have the @Module decorator, in the order that they're specified in the class.
//
// Author: Mike Lester
// Date C: 2020/11/27
//----------------------------------------------------------------------------------------------------------------------
/* eslint-disable @typescript-eslint/ban-types */

import { Profile } from './DebugProfiler';
import { MetaTable, metaVar, setMemVarMetadata } from './Meta';
import { assert, assertString } from './Util';

const kMetadataIdModuleGroup = "ModuleGroup";

export enum ModuleDirection {
    Forward,
    Reverse
}

//----------------------------------------------------------------------------------------------------------------------
// Module Decorator. Place this before any objects that wish to be treated as Modules.
//----------------------------------------------------------------------------------------------------------------------
export const module: PropertyDecorator = ( target, propertyKey: string | symbol ) => {
    // Automatically meta register this member variable
    metaVar( target, propertyKey );

    const memVarName = assertString( propertyKey );
    setMemVarMetadata( target.constructor.name, memVarName, kMetadataIdModuleGroup, "All" )
};

//----------------------------------------------------------------------------------------------------------------------
// Internal Types
//----------------------------------------------------------------------------------------------------------------------
interface Module {
    type: string;
    group: string;
    object: ObjectType;
    funcArgs: Record<string, unknown[]>
}

//----------------------------------------------------------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------------------------------------------------------
function buildParamArray( game: ObjectType, paramTypes: string[], funcName: string, className: string ): unknown[] {
    const memVars = MetaTable[ game.constructor.name ].vars;
    const memVarNames = Object.keys( memVars );
    const memVarTypes = memVarNames.map( name => memVars[ name ].type );

    const paramValues = paramTypes.map( type => {
        const memVarIdx = memVarTypes.indexOf( type );
        assert( memVarIdx != -1, "Game object does not contain a meta-registered variable of type " + type +
            ". Required by the " + funcName + " function of " + className );
        return game[ memVarNames[ memVarIdx ] ];
    } );

    return paramValues;
}

//----------------------------------------------------------------------------------------------------------------------
// ModuleBarn
//----------------------------------------------------------------------------------------------------------------------
export class ModuleBarn {
    private modules: Module[] = [];
    private functions: string[];

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    initialize( game: any, functionList: string[] ): void {
        this.functions = functionList;

        // Find all meta-registered modules on the Game object
        const memVars = MetaTable[ game.constructor.name ].vars;
        for( const name of Object.keys( memVars ) ) {
            const moduleGroup = memVars[ name ].metadata[ kMetadataIdModuleGroup ];
            if( moduleGroup ) {
                this.modules.push( {
                    type: memVars[ name ].type,
                    group: moduleGroup,
                    object: game[ name ] as ObjectType,
                    funcArgs: {}
                } )
            }
        }

        // For each module, pre-cache an array of arguments for each function in the list
        for( const module of this.modules ) {
            const metaClass = MetaTable[ module.type ];
            for( const funcName of this.functions ) {
                const metaFunc = metaClass.funcs[ funcName ];
                if( metaFunc ) {
                    module.funcArgs[ funcName ] = buildParamArray( game, metaFunc.paramTypes, funcName, module.type );
                }
            }
        }
    }

    callFunction( funcName: string, direction: ModuleDirection = ModuleDirection.Forward ): void {
        assert( this.functions.includes( funcName ) );
        Profile.begin( 'Module: ' + funcName );

        const reverse = direction == ModuleDirection.Reverse;
        const moduleCount = this.modules.length;

        for( let i = 0; i < moduleCount; i++ ) {
            const module = this.modules[ reverse ? moduleCount - 1 - i : i ];
            const funcArgs = module.funcArgs[ funcName ];
            if( funcArgs ) {
                Profile.begin( module.type );
                ( module.object[ funcName ] as Function )( ...funcArgs );
                Profile.end( module.type );
            }
        }

        Profile.end( 'Module: ' + funcName );
    }
}