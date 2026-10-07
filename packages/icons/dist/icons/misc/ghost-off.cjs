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
var ghost_off_exports = {};
__export(ghost_off_exports, {
  GhostOffIcon: () => GhostOffIcon
});
module.exports = __toCommonJS(ghost_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const GhostOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GhostOffIcon", [["path", { "d": "M8.794 4.776a7 7 0 0 1 10.206 6.224v4m-.12 3.898a1.779 1.779 0 0 1 -2.98 .502a1.65 1.65 0 0 0 -2.6 0a1.65 1.65 0 0 1 -2.6 0a1.65 1.65 0 0 0 -2.6 0a1.78 1.78 0 0 1 -3.1 -1.4v-7c0 -1.683 .594 -3.227 1.583 -4.434" }], ["path", { "d": "M14 10h.01" }], ["path", { "d": "M10 14a3.5 3.5 0 0 0 4 0" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GhostOffIcon
});
