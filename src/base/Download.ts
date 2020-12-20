//----------------------------------------------------------------------------------------------------------------------
// Notes:  A basic download manager to abstract away HTTP complexities. Also allows for a synchronous interface, where
//         load*() is called once to initiate the download, followed by calls to get() until the download is ready.
//
//         @TODO: Make the requests and do the processing on a worker, a la ResourceManager, to avoid main thread stalls
//
// Author: Mike Lester
// Date C: 2020/12/20
//----------------------------------------------------------------------------------------------------------------------

import { metaClass } from "./Meta";

export enum DownloadStatus {
    Fetching,
    Loading,
    Complete,
    Error
}

export class DownloadData {
    public status: DownloadStatus = DownloadStatus.Fetching;
    public error: Nullable< string > = null;
    public buffer: Nullable< ArrayBuffer > = null;
    public json: Nullable< unknown > = null;
}

@metaClass
export class DownloadBarn {
    private data: Map< string, DownloadData > = new Map();

    loadBuffer( uri: string ): DownloadData {
        const preexisting = this.data.get( uri );
        if( preexisting ) { return preexisting; }

        const result = new DownloadData();
        this.data.set( uri, result );

        this.fetch( uri, result ).then( async response => {
            if( response ) {
                result.buffer = await response.arrayBuffer();
                result.status = DownloadStatus.Complete;
            }
        } ).catch( ( error: Error ) => {
            result.status = DownloadStatus.Error;
            console.warn( `Load failed for uri ${ uri }: ${ error }` );
        } );

        return result;
    }

    loadJson( uri: string ): DownloadData {
        const preexisting = this.data.get( uri );
        if( preexisting ) { return preexisting; }

        const result = new DownloadData();
        this.data.set( uri, result );

        this.fetch( uri, result ).then( async response => {
            if( response ) {
                result.json = await response.json();
                result.status = DownloadStatus.Complete;
            }
        } ).catch( ( error: Error ) => {
            result.status = DownloadStatus.Error;
            console.warn( `Load failed for uri ${ uri }: ${ error }` );
        } );

        return result;
    }

    get( uri: string ): DownloadData | undefined {
        return this.data.get( uri );
    }

    clear(): void {
        this.data.clear();
    }

    private fetch( uri: string, result: DownloadData ) {
        return fetch( uri ).then( response => {
            result.status = DownloadStatus.Loading;
            result.status = response.status;
            if( response.status != 200 ) {
                throw `Status ${ response.status }`;
            }
            return response;
        } ).catch( ( error: Error ) => {
            result.error = error.message;
            result.status = DownloadStatus.Error;
            console.warn( `Download failed for uri ${ uri }: ${ error }` );
        } );
    }
}