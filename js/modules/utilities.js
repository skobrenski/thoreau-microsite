/*jshint esversion: 8 */

//
// Utilities
//

export const u = {};

u.deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};
