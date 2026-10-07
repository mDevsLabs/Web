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
var iteration_ccw_exports = {};
__export(iteration_ccw_exports, {
  IterationCcwIcon: () => IterationCcwIcon
});
module.exports = __toCommonJS(iteration_ccw_exports);
var import_create_icon = require("../../create-icon.cjs");
const IterationCcwIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("IterationCcwIcon", [["path", { "d": "m16 14 4 4-4 4" }], ["path", { "d": "M20 10a8 8 0 1 0-8 8h8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IterationCcwIcon
});
