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
var spline_pointer_exports = {};
__export(spline_pointer_exports, {
  SplinePointerIcon: () => SplinePointerIcon
});
module.exports = __toCommonJS(spline_pointer_exports);
var import_create_icon = require("../../create-icon.cjs");
const SplinePointerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SplinePointerIcon", [["path", { "d": "M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" }], ["path", { "d": "M5 17A12 12 0 0 1 17 5" }], ["circle", { "cx": "19", "cy": "5", "r": "2" }], ["circle", { "cx": "5", "cy": "19", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SplinePointerIcon
});
