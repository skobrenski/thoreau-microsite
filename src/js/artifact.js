/*jshint esversion: 8 */
/*global  app */

app.firstUserSoundOnRequest = true;

let contentScroll, contentScrollFLoat;
let previousContentScrollFLoat = 0;

let audioPlayerCollection, audioBackgroundCollection, silentAudioElement;

let container, animationFrameImg, zoomMinus, zoomPlus, artifactImage, storeScrollArguments;

// The debounce function receives our function as a parameter
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

// Reads out the scroll position and stores it in the data attribute
// so we can use it in our stylesheets

const storeScroll = (animations, animationFrameImg) => {
  const contentViewportOffset = 0.4;
  contentScrollFLoat = window.scrollY / window.innerHeight + contentViewportOffset;
  contentScroll = Math.floor(contentScrollFLoat);
  let aspectRatio = window.innerWidth / window.innerHeight;
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
    animation.callback(result.frameNum, animationFrameImg, result.visible);
  }
  contentScrollFLoat = Math.min(app.maxContentScroll, contentScrollFLoat);
  container.dataset.contentScrollFloat = contentScrollFLoat;
  container.dataset.contentScroll = contentScroll;
  container.dataset.scrollY = window.scrollY;
  container.dataset.innerHeight = window.innerHeight;
  container.dataset.innerWidth = window.innerWidth;
  container.dataset.aspectRatio = aspectRatio;

  if (app.dev) {
    if (Math.abs(contentScrollFLoat - previousContentScrollFLoat) >= 0.09) {
      previousContentScrollFLoat = contentScrollFLoat;
      app.logger(contentScrollFLoat.toFixed(1));
    }
  }
};

const storeScrollListener = (e, ...args) => {
  storeScroll(...args);
  setTimeout(() => {
    updateMCollectionListener();
  });
}

let artifactImageScale = 1;
let artifactMaxImageScale = 3;
let artifactZoomIncrement = 1.1;

let rescaleArtifactImage = () => {
  artifactImage.style.transform = `scale(${artifactImageScale})`;
}

let manageZoomButtons = () => {
  if (artifactImageScale > artifactMaxImageScale) {
    artifactImageScale = artifactMaxImageScale;
    zoomPlus.setAttribute("disabled", "disabled");
  } else {
    zoomPlus.removeAttribute("disabled");
  }
  if (artifactImageScale < 1) {
    artifactImageScale = 1;
    zoomMinus.setAttribute("disabled", "disabled");
  } else {
    zoomMinus.removeAttribute("disabled");
  }
  rescaleArtifactImage();
}

let isVideo = (mediaPlayer) => {
  let proto = Object.prototype.toString.call(mediaPlayer).slice(8, -1).toLowerCase();
  return proto == 'htmlvideoelement';
}
let isAudio = (mediaPlayer) => {
  let proto = Object.prototype.toString.call(mediaPlayer).slice(8, -1).toLowerCase();
  return proto == 'htmlaudioelement';
}

let silentSrc = './media/audio/silence-0.01s.mp3';

let createSilentAudioClip = () => {
  silentAudioElement = document.createElement('audio');
  silentAudioElement.id = 'audio';
  silentAudioElement.src = silentSrc;
  silentAudioElement.type = 'audio/mpeg';
  // silentAudioElement.muted = 'muted';
  container.appendChild(silentAudioElement);
};

class MediaItem {
  isAudio(player) {
    let proto = Object.prototype.toString.call(player).slice(8, -1).toLowerCase();
    return proto == 'htmlaudioelement';
  }
  isVideo(player) {
    let proto = Object.prototype.toString.call(player).slice(8, -1).toLowerCase();
    return proto == 'htmlvideoelement';
  }
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.id = wrapper.id;
    this.media = wrapper.querySelector('audio');
    this.isAudio = isAudio(this.media);
    this.isVideo = isVideo(this.media);

    // if (this.isVideo) {
    //   this.wrapper = media.parentElement.parentElement;
    // } else {
    //   this.wrapper = media.parentElement;
    // }

    this.style;
    this.visible;
    this.visibility;
    this.opacity;
    this.paused;
    this.stopping = false;
    this.played = false;
    this.volume = 1;
    this.fadein = 500;
    this.fadeout = 500;

