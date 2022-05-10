/*jshint esversion: 8 */
/*global  */

import { app } from "./modules/globals.js"
import { startup } from './modules/artifact.js';
import { preFetchNotSupported, preFetchAnimationImagesManually } from "./modules/animation-cache.js"

const animations = [{
  imgPrefix: 'desk/Journal_',
  startFrame: 0,
  endFrame: 128,
  startScroll: 2.2,
  endScroll: 6.98,
  startPage: 2,
  endPage: 7,
}];

const animationCacheData = [{
  imgPrefix: 'desk/Journal',
  startFrame: 0,
  endFrame: 128
}]

app.maxContentScroll = 12;

app.dev = true;

app.domReady(() => {
  startup('desk', animations);
  if (preFetchNotSupported()) {
    preFetchAnimationImagesManually(animationCacheData);
  }
});
