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
var heart_pulse_exports = {};
__export(heart_pulse_exports, {
  HeartPulseIcon: () => HeartPulseIcon
});
module.exports = __toCommonJS(heart_pulse_exports);
var import_create_icon = require("../../create-icon.cjs");
const HeartPulseIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HeartPulseIcon", [["path", { "d": "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" }], ["path", { "d": "M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HeartPulseIcon
});
