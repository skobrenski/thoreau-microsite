/*jshint esversion: 8 */
/*global  app startup */
//
// move these to spyglass.js
//

const animationFrameCallback = (animationFrameNum, animationFrameImg) => {
  if (animationFrameNum >= 0) {
    let paddedFrameNum = (animationFrameNum).toString().padStart(5, '0');
    let newSrc = `media/images/animations/spyglass/Spyglass_PNGSeq_01__${paddedFrameNum}.png`;
    if (animationFrameImg.src !== newSrc) {
      animationFrameImg.src = newSrc;
    }
  }
}

let animation = {
  callback: animationFrameCallback,
  start: 46,
  count: 243 - 45
}
app.maxContentScroll = 6;

app.domReady(startup('spyglass', animation));
