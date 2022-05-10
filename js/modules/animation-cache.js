/*jshint esversion: 8 */

import { app } from "./globals.js"

const preFetchNotSupported = () => {
  const prefetchLink = document.querySelector('link[rel="prefetch"]');
  return (!prefetchLink.relList.supports('prefetch'));
}

const preFetchAnimationImagesManually = (cacheDataSegments) => {
  app.logger('browser doesn\'t support <link rel="prefetch">, caching animatipn images manually with JavaScript');
  let frame, image, src, paddednum;
  let images = [];
  cacheDataSegments.forEach(cacheData => {
    for (frame = cacheData.startFrame; frame <= cacheData.endFrame; frame++) {
      image = new Image();
      paddednum = frame.toString().padStart(5, '0');
      src = `./media/animations/${cacheData.imgPrefix}_${paddednum}.png`
      image.src = src;
      images.push(image);
    }
  })
}

export { preFetchNotSupported, preFetchAnimationImagesManually };
