/*jshint esversion: 8 */
/*global  */

import { app } from "./modules/globals.js"
import { preFetchNotSupported, preFetchAnimationImagesManually } from "./modules/animation-cache.js"

import { startup } from './modules/artifact.js';

const animations = [{
    imgPrefix: 'lock-and-key/Coin+Jail+Town_',
    startFrame: 0,
    peakFrame: 45,
    endFrame: 101,
    startScroll: 2.1,
    endScroll: 4.98,
    startPage: 2,
    endPage: 5,
  },
  {
    imgPrefix: 'lock-and-key/Coin+Jail+Town_',
    startFrame: 102,
    peakFrame: 142,
    endFrame: 176,
    startScroll: 5.1,
    endScroll: 7.98,
    startPage: 5,
    endPage: 8,
  },
  {
    imgPrefix: 'lock-and-key/Coin+Jail+Town_',
    startFrame: 177,
    endFrame: 254,
    startScroll: 8.1,
    endScroll: 10.8,
    startPage: 8,
    endPage: 11,
  }
];

const animationCacheData = [{
  imgPrefix: 'lock-and-key/Coin+Jail+Town',
  startFrame: 0,
  endFrame: 254
}]

app.maxContentScroll = 12;

app.domReady(() => {
  startup('lock-and-key', animations);
  if (preFetchNotSupported()) {
    preFetchAnimationImagesManually(animationCacheData);
  }
});
