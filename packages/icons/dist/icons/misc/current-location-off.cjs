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
var current_location_off_exports = {};
__export(current_location_off_exports, {
  CurrentLocationOffIcon: () => CurrentLocationOffIcon
});
module.exports = __toCommonJS(current_location_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CurrentLocationOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CurrentLocationOffIcon", [["path", { "d": "M14.685 10.661c-.3 -.6 -.795 -1.086 -1.402 -1.374m-3.397 .584a3 3 0 1 0 4.24 4.245" }], ["path", { "d": "M6.357 6.33a8 8 0 1 0 11.301 11.326m1.642 -2.378a8 8 0 0 0 -10.597 -10.569" }], ["path", { "d": "M12 2v2" }], ["path", { "d": "M12 20v2" }], ["path", { "d": "M20 12h2" }], ["path", { "d": "M2 12h2" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CurrentLocationOffIcon
});
