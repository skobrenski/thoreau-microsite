import { app } from "./globals.js";
import { u } from "./utilities.js";

const zoomMinus = document.getElementById('zoom-minus');
const zoomPlus = document.getElementById('zoom-plus');
const artifactImage = document.getElementById('artifact-image');
const artifactWrapper = artifactImage.parentElement;
const dragLayer = artifactWrapper.querySelector('div.draglayer');

const ZoomIn = Symbol("ZoomIn")
const ZoomOut = Symbol("ZoomOut")

const touchScreen = navigator.maxTouchPoints > 0;

// const iPhoneTouchScreen = touchScreen && navigator.platform == 'iPhone'

export const zoom = {
  scale: 1,
  maxScale: 3,
  speed: 0,
  maxSpeed: 0.05,
  deltaPlus: 0.003,
  deltaMinus: 0.01,
  deltaZoom: 0.01,
  intervalID: null,
  interval: 45,
  zooming: false,
  changed: false,
  dx: 0,
  dy: 0,
  startpos: {
    x: 0,
    y: 0
  },
  endpos: {
    x: 0,
    y: 0
  }
}

const zoomBackup = u.deepClone(zoom);

// Log events flag
let logEvents = false;

// Logging/debugging functions
// const enableLog = () => {
//   logEvents = logEvents ? false : true;
// }

const log = (prefix, ev) => {
  if (!logEvents) return;
  let s = prefix + ": pointerID = " + ev.pointerId +
    " ; pointerType = " + ev.pointerType +
    " ; isPrimary = " + ev.isPrimary;
  console.log(s);
}

// Global vars to cache event state
let evCache = new Array();
let previousDistance = -1;

const cache_event = (e) => {
  evCache.push(e);
}

const update_event_in_cache = (e) => {
  // Find this event in the cache and update its record with this event
  for (var i = 0; i < evCache.length; i++) {
    if (e.pointerId == evCache[i].pointerId) {
      evCache[i] = e;
      break;
    }
  }
}

const calcDistance = () => {
  const distance = (x1, y1, x2, y2) => {
    let ax = Math.abs(x1 - x2);
    let ay = Math.abs(y1 - y2);
    return Math.sqrt(ax * ax + ay * ay);
  }
  if (evCache.length == 2) {
    let x1 = evCache[0].clientX;
    let y1 = evCache[0].clientY;
    let x2 = evCache[1].clientX;
    let y2 = evCache[1].clientY;
    return distance(x1, y1, x2, y2);
  } else {
    return 0;
  }
}

const remove_event = (e) => {
  // Remove this event from the target's cache
  for (var i = 0; i < evCache.length; i++) {
    if (evCache[i].pointerId == e.pointerId) {
      evCache.splice(i, 1);
      log("remove_event", e);
      break;
    }
  }
}

const scaleAndTranslate = () => {
  let transform = `scale(${zoom.scale}) translate(${zoom.dx}px, ${zoom.dy}px)`;
  app.logger(transform);
  app.logger(zoom);
  artifactImage.style.transform = transform;
  if (zoom.scale > 1) {
    artifactWrapper.classList.add('zoomed');
  } else {
    artifactWrapper.classList.remove('zoomed');
  }
  zoom.changed = true;
}

export const resetZoom = () => {
  for (const [key, value] of Object.entries(zoomBackup)) {
    zoom[key] = value;
  }
  scaleAndTranslate();
}

const handleZoomButtons = () => {
  if (zoom.scale > zoom.maxScale) {
    zoom.scale = zoom.maxScale;
    zoomPlus.setAttribute("disabled", "disabled");
  } else {
    zoomPlus.removeAttribute("disabled");
  }
  if (zoom.scale < 1) {
    zoom.scale = 1;
    // zoom.dx = 0;
    // zoom.dy = 0;
    zoomMinus.setAttribute("disabled", "disabled");
  } else {
    zoomMinus.removeAttribute("disabled");
  }
  scaleAndTranslate();
}

const startZooming = (direction = ZoomIn) => {
  clearInterval(zoom.intervalID);
  zoom.zooming = true;
  zoom.speed = zoom.deltaPlus;

  const process = () => {
    if (direction == ZoomIn) {
      zoom.scale *= 1 + zoom.speed;
    } else {
      zoom.scale /= 1 + zoom.speed;
    }
    handleZoomButtons();
  }
  process();

  zoom.intervalID = setInterval(() => {
    if (zoom.zooming) {
      zoom.speed += zoom.deltaPlus;
      if (zoom.speed > zoom.maxSpeed) {
        zoom.speed = zoom.maxSpeed;
      }
      process();
    } else {
      zoom.speed -= zoom.deltaMinus;
      if (zoom.speed > 0) {
        process();
      } else {
        clearInterval(zoom.intervalID);
        zoom.intervalID = null;
      }
    }
  }, zoom.interval);
}

const endZooming = () => {
  zoom.zooming = false;
}

const zoomStartEvents = [
  'pointerdown'
]

