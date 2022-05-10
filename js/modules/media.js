import { app } from "./globals.js"
import { contentScrollFLoat, audioPlayerCollection, audioBackgroundCollection } from './scroller.js'

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
    this.media = wrapper.querySelector('audio,video');
    this.isAudio = this.isAudioMedia(this.media);
    this.isVideo = this.isVideoMedia(this.media);
    this.style;
    this.visible;
    this.visibility;
    this.opacity;
    this.paused;
    this.stopping = false;
    this.played = false;
    this.volume = 1;
    this.fadein = 300;
    this.fadeout = 300;
    this.resetVisibilityState();
  }

  isVideoMedia() {
    let proto = Object.prototype.toString.call(this.media).slice(8, -1).toLowerCase();
    return proto == 'htmlvideoelement';
  }

  isAudioMedia() {
    let proto = Object.prototype.toString.call(this.media).slice(8, -1).toLowerCase();
    return proto == 'htmlaudioelement';
  }

  isAutoPlay() {
    return this.wrapper.classList.contains('autoplay')
  }

  // 1..0 => easein, easout 1..0
  easeinEaseout(vin, low_v, high_v) {
    let range = high_v - low_v;
    let vinScaled = (vin - low_v) * 1 / range;
    let x = Math.abs(vinScaled - 1);
    let easedX = 0.5 * (Math.cos(x * Math.PI) + 1);
    let vout = easedX * range / 1 + low_v;
    // app.logger(vin, low_v, high_v, vout);
    return vout;
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
      let transitionPoint = currentVisibility ? 'completed' : 'started';
      app.logger(this.id, `visibility ${transitionPoint} change to:`, currentVisibility, 'at', contentScrollFLoat.toFixed(2));
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

  sweepVolume(startVolume, endVolume, timePeriod, callback) {
    if (startVolume == endVolume) {
      app.logger('error', 'startVolume', startVolume, 'endVolume', endVolume);
      return;
    }
    let endtest, lowV, highV;
    if (endVolume > startVolume) {
      lowV = startVolume;
      highV = endVolume;
      endtest = (v, eV) => {
        return v < eV
      }
    } else {
      endtest = (v, eV) => {
        lowV = endVolume;
        highV = startVolume;
        return v >= eV
      }
    }
    const interval = 1000 / 60;
    const volummeSweepExtent = endVolume - startVolume;
    const steps = timePeriod / interval;
    const volumeStep = volummeSweepExtent / steps;
    let volume = startVolume
    this.media.volume = volume;
    // app.logger('start-volume', volume, 'volumeStep', volumeStep);
    let startTimestamp = performance.now();
    let sweep = (timestamp) => {
      let duration = timestamp - startTimestamp;
      volume += volumeStep;
      if (endtest(volume, endVolume)) {
        this.media.volume = this.easeinEaseout(volume, lowV, highV);
        app.loggerVolume('-', volume.toFixed(2), this.media.volume.toFixed(2), duration.toFixed(0));
        window.requestAnimationFrame(sweep);
      } else {
        this.media.volume = endVolume;
        if (typeof callback == 'function') {
          callback();
        }
      }
    };
    window.requestAnimationFrame(sweep);
  }

  lowerVolume(vlow) {
    this.sweepVolume(this.volume, vlow, this.fadein)
  }

  raiseVolume() {
    this.sweepVolume(this.media.volume, this.volume, this.fadein)
  }

  stop() {
    let stopMedia = () => {
      this.sweepVolume(this.volume, 0, this.fadeout, () => {
        this.media.pause();
        this.stopping = false;
        this.stopped = true;
        this.media.volume = 1;
        this.media.muted = false;
      })
    }
    if (this.isPlaying() && !this.stopping) {
      stopMedia();
    }
  }

  play() {
    this.sweepVolume(0, this.volume, this.fadein)
    let promise = this.media.play();
    if (promise !== undefined) {
      promise.then(() => {
        // play started
      }).catch((rejection) => {
        app.logger(rejection);
        // rejection.name => 'NotAllowedError'
        // play was prevented.
        // Show a "Play" button so that user can start playback.
        // https://developer.chrome.com/blog/autoplay/
      });
    }
  }
}

