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
var adjustments_heart_exports = {};
__export(adjustments_heart_exports, {
  AdjustmentsHeartIcon: () => AdjustmentsHeartIcon
});
module.exports = __toCommonJS(adjustments_heart_exports);
var import_create_icon = require("../../create-icon.cjs");
const AdjustmentsHeartIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AdjustmentsHeartIcon", [["path", { "d": "M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M6 4v4" }], ["path", { "d": "M6 12v8" }], ["path", { "d": "M12 4v8.5" }], ["path", { "d": "M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M18 4v1" }], ["path", { "d": "M18 9v2.5" }], ["path", { "d": "M18 22l3.35 -3.284a2.143 2.143 0 0 0 .005 -3.071a2.242 2.242 0 0 0 -3.129 -.006l-.224 .22l-.223 -.22a2.242 2.242 0 0 0 -3.128 -.006a2.143 2.143 0 0 0 -.006 3.071l3.355 3.296" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdjustmentsHeartIcon
});
