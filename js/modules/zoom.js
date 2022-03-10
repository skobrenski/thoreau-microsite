import { app } from "./globals.js";

const zoomMinus = document.getElementById('zoom-minus');
const zoomPlus = document.getElementById('zoom-plus');
const artifactImage = document.getElementById('artifact-image');
const artifactWrapper = artifactImage.parentElement;
const dragLayer = artifactWrapper.querySelector('div.draglayer');

const ZoomIn = Symbol("ZoomIn")
const ZoomOut = Symbol("ZoomOut")

export const zoom = {
  scale: 1,
  maxScale: 3,
  speed: 0,
  maxSpeed: 0.075,
  deltaPlus: 0.005,
  deltaMinus: 0.02,
  interval: null,
  zooming: false,
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

const scaleAndTranslate = () => {
  let transform = `scale(${zoom.scale}) translate(${zoom.dx}px, ${zoom.dy}px)`;
  app.logger(transform);
  artifactImage.style.transform = transform;
  if (zoom.scale > 1) {
    artifactWrapper.classList.add('zoomed');
  } else {
    artifactWrapper.classList.remove('zoomed');
  }
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
    zoom.dx = 0;
    zoom.dy = 0;
    zoomMinus.setAttribute("disabled", "disabled");
  } else {
    zoomMinus.removeAttribute("disabled");
  }
  scaleAndTranslate();
}

const startZooming = (direction = ZoomIn) => {
  clearInterval(zoom.interval);
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

  zoom.interval = setInterval(() => {
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
        clearInterval(zoom.interval);
        zoom.interval = null;
      }
    }
  }, 60);
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

const touchscreen = navigator.maxTouchPoints > 0 || navigator.platform == 'iPhone'

if (touchscreen) {
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

  const dragEnded = (e) => {
    e.preventDefault();
    dragstarted = false;
    dragLayer.classList.remove('dragging');
    console.log(e);
  }

  const updateDxDy = () => {
    zoom.dx = originalPos.x + (zoom.endpos.x - zoom.startpos.x) / zoom.scale;
    zoom.dy = originalPos.y + (zoom.endpos.y - zoom.startpos.y) / zoom.scale;

    let xExtent = dragLayer.clientWidth / 2;
    let yExtent = dragLayer.clientHeight / 2;

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

  if (touchscreen) {
    dragLayer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let touch = e.targetTouches[0];
      down(touch.clientX, touch.clientY);
    });
  }
  dragLayer.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    down(e.offsetX, e.offsetY);
  });

  //
  // move
  //
  if (touchscreen) {
    dragLayer.addEventListener('touchmove', (e) => {
      if (dragstarted) {
        e.preventDefault();
        e.stopPropagation();
        let touch = e.targetTouches[0];
        move(touch.clientX, touch.clientY);
      }
    });
  }
  dragLayer.addEventListener('pointermove', (e) => {
    if (dragstarted) {
      e.preventDefault();
      e.stopPropagation();
      move(e.offsetX, e.offsetY);
    }
  });

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

  dragLayer.addEventListener('touchend', (e) => {
    e.preventDefault();
    dragEnded(e);
  });

  dragLayer.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    dragEnded(e);
  });

}