    this.resetVisibilityState();
    // this.startPlayDelay = 500;
    // this.mediaSetIntervalID = null;
  }

  // 1..0 => easein, easout 1..0
  easeinEaseout(x) {
    return (Math.cos(Math.PI * x) + 1) / 2;
  }

  getStyle() {
    this.style = getComputedStyle(this.wrapper);
    return this.style;
  }

  getCurrentVisiblity() {
    this.getStyle();
    let currentVisibility = this.style.visibility == 'visible' && this.style.opacity == '1' && this.style.display != 'none';
    return currentVisibility;
  }

  visibilityChanged() {
    let previousVisibility = this.visible;
    let currentVisibility = this.getCurrentVisiblity();
    let changed = currentVisibility != previousVisibility;
    if (changed) {
      app.logger(contentScrollFLoat.toFixed(1), this.id, 'changed:', changed, ', previous:', previousVisibility, ', current:', currentVisibility);
    }
    return changed;
  }

  isVisible() {
    this.visible = this.getCurrentVisiblity()
    return this.visible;
  }

  resetVisibilityState() {
    this.isVisible();
  }

  isNotVisible() {
    return !this.isVisible();
  }

  isPaused() {
    this.paused = this.media.paused;
    return this.paused;
  }

  isPlaying() {
    return !this.isPaused();
  }

  isStopping() {
    return this.isStopping;
  }

  isNotStopping() {
    return !this.isStopping;
  }

  currentTime() {
    return this.media.currentTime;
  }

  duration() {
    let duration = this.media.duration;
    if (isNaN(duration)) {
      duration = 0;
    }
    return duration;
  }

  stop() {
    let stopAudio = () => {
      this.stopping = true;
      const endVolume = 0;
      const interval = 1000 / 60;
      const volummeSweepExtent = endVolume - this.volume;
      const steps = this.fadeout / interval;
      const volumeStep = volummeSweepExtent / steps;
      let volume = this.volume;
      this.media.volume = volume;
      // let startTimestamp = performance.now();
      // let sweep = (timestamp) => {
      //  let duration = timestamp - startTimestamp;
      //  app.logger(volume.toFixed(2), duration.toFixed(0));

      let sweep = () => {
        volume += volumeStep;
        if (volume > endVolume) {
          this.media.volume = volume;
          window.requestAnimationFrame(sweep);
        } else {
          this.media.volume = endVolume;
          this.media.pause();
          this.stopping = false;
          this.stopped = true;
          this.media.currentTime = 0;
          this.media.volume = 1;
          this.media.muted = false;
        }
      };
      window.requestAnimationFrame(sweep);
    }

    if (this.isAudio)
      if (this.isPlaying() && !this.stopping) {
        stopAudio();
      }
  }

  play() {
    let playAudio = () => {
      const startVolume = 0;
      const interval = 1000 / 60;
      const volummeSweepExtent = this.volume - startVolume;
      const steps = this.fadein / interval;
      const volumeStep = volummeSweepExtent / steps;
      let volume = 0;
      let startTimestamp = performance.now();
      let sweep = (timestamp) => {
        let duration = timestamp - startTimestamp;
        app.logger(volume.toFixed(2), duration.toFixed(0));
        volume += volumeStep;
        if (volume < this.volume) {
          this.media.volume = volume;
          window.requestAnimationFrame(sweep);
        } else {
          this.media.volume = this.volume;
        }
      };

      this.media.volume = volume;
      this.media.play();
      window.requestAnimationFrame(sweep);
    }

    if (this.isAudio) {
      playAudio();
    }

    if (this.isVideo) {
      this.startPlayTimeoutID = setTimeout(() => {
        this.media.play();
      }, this.startPlayDelay);
    }
  }
}

class AudioPlayerItem extends MediaItem {
  constructor(audioWrapper) {
    super(audioWrapper);
    this.playpause = this.wrapper.querySelector('.playpause');
    this.playBtn = this.wrapper.querySelector('.play');
    this.pauseBtn = this.wrapper.querySelector('.pause');
    this.timeDisplay = this.wrapper.querySelector('.time-display');
    this.currentTimeEl = this.timeDisplay.querySelector('.current')
    this.durationEl = this.timeDisplay.querySelector('.duration')
    this.progressDisplay = this.wrapper.querySelector('.progress-indicator');
    this.elapsedBar = this.progressDisplay.querySelector('.elapsed');
    this.remainingBar = this.progressDisplay.querySelector('.remaining');
    this.playBtn.addEventListener('click', () => {
      this.playpause.classList.add('playing');
      this.play();
    });
    this.pauseBtn.addEventListener('click', () => {
      this.playpause.classList.remove('playing');
      this.stop();
    });
    this.media.addEventListener('timeupdate', () => {
      this.updateCurrentTime();
    })
    this.media.addEventListener('durationchange', () => {
      this.updateDuration();
    })
    this.media.addEventListener('ended', () => {
      this.playpause.classList.remove('playing');
      this.media.currentTime = 0;
      this.updateDuration();
    })
    this.updateCurrentTime();
  }

  update() {
    this.resetVisibilityState();
    if (this.isPlaying() && this.isNotVisible()) {
      this.stop();
      this.media.currentTime = 0;
      this.playpause.classList.remove('playing');
    }
  }

