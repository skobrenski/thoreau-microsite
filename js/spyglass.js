/*jshint esversion: 8 */
/*global  */

import { app } from "./modules/globals.js"
import { startup } from './modules/artifact.js';

let animations = [{
    imgPrefix: 'spyglass/spyglass_animals_10fps/Render_Spyglass+Animals_10_fps_',
    startFrame: 0,
    endFrame: 109,
    startScroll: 1.9,
    endScroll: 3.95,
    startPage: 1,
    endPage: 3,
  },
  {
    imgPrefix: 'spyglass/spyglass_animals_10fps/Render_Spyglass+Animals_10_fps_',
    startFrame: 110,
    endFrame: 144,
    startScroll: 4,
    endScroll: 5.90,
    startPage: 4,
    endPage: 5,
  },
  {
    imgPrefix: 'spyglass/trees_02_10fps/Render_Trees_10_fps_',
    startFrame: 0,
    endFrame: 99,
    startScroll: 6.1,
    endScroll: 7.5,
    startPage: 6,
    endPage: 8,
  },
  {
    imgPrefix: 'spyglass/trees_02_10fps/Render_Trees_10_fps_',
    startFrame: 99,
    endFrame: 119,
    startScroll: 8,
    endScroll: 8.9,
    startPage: 8,
    endPage: 10,
  }
];

app.maxContentScroll = 12;

app.dev = true;

app.domReady(() => {
  startup('spyglass', animations);
});
