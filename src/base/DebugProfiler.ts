import { DebugMenu } from "./DebugMenu";
import { metaClass } from "./Meta";
import { assertDefined } from "./Util";

const kWidth = 300;
const kPad = 4;
const kBarHeight = 16;
const kBackgroundColor = '#222';

type ProfileEntry = {
    aveBegin: number;
    aveEnd: number;
};

@metaClass
export class DebugProfiler {
    parent: HTMLElement;
    dom: HTMLElement;
    ctx: CanvasRenderingContext2D;
    profiles: Map<string, ProfileEntry> = new Map();

    enabled = false;
    targetFrameTimeMs = 2;

    initialize( parentElement: HTMLElement, debugMenu: DebugMenu ): void {
        this.parent = parentElement;
        this.dom = document.createElement( 'div' );
        this.dom.style.cssText = 'opacity:0.75;position:absolute;z-index:10000;pointer-events:none;margin:8px';

        const canvas = document.createElement( 'canvas' );
        this.ctx = assertDefined( canvas.getContext( '2d' ) );
        this.dom.appendChild( canvas );

        const menu = debugMenu.addFolder( "Profiler" );
        menu.add( this, "enabled" ).onChange( () => this.setEnabled( this.enabled ) );
    }

    setEnabled( enabled: boolean ): void {
        this.enabled = enabled;

        if( this.dom.parentNode ) { this.dom.parentNode.removeChild( this.dom ); }
        if( enabled ) { this.parent.appendChild( this.dom ); }

        this.profiles.clear();
    }

    update(): void {
        const entries = performance.getEntriesByType( "measure" );
        const frameStartMark = performance.getEntriesByName( "FrameStart", "mark" );
        performance.clearMeasures();
        performance.clearMarks();

        const frameStart = frameStartMark[ 0 ].startTime;
        const frameDuration = this.targetFrameTimeMs;

        for( let i = 0; i < entries.length; i++ ) {
            const entry = entries[ i ];
            const profile = this.profiles.get( entry.name );

            const begin = entry.startTime - frameStart;
            const end = entry.startTime + entry.duration - frameStart;

            // If this is a new entry, reset
            if( !profile ) {
                this.profiles.set( entry.name, {
                    aveBegin: begin,
                    aveEnd: end,
                } );
            } else {
                const sampleWeight = 0.03;
                profile.aveBegin = lerp( profile.aveBegin, begin, sampleWeight );
                profile.aveEnd = lerp( profile.aveEnd, end, sampleWeight );
            }
        }

        // Resize if necessary
        this.ctx.canvas.height = kPad + entries.length * ( kPad + kBarHeight );
        this.ctx.font = 9 + 'px Helvetica,Arial,sans-serif';
        this.ctx.textBaseline = 'middle';

        // Clear the graph
        this.ctx.fillStyle = kBackgroundColor;
        this.ctx.fillRect( 0, 0, this.ctx.canvas.width, this.ctx.canvas.height );

        // Draw profile bars
        let i = 0;
        this.ctx.fillStyle = 'red';
        for( const [ _, entry ] of this.profiles.entries() ) {
            const startTime = entry.aveBegin;
            const duration = entry.aveEnd - entry.aveBegin;
            const startX = kPad + startTime / frameDuration * kWidth
            const startY = kPad + ( i++ ) * ( kPad + kBarHeight );
            const barWidth = duration / frameDuration * kWidth;
            this.ctx.fillRect( startX, startY, barWidth, kBarHeight );
        }

        // Draw profile text on top
        i = 0;
        this.ctx.fillStyle = 'white';
        for( const [ name, entry ] of this.profiles.entries() ) {
            const duration = entry.aveEnd - entry.aveBegin;
            const startY = kPad + ( i++ ) * ( kPad + kBarHeight );
            const barText = name + ": " + duration.toFixed( 2 ) + " ms";
            this.ctx.fillText( barText, kPad, startY + kBarHeight * 0.5 );
        }
    }
}

export function lerp( p: number, q: number, t: number ): number {
    return ( 1.0 - t ) * p + t * q;
  }