  secondsToTimeStr(seconds) {
    let str = new Date(seconds * 1000).toISOString().substr(14, 5);
    if (seconds < 600) {
      str = str.substr(1);
    }
    return str;
  }

  updateCurrentTime() {
    let time = this.secondsToTimeStr(this.currentTime());
    this.currentTimeEl.innerText = time;
    this.updateProgressBar();
  }

  updateDuration() {
    let time = this.secondsToTimeStr(this.duration());
    this.durationEl.innerText = time;
    this.updateProgressBar();
  }

  updateProgressBar() {
    let elapsed = this.currentTime();
    let duration = this.duration();
    let elapsedWidth = 0;
    let remainingWidth = 100;
    if (duration > 0) {
      elapsedWidth = elapsed / duration * 100;
      remainingWidth = (duration - elapsed) / duration * 100;
    }
    this.elapsedBar.style.width = `${elapsedWidth}%`;
    this.remainingBar.style.width = `${remainingWidth}%`;
  }

  stylePlaying(playing) {
    if (playing) {
      this.playBtn.classList.remove('paused');
      this.pauseBtn.classList.add('playing');
    } else {
      this.pauseBtn.classList.remove('playing');
      this.playBtn.classList.add('paused');
    }
  }
}

class AudioBackgroundItem extends MediaItem {
  constructor(audio) {
    super(audio);
    this.media.loop = true;
    this.mutedState = true;
    this.onChildren = this.wrapper.querySelectorAll('*.on');
    this.offChildren = this.wrapper.querySelectorAll('*.off');
    this.volume = 1;
    this.wrapper.addEventListener('click', () => {
      if (this.mutedState) {
        this.mutedState = false;
        this.updateMuteBtnView();
        this.play();
      } else {
        this.mutedState = true;
        this.updateMuteBtnView();
        this.stop();
      }
    })
  }

  update() {
    this.resetVisibilityState();
    if (this.isPlaying() && this.isNotVisible()) {
      this.stop();
    }
    if (this.isVisible() && !this.mutedState) {
      this.play();
    }
  }

  updateMuteBtnView() {
    if (this.mutedState) {
      this.onChildren.forEach((el) => {
        el.style.display = 'none';
      })
      this.offChildren.forEach((el) => {
        el.style.display = 'block';
      })
    } else {
      this.offChildren.forEach((el) => {
        el.style.display = 'none';
      })
      this.onChildren.forEach((el) => {
        el.style.display = 'block';
      })
    }
  }
}

// class VideoPlayerItem extends MediaItem {
//   constructor(audio) {
//     super(audio);
//   }
// }
//
// class VideoBackgroundItem extends MediaItem {
//   constructor(video) {
//     super(video);
//   }
// }

class AudioCollection {
  constructor(selector, klass) {
    let elArray = Array.from(document.querySelectorAll(selector));
    this.items = elArray.map(el => new klass(el));
  }
  update() {
    this.items.forEach(item => {
      if (item.visibilityChanged()) {
        item.update();
      }
    });
  }
}

let updateMCollectionListener = () => {
  audioPlayerCollection.update();
  audioBackgroundCollection.update();
}

//
// startup() called when dom-ready
//

// eslint-disable-next-line no-unused-vars
const startup = (id, animations) => {
  container = document.getElementById(id);
  createSilentAudioClip();

  // audioPlayers = makeItems('audio.player', AudioPlayerItem);
  // audioBackgrounds = makeItems('audio.background', AudioBackgroundItem);

  audioPlayerCollection = new AudioCollection('.audio.player', AudioPlayerItem);

  audioBackgroundCollection = new AudioCollection('.audio.background', AudioBackgroundItem);

  // videoPlayers = makeItems('video.player', VideoPlayerItem);
  // videoBackgrounds = makeItems('video.background', VideoBackgroundItem);

  animationFrameImg = document.getElementById('animation-frame');

  storeScrollArguments = [animations, animationFrameImg];
  document.addEventListener('scroll',
    debounce(storeScrollListener), { passive: true });

  window.addEventListener('resize',
    debounce(storeScrollListener), { passive: true });

  // Update scroll position for first time
  storeScroll(animations, animationFrameImg);

  zoomMinus = document.getElementById('zoom-minus');
  zoomPlus = document.getElementById('zoom-plus');
  artifactImage = document.getElementById('artifact-image');

  zoomMinus.addEventListener('click', () => {
    artifactImageScale /= artifactZoomIncrement;
    manageZoomButtons();
  })

  zoomPlus.addEventListener('click', () => {
    artifactImageScale *= artifactZoomIncrement;
    manageZoomButtons();
  })

  // window.setInterval(() => {
  //   updateMCollectionListener
  // }, 250)
}

app.dev = true;
