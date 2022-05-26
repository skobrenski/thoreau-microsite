/*jshint esversion: 8 */
/*global  */

import { app } from "./modules/globals.js"
import { startup } from './modules/artifact.js';
import { preFetchNotSupported, preFetchAnimationImagesManually } from "./modules/animation-cache.js"

let animations = [{
    imgPrefix: 'spyglass/1-spyglass_10fps/_Render_Spyglass_10 fps_',
    startFrame: 0,
    endFrame: 67,
    startScroll: 1.9,
    endScroll: 2.99,
    startPage: 1,
    endPage: 2,
  },
  {
    imgPrefix: 'spyglass/2-animals_10fps/_Render_Animals_10 fps_',
    startFrame: 0,
    endFrame: 95,
    startScroll: 3.1,
    endScroll: 5.90,
    startPage: 4,
    endPage: 5,
  },
  {
    imgPrefix: 'spyglass/3-trees_10fps/Render_Trees_10_fps_',
    startFrame: 0,
    endFrame: 99,
    startScroll: 6.1,
    endScroll: 7.5,
    startPage: 6,
    endPage: 8,
  },
  {
    imgPrefix: 'spyglass/3-trees_10fps/Render_Trees_10_fps_',
    startFrame: 99,
    endFrame: 119,
    startScroll: 8,
    endScroll: 8.9,
    startPage: 8,
    endPage: 10,
  }
];

const animationCacheData = [{
    imgPrefix: 'spyglass/spyglass/1-spyglass_10fps/_Render_Spyglass_10 fps',
    startFrame: 0,
    endFrame: 67
  },
  {
    imgPrefix: 'spyglass/2-animals_10fps/_Render_Animals_10 fps',
    startFrame: 0,
    endFrame: 95
  },
  {
    imgPrefix: 'spyglass/3-trees_10fps/Render_Trees_10_fps',
    startFrame: 0,
    endFrame: 119
  }
]

app.maxContentScroll = 12;

app.domReady(() => {
  startup('spyglass', animations);
  if (preFetchNotSupported()) {
    preFetchAnimationImagesManually(animationCacheData);
  }
});