class AudioPlayerItem extends MediaItem {
  constructor(audioWrapper) {
    super(audioWrapper);
    audioWrapper
      .insertAdjacentHTML('beforeend', `
      <div class='playpause'>
        <div class="play">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11"/>
            <path d="M 9.75 16.75 L 16.75 12 L 9.75 7.25 Z" />
          </svg>
        </div>
        <div class="pause">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11"/>
            <g fill-rule="evenodd" fill="currentColor" stroke-width="3.5px">
              <path fill="currentColor" d="M 9 6.5 L 9 17.5" />
              <path fill="currentColor" d="M 15.5 6.5 L 15.5 17.5" />
            </g>
          </svg>
        </div>
      </div>
      <div class='time-display'>
        <div class='span current'></div>
        <div class='span divider'>/</div>
        <div class='span duration'></div>
      </div>
      <div class='progress-indicator'>
        <div class='elapsed'></div>
        <div class='remaining'></div>
      </div>
    `);
    setTimeout(() => {
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
        this.restoreBackgroundVolume();
      })
      this.updateCurrentTime();
      this.updateDuration();
    }, 0);
  }

  lowerBackgroundVolume() {
    audioBackgroundCollection.items.forEach(item => {
      if (item.isPlaying()) {
        item.lowerVolume(this.volume * 0.3);
      }
    });
  }

  restoreBackgroundVolume() {
    audioBackgroundCollection.items.forEach(item => {
      if (item.isPlaying()) {
        item.volume = 1;
        item.raiseVolume()
      }
    });
  }

  play() {
    this.lowerBackgroundVolume();
    super.play();
  }

  stop() {
    super.stop();
    this.restoreBackgroundVolume();
  }

  update() {
    this.resetVisibilityState();
    if (this.isPlaying() && this.isNotVisible()) {
      this.stop();
      this.media.currentTime = 0;
      this.playpause.classList.remove('playing');
    }
    if (this.isPaused() && this.isVisible() && this.isAutoPlay()) {
      this.play();
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
  constructor(audioWrapper) {
    super(audioWrapper);

    audioWrapper
      .insertAdjacentHTML('beforeend', `
      <div class='mute-button'>
        <div class="off">Click to unmute</div>
        <svg class='off' xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" class="bi bi-volume-off-fill" viewBox="0 0 26 26">
          <circle cx="13" cy="13" r="12.5" />
          <g>
            <path d="M10.717 3.55A.5.5 0 0 1 11 4v8a.5.5 0 0 1-.812.39L7.825 10.5H5.5A.5.5 0 0 1 5 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z" />
            <path class="outline" d="M15 5.75 L19.25 10.25 M15 10.25 L19.25 5.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </g>
        </svg>
        <div class="on">Click to mute</div>
        <svg class="on" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="bi bi-volume-up-fill">
          <circle cx="8" cy="8" r="7.75" />
          <g>
            <path d=" M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z" />
            <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z" />
            <path
              d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z" />
          </g>
        </svg>
      </div>
    `);
    setTimeout(() => {
      this.unmuteFooter = document.getElementById('unmute-footer');
      this.media.loop = true;
      this.mutedState = true;
      this.onChildren = this.wrapper.querySelectorAll('*.on');
      this.offChildren = this.wrapper.querySelectorAll('*.off');
      this.volume = 1;
      this.fadein = 1000;
      this.fadeout = 400;

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
    }, 0);
  }

  play() {
    if (audioPlayerCollection.anyItemPlaying()) {
      this.volume = 0.3;
    } else {
      this.volume = 1;
    }
    super.play();
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
      this.unmuteFooter.classList.remove('on');
      this.onChildren.forEach((el) => {
        el.style.display = 'none';
      })
      this.offChildren.forEach((el) => {
        el.style.display = 'block';
      })
    } else {
      this.unmuteFooter.classList.add('on');
      this.offChildren.forEach((el) => {
        el.style.display = 'none';
      })
      this.onChildren.forEach((el) => {
        el.style.display = 'block';
      })
    }
  }
}

class VideoBackgroundItem extends MediaItem {
  constructor(videoWrapper) {
    super(videoWrapper);
    this.media.loop = true;
    this.media.addEventListener('canplay', () => {
      this.update();
    });
  }
  update() {
    this.resetVisibilityState();
    if (this.isNotVisible()) {
      this.media.pause();
    }
    if (this.isVisible()) {
      this.play();
    }
  }
}

// class VideoPlayerItem extends MediaItem {
//   constructor(audio) {
//     super(audio);
//   }
// }
//

class MediaCollection {
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
  anyItemPlaying() {
    let itemPlaying = false;
    this.items.forEach(item => {
      if (item.isPlaying()) {
        itemPlaying = true;
      }
    });
    return itemPlaying;
  }

}

export { AudioPlayerItem, AudioBackgroundItem, VideoBackgroundItem, MediaCollection };
