Welcome to the Kylo Browser source code!
----------------------------------------

Kylo is a web browser based on Mozilla's Gecko SDK for use on computers 
connected to TVs. 

Kylo's on-screen controls are intended to be viewable from about 10 feet away from a 32" or greater HDTV screen running at 720 or higher resolution. Kylo was originally designed as companion software to the Loop&trade; in-air motion pointer from [Hillcrest Labs](http://hillcrestlabs.com). Navigation is done primarily through pointer control, such as with a motion controller (ie. [WarpiaTV](http://www.warpia.com/products/warpiatv-swp500)) or a mouse. Some work has been done to allow control with a standard Up/Down/Left/Right remote control.

__Some helpful documents:__  

- directory_map.txt  
This file describes the basic outline of the Kylo source code directory structure.

- build_instructions.md
Basic documentation of the Kylo build process.

- LICENSE  
Lawyer stuff. Lists Open Source licenses and terms.
	
- TRADEMARKS  
Helpful info regarding use of the Kylo name and trademarks. If you're planning on distributing a modified version of Kylo, YOU SHOULD READ THIS.

For more information about Hillcrest Labs, please visit [hillcrestlabs.com](http://hillcrestlabs.com).


Modern runtime
--------------

Kylo's original XULRunner/Gecko 10-12 runtime is kept in the tree for historical reference, but it should no longer be used for normal browsing. The maintained runtime path is now the Electron/Chromium shell in `src/modern`, which preserves the 10-foot TV controls (large toolbar, pointer-friendly targets, tabs, zoom, fullscreen, and remote-friendly keyboard shortcuts) while moving web content into a current sandboxed Chromium engine.

To run the modern browser shell:

```sh
npm install
npm start
```

Use `npm run check:syntax` for a dependency-light validation of the modern runtime entry points.

* * *
&copy; 2012-2016 Hillcrest Labs. All rights reserved. Hillcrest Labs, Kylo, and the Loop are trademarks of Hillcrest Laboratories, Inc.
