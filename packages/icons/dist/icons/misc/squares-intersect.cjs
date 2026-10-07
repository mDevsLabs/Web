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
var squares_intersect_exports = {};
__export(squares_intersect_exports, {
  SquaresIntersectIcon: () => SquaresIntersectIcon
});
module.exports = __toCommonJS(squares_intersect_exports);
var import_create_icon = require("../../create-icon.cjs");
const SquaresIntersectIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SquaresIntersectIcon", [["path", { "d": "M10 22a2 2 0 0 1-2-2" }], ["path", { "d": "M14 2a2 2 0 0 1 2 2" }], ["path", { "d": "M16 22h-2" }], ["path", { "d": "M2 10V8" }], ["path", { "d": "M2 4a2 2 0 0 1 2-2" }], ["path", { "d": "M20 8a2 2 0 0 1 2 2" }], ["path", { "d": "M22 14v2" }], ["path", { "d": "M22 20a2 2 0 0 1-2 2" }], ["path", { "d": "M4 16a2 2 0 0 1-2-2" }], ["path", { "d": "M8 10a2 2 0 0 1 2-2h5a1 1 0 0 1 1 1v5a2 2 0 0 1-2 2H9a1 1 0 0 1-1-1z" }], ["path", { "d": "M8 2h2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SquaresIntersectIcon
});
