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
var step_forward_exports = {};
__export(step_forward_exports, {
  StepForwardIcon: () => StepForwardIcon
});
module.exports = __toCommonJS(step_forward_exports);
var import_create_icon = require("../../create-icon.cjs");
const StepForwardIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("StepForwardIcon", [["path", { "d": "M10.029 4.285A2 2 0 0 0 7 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" }], ["path", { "d": "M3 4v16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StepForwardIcon
});
