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
var balloon_off_exports = {};
__export(balloon_off_exports, {
  BalloonOffIcon: () => BalloonOffIcon
});
module.exports = __toCommonJS(balloon_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BalloonOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BalloonOffIcon", [["path", { "d": "M14 8a2 2 0 0 0 -2 -2" }], ["path", { "d": "M7.762 3.753a6 6 0 0 1 10.238 4.247c0 1.847 -.37 3.564 -1.007 4.993m-1.59 2.42c-.967 1 -2.14 1.587 -3.403 1.587c-3.314 0 -6 -4.03 -6 -9c0 -.593 .086 -1.166 .246 -1.707" }], ["path", { "d": "M12 17v1a2 2 0 0 1 -2 2h-3a2 2 0 0 0 -2 2" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BalloonOffIcon
});
