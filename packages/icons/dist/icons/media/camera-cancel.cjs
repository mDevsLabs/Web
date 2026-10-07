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
var camera_cancel_exports = {};
__export(camera_cancel_exports, {
  CameraCancelIcon: () => CameraCancelIcon
});
module.exports = __toCommonJS(camera_cancel_exports);
var import_create_icon = require("../../create-icon.cjs");
const CameraCancelIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CameraCancelIcon", [["path", { "d": "M12 20h-7a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v3.5" }], ["path", { "d": "M14.984 13.307a3 3 0 1 0 -2.32 2.62" }], ["path", { "d": "M16 19a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }], ["path", { "d": "M17 21l4 -4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CameraCancelIcon
});
