// --------------------------------------------------------------------------------------------------------------------
// A wonderful, beautiful Debug Menu GUI. See https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
//
// For bundle size, performance, and production reasons, the true dat.gui bundle is not loaded until it is first shown.
// Until thin, a thin shim layer collects all functions called on the static exported DebugMenu object. Once the menu
// is requested, the dat.gui bundle is downloaded and executed. All the buffered functions are called, and the shim
// objects' functions are rebound to the dat.gui functions.
// --------------------------------------------------------------------------------------------------------------------

import dat from "dat.gui"
import { metaFunc } from "./Meta";
import { assertDefined } from "./Util";

export class DebugMenu extends dat.GUI {
    @metaFunc initialize( rootElem: HTMLElement ): void {
        rootElem.appendChild( assertDefined( this.domElement.parentElement ) );
    }

    @metaFunc update(): void {
        { this.updateDisplay(); }
    }
}