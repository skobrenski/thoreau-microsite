/*jshint esversion: 8 */
/*global  */

import { app } from "./globals.js";
import { scrollerSetup } from './scroller.js';
import { zoom, setupDragHandling } from "./zoom.js";
import { generateDropdownUL } from "./menu.js";
import { pages } from "./pages.js";
import { addDropdownMenuListeners } from "./dropdown-menu.js";

app.logger(zoom);

app.firstUserSoundOnRequest = true;

//
// startup() called when dom-ready
//
export const startup = (id, animations) => {
  const container = document.getElementById(id);
  generateDropdownUL(id);
  // generateFooterItems();

  addDropdownMenuListeners();

  scrollerSetup(container, animations);
  setupDragHandling();

  const backToTop = document.getElementById('back-to-top');
  backToTop.addEventListener('click', () => {
    window.scrollTo(0, 0);
  })

  const artifactPages = pages.filter(p => p.type == 'artifact' && p.enabled);
  let pageIndex = artifactPages.findIndex((p) => p.id == id);

  const nextObject = document.getElementById('next-object');
  nextObject.addEventListener('click', () => {
    pageIndex += 1;
    if (pageIndex >= artifactPages.length) pageIndex = 0;
    window.location.href = artifactPages[pageIndex].location;
  })

}
