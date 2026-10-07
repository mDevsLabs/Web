"use client";
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var compass_off_exports = {};
__export(compass_off_exports, {
  CompassOffIcon: () => CompassOffIcon
});
module.exports = __toCommonJS(compass_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CompassOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CompassOffIcon", [["path", { "d": "M13 9l3 -1l-1 3m-1 3l-6 2l2 -6" }], ["path", { "d": "M20.042 16.045a9 9 0 0 0 -12.087 -12.087m-2.318 1.677a9 9 0 1 0 12.725 12.73" }], ["path", { "d": "M12 3v2" }], ["path", { "d": "M12 19v2" }], ["path", { "d": "M3 12h2" }], ["path", { "d": "M19 12h2" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CompassOffIcon
});
