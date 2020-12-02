SketchBase ([Demo](https://themikelester.github.io/SketchBase))
================

<img src="https://user-images.githubusercontent.com/667526/100838429-82f20480-34c6-11eb-9451-56e8c0c933e1.png" width="50%" align="right" />

A tiny game engine for the browser.

Development
=======

* Install yarn and git
* `yarn install` to download necessary dependencies
* `yarn start` and then visit http://localhost:8080
* `yarn build` to compile a production bundle (and see the bundle size)
* `yarn deploy` to deploy directly to github pages

Features
=====

Hotloading
----------
Make changes to the typescript code, see it reflected instantly (well, < 1 second) in the browser, without losing the game state. Most of the heavy lifting is done by Webpack's [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) feature. On the game side, the Meta system takes place of registering class constructors so that their prototypes can be patched when new code is hotloaded. Any class that is meta registered is hotloadable. Essentially: all objects remain untouched, but their prototypes point to the functions defined in the hotloaded code.

DebugMenu
---------
<img src="https://user-images.githubusercontent.com/667526/100840880-9c954b00-34ca-11eb-8521-26b549e9ed67.png" width="20%" align="right" />
dat.GUI is used to provide a handy menu that's usable on both mobile and desktop.
Modules can add categories and tweaks using `DebugMenu.addFolder(...)` and `DebugMenu.add(...)`. 
Bools, floats, ints, and colors are all acceptable types. `DebugMenu.add(...).onChanged( callback )` can be used to perform extra actions on change.

Profiling
---------
<img src="https://user-images.githubusercontent.com/667526/100838104-f6dfdd00-34c5-11eb-87a4-650bf2e324a7.png" width="40%" align="right" />
In addition to the Chrome profiler, there is also a "Profile HUD" which displays instrumented timings in real-time.
This is very useful in combination with hotloading, as you can see the performance impact of a code change immediately. 
It also makes it easy to see quick profiling data when DevTools aren't easily available, such as on mobile.
By default, all module functions are instrumented (e.g. `Compositor::Update()`). To add finer timings, wrap code in 
`Profile.begin( entryName )` and `Profile.end( entryName)` calls. 

<img src="https://user-images.githubusercontent.com/667526/100840779-7d96b900-34ca-11eb-9bb9-dd69bcf1455b.png" width="40%" align="right" />
All instrumented sections also appear in Chrome's 
Performance tab in the "User Timings" section. 

License
=======
TODO