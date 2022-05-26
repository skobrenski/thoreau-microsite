/*jshint esversion: 8 */
/*global  */

// eslint-disable-next-line no-unused-vars
if (window.app === undefined) {
  window.app = {
    dev: false
  };
}

export const app = window.app;

// eslint-disable-next-line no-unused-vars
app.domReady = (callBack) => {
  if (document.readyState === "loading") {
    document.addEventListener('DOMContentLoaded', callBack);
  } else {
    callBack();
  }
}

// eslint-disable-next-line no-unused-vars
app.windowReady = (callBack) => {
  if (document.readyState === 'complete') {
    callBack();
  } else {
    window.addEventListener('load', callBack);
  }
}

// eslint-disable-next-line no-unused-vars
app.reflow = (element) => {
  if (element === undefined) {
    element = document.documentElement;
  }
  void(element.offsetHeight);
}

// const
// requestAnimationFrame(() => { setTimeout(() => {} });

// eslint-disable-next-line no-unused-vars
app.logger = (...args) => {
  if (app.dev) {
    console.log(...args);
  }
}

app.loggerVolume = (...args) => {
  if (app.volume) {
    console.log(...args);
  }
}
