import { app } from "./globals.js"
import { zoom, resetZoom } from "./zoom.js";

import { MediaCollection, AudioPlayerItem, AudioBackgroundItem, VideoBackgroundItem } from './media.js';

let viewportDiv;

const setupViewportDiv = () => {
  viewportDiv = document.createElement('div');
  viewportDiv.classList.add('viewport');
  container.querySelector('div.artifact').insertAdjacentElement('afterend', viewportDiv);
}

const getFullVh = () => {
  return viewportDiv.clientHeight
}

//
// Scroll and animation management
//

//
// SectionLogger
//

class SectionLogger {
  constructor() {
    this.animationFrameNum;
  }
  log(csFloat) {
    if (typeof this.animationFrameNum == 'number')
      app.logger('page:', csFloat.toFixed(2), ', anim:', this.animationFrameNum);
    else {
      app.logger('page:', csFloat.toFixed(2));
    }
    this.animationFrameNum = undefined;
  }
}

let sLogger = new SectionLogger();

let contentScroll, contentScrollFLoat;
let previousContentScrollFLoat = 0;

let container, animationFrameImg, storeScrollArguments;
let audioPlayerCollection, audioBackgroundCollection, videoBackgroundCollection;

//
// The debounce function receives our function as a parameter
//

const debounce = (fn) => {

  // This holds the requestAnimationFrame reference, so we can cancel it if we wish
  let frame;

  // The debounce function returns a new function that can receive a variable number of arguments
  return (...params) => {

    // If the frame variable has been defined, clear it now, and queue for next frame
    if (frame) {
      cancelAnimationFrame(frame);
    }

    // Queue our function call for the next frame
    frame = requestAnimationFrame(() => {
      // Call our function and pass any params we received
      fn(...params, ...storeScrollArguments);
    });

  };
};

//
// Reads out the scroll position and stores it in the data attribute
// so we can use it in our stylesheets
//
const storeScroll = (animations, animationFrameImg) => {
  const contentViewportOffset = 0.6;
  contentScrollFLoat = window.scrollY / getFullVh() + contentViewportOffset;
  contentScroll = Math.floor(contentScrollFLoat);
  let aspectRatio = window.innerWidth / getFullVh()
  let result, animation;

  let inScope = (animations) => {
    let result = {
      animation: false,
      frameNum: 0,
      visible: false
    }

    let calcFrameNum = (a) => {
      let extent = a.endScroll - a.startScroll;
      let stepHeight = extent / (a.endFrame - a.startFrame);
      let currentScrollHeight = contentScrollFLoat - a.startScroll;
      return Math.round(currentScrollHeight / stepHeight) + a.startFrame;
    }

    let inPageScopeBefore = (a) => {
      return contentScroll >= a.startPage && contentScrollFLoat < a.startScroll;
    }

    let inScrollScope = (a) => {
      return contentScrollFLoat >= a.startScroll && contentScrollFLoat < a.endScroll;
    }

    let inPageScopeAfter = (a) => {
      return contentScrollFLoat >= a.endScroll && contentScroll <= a.endPage;
    }

    if (animations !== undefined) {
      animations.forEach((a) => {

        if (inPageScopeBefore(a)) {
          result = {
            animation: a,
            frameNum: 0,
            visible: false
          }
        } else if (inScrollScope(a)) {
          result = {
            animation: a,
            frameNum: calcFrameNum(a),
            visible: true
          }
        } else if (inPageScopeAfter(a)) {
          result = {
            animation: a,
            frameNum: a.endFrame,
            visible: true
          }
        }
      })
    }
    return result;
  }

  result = inScope(animations);
  animation = result.animation;
  if (animation) {
    animation.callback(result.frameNum, animationFrameImg, animation.imgPrefix, result.visible);
    sLogger.animationFrameNum = result.frameNum;
  } else {
    if (animationFrameImg) {
      animationFrameImg.src = './media/images/transparent.png';
    }
  }
  contentScrollFLoat = Math.min(app.maxContentScroll, contentScrollFLoat);
  container.dataset.contentScrollFloat = contentScrollFLoat;
  container.dataset.contentScroll = contentScroll;
  container.dataset.scrollY = window.scrollY;
  container.dataset.innerHeight = getFullVh();
  container.dataset.innerWidth = window.innerWidth;
  container.dataset.aspectRatio = aspectRatio;

  if (contentScrollFLoat >= 1 && zoom.changed) {
    resetZoom();
  }

  if (app.dev) {
    if (Math.abs(contentScrollFLoat - previousContentScrollFLoat) >= 0.01) {
      // let ts = (performance.now() / 1000).toFixed(2);
      previousContentScrollFLoat = contentScrollFLoat;
      sLogger.log(contentScrollFLoat);
    }
  }
};

const storeScrollListener = (e, ...args) => {
  storeScroll(...args);
  setTimeout(() => {
    mediaCollectionUpdateHandler();
  });
}

const animationFrameCallback = (animationFrameNum, animationFrameImg, imgPrefix, isVisible = true) => {
  let updateSrc = (newSrc) => {
    if (animationFrameImg.src !== newSrc) {
      animationFrameImg.src = newSrc;
    }

  }
  if (animationFrameNum >= 0 && isVisible) {
    let paddedFrameNum = (animationFrameNum).toString().padStart(5, '0');
    updateSrc(`./media/animations/${imgPrefix}${paddedFrameNum}.png`);
  }
  if (!isVisible) {
    updateSrc('./media/images/transparent.png');
  }
}

const mediaCollectionUpdateHandler = () => {
  audioPlayerCollection.update();
  audioBackgroundCollection.update();
  videoBackgroundCollection.update();
}

const scrollerSetup = (el, animations) => {
  container = el;
  setupViewportDiv();

  animationFrameImg = document.getElementById('animation-frame');

  audioPlayerCollection = new MediaCollection('.audio.player', AudioPlayerItem);
  audioBackgroundCollection = new MediaCollection('.audio.background', AudioBackgroundItem);
  videoBackgroundCollection = new MediaCollection('.video.background', VideoBackgroundItem);

  if (animations !== undefined) {
    animations.forEach((animation) => {
      animation.callback = animationFrameCallback;
    });
    storeScrollArguments = [animations, animationFrameImg];
  } else {
    storeScrollArguments = [];
  }

  document.addEventListener('scroll',
    debounce(storeScrollListener), { passive: true });

  window.addEventListener('resize',
    debounce(storeScrollListener), { passive: true });

  // Update scroll position for first time
  storeScroll(animations, animationFrameImg);

  window.setInterval(() => {
    mediaCollectionUpdateHandler();
  }, 250)
}

export { scrollerSetup, animationFrameCallback, debounce, contentScrollFLoat, audioPlayerCollection, audioBackgroundCollection };