const zoomEndEvents = [
  'pointerup',
  'pointerout',
  'pointerleave',
  'touchend',
  'touchcancel'
]

const startZoomOut = (e) => {
  e.preventDefault();
  startZooming(ZoomOut);
}

const startZoomIn = (e) => {
  e.preventDefault();
  startZooming(ZoomIn);
}

zoomStartEvents.forEach((event) => {
  zoomMinus.addEventListener(event, startZoomOut);
  zoomPlus.addEventListener(event, startZoomIn);
})

zoomEndEvents.forEach((event) => {
  zoomMinus.addEventListener(event, endZooming);
  zoomPlus.addEventListener(event, endZooming);
})

if (touchScreen) {
  zoomMinus.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  })

  zoomPlus.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  })

  dragLayer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  })

  artifactWrapper.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  })
}

export const setupDragHandling = () => {
  let dragstarted = false;
  const originalPos = { x: 0, y: 0 };

  // enableLog();

  const dragEnded = (e) => {
    e.preventDefault();
    remove_event(e);
    dragstarted = false;
    dragLayer.classList.remove('dragging');
    log('dragEnded', e);
    if (evCache.length < 2) {
      previousDistance = -1;
    }
  }

  const updateDxDy = () => {
    zoom.dx = originalPos.x + (zoom.endpos.x - zoom.startpos.x) / zoom.scale;
    zoom.dy = originalPos.y + (zoom.endpos.y - zoom.startpos.y) / zoom.scale;

    let xExtent = (dragLayer.clientWidth / 2) / zoom.scale;
    let yExtent = (dragLayer.clientHeight / 2) / zoom.scale;

    zoom.dx = Math.min(xExtent, Math.max(-xExtent, zoom.dx));
    zoom.dy = Math.min(yExtent, Math.max(-yExtent, zoom.dy));

    scaleAndTranslate();
  }

  const down = (x, y) => {
    dragLayer.classList.add('dragging');
    dragstarted = true;
    zoom.startpos.x = x;
    zoom.startpos.y = y;
    originalPos.x = zoom.dx;
    originalPos.y = zoom.dy;
  }

  const move = (x, y) => {
    if (dragstarted) {
      zoom.endpos.x = x;
      zoom.endpos.y = y;
      updateDxDy();
    }
  }

  //
  // start
  //

  dragLayer.addEventListener('pointerdown', (e) => {
    // e.preventDefault();
    // e.stopPropagation();

    // The pointerdown event signals the start of a touch interaction.
    // This event is cached to support 2-finger gestures
    cache_event(e);
    log("pointerDown", e);
    down(e.offsetX, e.offsetY);
  });

  // if (touchScreen) {
  //   dragLayer.addEventListener('touchstart', (e) => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     let touch = e.targetTouches[0];
  //     down(touch.clientX, touch.clientY);
  //   });
  // }
  //
  // if (!iPhoneTouchScreen) {
  //   dragLayer.addEventListener('pointerdown', (e) => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     down(e.offsetX, e.offsetY);
  //   });
  // }

  //
  // move
  //

  dragLayer.addEventListener('pointermove', (e) => {
    // e.preventDefault();
    // e.stopPropagation();
    update_event_in_cache(e);

    // If two pointers are down, check for pinch gestures
    if (evCache.length == 2) {
      let currentDistance = calcDistance();
      if (previousDistance > 0) {
        if (currentDistance > previousDistance) {
          log("Pinch moving OUT -> Zoom in", e);
          zoom.scale *= 1 + zoom.deltaZoom;
          handleZoomButtons();
        }
        if (currentDistance < previousDistance) {
          log("Pinch moving IN -> Zoom out", e);
          zoom.scale /= 1 + zoom.deltaZoom;
          handleZoomButtons();
        }
      }
      previousDistance = currentDistance;
    } else {
      if (dragstarted) {
        log('pointermove, drag started', e);
        move(e.offsetX, e.offsetY);
      } else {
        log('pointermove, drag NOT started', e);
      }
    }
  });

  // if (touchScreen) {
  //   dragLayer.addEventListener('touchmove', (e) => {
  //     if (dragstarted) {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       let touch = e.targetTouches[0];
  //       move(touch.clientX, touch.clientY);
  //     }
  //   });
  // }
  // if (!iPhoneTouchScreen) {
  //   dragLayer.addEventListener('pointermove', (e) => {
  //     if (dragstarted) {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       move(e.offsetX, e.offsetY);
  //     }
  //   });
  // }

  //
  // end
  //

  dragLayer.addEventListener('pointerup', (e) => {
    dragEnded(e);
  });

  dragLayer.addEventListener('pointercancel', () => {
    // dragEnded();
  });

  dragLayer.addEventListener('pointerleave', (e) => {
    dragEnded(e);
  });

  // dragLayer.addEventListener('touchend', (e) => {
  //   e.preventDefault();
  //   dragEnded(e);
  // });
  //
  // dragLayer.addEventListener('touchcancel', (e) => {
  //   e.preventDefault();
  //   dragEnded(e);
  // });

}
