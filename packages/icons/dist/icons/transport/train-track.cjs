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
var train_track_exports = {};
__export(train_track_exports, {
  TrainTrackIcon: () => TrainTrackIcon
});
module.exports = __toCommonJS(train_track_exports);
var import_create_icon = require("../../create-icon.cjs");
const TrainTrackIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TrainTrackIcon", [["path", { "d": "M2 17 17 2" }], ["path", { "d": "m2 14 8 8" }], ["path", { "d": "m5 11 8 8" }], ["path", { "d": "m8 8 8 8" }], ["path", { "d": "m11 5 8 8" }], ["path", { "d": "m14 2 8 8" }], ["path", { "d": "M7 22 22 7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TrainTrackIcon
});
