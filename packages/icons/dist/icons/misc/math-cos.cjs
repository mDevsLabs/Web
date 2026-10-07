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
var math_cos_exports = {};
__export(math_cos_exports, {
  MathCosIcon: () => MathCosIcon
});
module.exports = __toCommonJS(math_cos_exports);
var import_create_icon = require("../../create-icon.cjs");
const MathCosIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MathCosIcon", [["path", { "d": "M7 10a2 2 0 1 0 -4 0v4a2 2 0 1 0 4 0" }], ["path", { "d": "M12 8a2 2 0 0 1 2 2v4a2 2 0 1 1 -4 0v-4a2 2 0 0 1 2 -2" }], ["path", { "d": "M17 15c.345 .6 1.258 1 2 1a2 2 0 1 0 0 -4a2 2 0 1 1 0 -4c.746 0 1.656 .394 2 1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MathCosIcon
});
