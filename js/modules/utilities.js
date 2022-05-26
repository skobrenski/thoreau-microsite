/*jshint esversion: 8 */

//
// Utilities
//

export const u = {};

u.deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

u.nextRepaint = () => {
  return new Promise(resolve => {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        resolve();
      });
    });
  });
}

// async function asyncCall() {
//   await nextRepaint();
//  ...
// }
