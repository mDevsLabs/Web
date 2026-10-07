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
var blind_exports = {};
__export(blind_exports, {
  BlindIcon: () => BlindIcon
});
module.exports = __toCommonJS(blind_exports);
var import_create_icon = require("../../create-icon.cjs");
const BlindIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BlindIcon", [["path", { "d": "M9 4a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" }], ["path", { "d": "M4 21l3 -4" }], ["path", { "d": "M13 21l-2 -4l-3 -3l1 -6" }], ["path", { "d": "M3 12l2 -3l4 -1l6 4" }], ["path", { "d": "M16.5 14l3.5 7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BlindIcon
});
