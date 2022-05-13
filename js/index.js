/*jshint esversion: 8 */
/*global */

import { app } from "./modules/globals.js";
import { pages } from "./modules/pages.js";
import { generateFooterItems, generateDropdownUL } from "./modules/menu.js";

app.dev = true;

const isReduced = window.matchMedia(`(prefers-reduced-motion: reduce)`) === true || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

const shiftDistance = isReduced ? 20 : 60;
const shiftStep = isReduced ? 1 : 3;

const artifactPages = pages.filter(p => p.type == 'artifact' && p.enabled);

let selectRight, selectLeft, selectedImage, carouselImageContainer;

let pageIndex = 1;
let selectedPage = artifactPages[pageIndex];

const updatePageIndexFromHash = () => {
  let hash = window.location.hash.slice(1);
  let index;
  if (hash.length > 0) {
    index = artifactPages.findIndex((p) => p.id == hash);
    if (index >= 0) {
      pageIndex = index;
    }
  }
}

const addDropDownListeners = () => {
  const dropdown = document.getElementById('explore-another-object');
  const pinetree = document.getElementById('mobile-pinetree');

  dropdown.addEventListener('show.bs.dropdown', () => {
    pinetree.classList.add('hide');
  })
  dropdown.addEventListener('hide.bs.dropdown', () => {
    pinetree.classList.remove('hide');
  })
}

let swipeCompleted = false;

const swipeActiveDistance = 10;
const swipeCompletionFraction = 0.15;

const removeStyles = () => {
  carouselImageContainer.style.left = ``;
  carouselImageContainer.style.right = '';
  carouselImageContainer.style.opacity = '';
}

const startSlideOut = (direction, absPixelShift, callback) => {
  const elemWidth = carouselImageContainer.clientWidth;
  let shift = Math.abs(absPixelShift / elemWidth) * 100;

  const slideOut = () => {
    const shiftEnd = shiftDistance;
    let opacity = 1;
    let increment = shiftStep;

    switch (direction) {
    case 'left':
      carouselImageContainer.style.left = `-${shift}%`;
      carouselImageContainer.style.right = '';
      break;
    case 'right':
      carouselImageContainer.style.right = `-${shift}%`;
      carouselImageContainer.style.left = '';
      break;
    case false:
      removeStyles();
      break;
    }

    if (direction) {
      const slide = () => {
        carouselImageContainer.style.opacity = opacity;
        switch (direction) {
        case 'left':
          carouselImageContainer.style.left = `-${shift}%`;
          carouselImageContainer.style.right = '';
          break;
        case 'right':
          carouselImageContainer.style.right = `-${shift}%`;
          carouselImageContainer.style.left = '';
        }
        shift += increment;
        opacity = 1 - shift / shiftEnd;
        carouselImageContainer.style.opacity = opacity;
        app.logger('opacity', opacity);
        if (shift < shiftEnd) {
          window.requestAnimationFrame(slide);
        } else {
          removeStyles();
          callback();
        }
      }
      shift += increment;
      window.requestAnimationFrame(slide);
    }
  }
  window.requestAnimationFrame(slideOut);
}

const updateSelectedPage = (direction) => {
  selectedImage.classList.remove('selected');
  selectedImage.style.opacity = 0;

  const slideIn = () => {
    selectedPage = artifactPages[pageIndex];
    selectedImage = selectedPage.element;

    const shiftStart = shiftDistance;
    let shift = shiftStart;
    let opacity = 0;
    let opacityShift = 0;
    let decrement = shiftStep;

    switch (direction) {
    case 'left':
      carouselImageContainer.style.right = `-${shift}%`;
      carouselImageContainer.style.left = '';
      break;
    case 'right':
      carouselImageContainer.style.left = `-${shift}%`;
      carouselImageContainer.style.right = '';
      break;
    case false:
      removeStyles();
      break;
    }

    window.location.hash = selectedPage.id;
    selectedImage.classList.add('selected');
    selectedImage.style.opacity = '';

    if (direction) {
      const slide = () => {
        carouselImageContainer.style.opacity = opacity;
        switch (direction) {
        case 'left':
          carouselImageContainer.style.right = `-${shift}%`;
          carouselImageContainer.style.left = '';
          break;
        case 'right':
          carouselImageContainer.style.left = `-${shift}%`;
          carouselImageContainer.style.right = '';
        }
        selectedImage.classList.add('selected');
        shift -= decrement;
        opacity = 1 - shift / shiftStart + opacityShift;
        carouselImageContainer.style.opacity = opacity;
        app.logger('opacity', opacity);
        if (shift > 1) {
          if (shift > decrement) {
            window.requestAnimationFrame(slide);
          } else {
            decrement = 1;
            window.requestAnimationFrame(slide);
          }
        } else {
          removeStyles();
        }
      }
      shift -= decrement;
      window.requestAnimationFrame(slide);
    }
  }
  carouselImageContainer.style.opacity = 0;
  window.requestAnimationFrame(slideIn);
}

