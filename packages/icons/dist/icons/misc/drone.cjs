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
var drone_exports = {};
__export(drone_exports, {
  DroneIcon: () => DroneIcon
});
module.exports = __toCommonJS(drone_exports);
var import_create_icon = require("../../create-icon.cjs");
const DroneIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DroneIcon", [["path", { "d": "M10 10 7 7" }], ["path", { "d": "m10 14-3 3" }], ["path", { "d": "m14 10 3-3" }], ["path", { "d": "m14 14 3 3" }], ["path", { "d": "M14.205 4.139a4 4 0 1 1 5.439 5.863" }], ["path", { "d": "M19.637 14a4 4 0 1 1-5.432 5.868" }], ["path", { "d": "M4.367 10a4 4 0 1 1 5.438-5.862" }], ["path", { "d": "M9.795 19.862a4 4 0 1 1-5.429-5.873" }], ["rect", { "x": "10", "y": "8", "width": "4", "height": "8", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DroneIcon
});
