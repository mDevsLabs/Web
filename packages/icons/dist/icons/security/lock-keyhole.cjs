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
var lock_keyhole_exports = {};
__export(lock_keyhole_exports, {
  LockKeyholeIcon: () => LockKeyholeIcon
});
module.exports = __toCommonJS(lock_keyhole_exports);
var import_create_icon = require("../../create-icon.cjs");
const LockKeyholeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LockKeyholeIcon", [["circle", { "cx": "12", "cy": "16", "r": "1" }], ["rect", { "x": "3", "y": "10", "width": "18", "height": "12", "rx": "2" }], ["path", { "d": "M7 10V7a5 5 0 0 1 10 0v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LockKeyholeIcon
});
