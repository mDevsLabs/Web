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
var triangle_right_exports = {};
__export(triangle_right_exports, {
  TriangleRightIcon: () => TriangleRightIcon
});
module.exports = __toCommonJS(triangle_right_exports);
var import_create_icon = require("../../create-icon.cjs");
const TriangleRightIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TriangleRightIcon", [["path", { "d": "M22 18a2 2 0 0 1-2 2H3c-1.1 0-1.3-.6-.4-1.3L20.4 4.3c.9-.7 1.6-.4 1.6.7Z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TriangleRightIcon
});
