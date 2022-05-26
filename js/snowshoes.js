/*jshint esversion: 8 */
/*global  */

import { app } from "./modules/globals.js"
import { startup } from './modules/artifact.js';

app.maxContentScroll = 4;

app.domReady(() => {
  startup('snowshoes');
});