const nextPage = (absPixelShift) => {
  startSlideOut('right', absPixelShift, () => {
    pageIndex += 1;
    if (pageIndex >= artifactPages.length) pageIndex = 0;
    selectedPage = artifactPages[pageIndex];
    updateSelectedPage('right');
  });
}

const previousPage = (absPixelShift) => {
  startSlideOut('left', absPixelShift, () => {
    pageIndex -= 1;
    if (pageIndex < 0) pageIndex = artifactPages.length - 1;
    selectedPage = artifactPages[pageIndex];
    updateSelectedPage('left');
  });
}

const generateCarouselImgElements = () => {
  artifactPages.forEach((page, index) => {
    let img = document.createElement("img");
    img.classList.add(page.id);
    img.src = page.src;
    if (page.enabled) img.classList.add('enabled');
    if (index == pageIndex) {
      img.classList.add('selected');
      selectedImage = img;
    }
    carouselImageContainer.append(img);
    page.element = img;
  })
};

app.domReady(() => {
  generateDropdownUL('main');
  addDropDownListeners();
  generateFooterItems();

  carouselImageContainer = document.getElementById('carousel-image-container');

  generateCarouselImgElements();

  updatePageIndexFromHash();
  selectedPage = artifactPages[pageIndex];

  selectRight = document.getElementById('select-right');
  selectLeft = document.getElementById('select-left');

  selectRight.addEventListener('click', () => {
    nextPage(0);
  })

  selectLeft.addEventListener('click', () => {
    previousPage(0);
  })

  // swipe items

  let swipeDragStarted = false;
  let currentSwipeDistance = 0;

  const carouselPointerDown = (e) => {
    swipeDragStarted = e.offsetX;
    swipeCompleted = false;
    e.preventDefault();
    app.logger('carouselPointerDown', e, 'swipeDragStarted', swipeDragStarted);
  }

  const swipeIsActive = () => {
    let active = swipeDragStarted && Math.abs(currentSwipeDistance) > swipeActiveDistance;
    return active;
  }

  const swipeIsNotActive = () => {
    return !swipeIsActive() && !swipeCompleted;
  }

  const swipeEnd = () => {
    swipeDragStarted = false;
    currentSwipeDistance = 0;
  }

  const swipeIsComplete = () => {
    let completion = carouselImageContainer.clientWidth * swipeCompletionFraction;
    swipeCompleted = swipeDragStarted && Math.abs(currentSwipeDistance) > completion;
    if (swipeCompleted) {
      swipeEnd();
    }
    return swipeCompleted;
  };

  const carouselPointerMove = (e) => {
    if (swipeDragStarted) {
      e.preventDefault();
      let elemWidth = e.currentTarget.clientWidth;
      currentSwipeDistance = (e.offsetX - swipeDragStarted);
      let absShift = `${Math.abs(currentSwipeDistance / elemWidth) * 100}%`;
      app.logger('absShift', absShift);
      let absPixelShiftValue = Math.abs(currentSwipeDistance);
      let absPixelShift = `${absPixelShiftValue}px`;
      app.logger('absPixelShift', absPixelShift);
      if (swipeIsActive()) {
        e.preventDefault();
        e.stopPropagation();
        if (currentSwipeDistance > swipeActiveDistance) {
          carouselImageContainer.style.left = absPixelShift;
          carouselImageContainer.style.right = '';
          if (swipeIsComplete()) {
            nextPage(absPixelShiftValue);
          }
        } else if (currentSwipeDistance < -swipeActiveDistance) {
          carouselImageContainer.style.right = absPixelShift;
          carouselImageContainer.style.left = '';
          if (swipeIsComplete()) {
            previousPage(absPixelShiftValue);
          }
        }
      }
    }
  }

  const carouselPointerEnd = (e) => {
    if (swipeIsNotActive() && e.type == 'pointerup') {
      e.preventDefault();
      e.stopPropagation();
      swipeEnd();
      location = selectedPage.location;
    }
    swipeEnd();
    removeStyles();
  }

  const carouselSwipeStartEvents = [
    'pointerdown'
  ]

  const carouselSwipeMoveEvents = [
    'pointermove'
  ]

  const carouselSwipeEndEvents = [
    'pointerup',
    'pointerout',
    'pointerleave'
  ]

  carouselSwipeStartEvents.forEach((event) => {
    carouselImageContainer.addEventListener(event, carouselPointerDown);
  })

  carouselSwipeMoveEvents.forEach((event) => {
    carouselImageContainer.addEventListener(event, carouselPointerMove);
  })

  carouselSwipeEndEvents.forEach((event) => {
    carouselImageContainer.addEventListener(event, carouselPointerEnd);
  })

  updateSelectedPage(false);
});
