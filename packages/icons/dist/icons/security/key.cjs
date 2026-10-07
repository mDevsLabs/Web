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
var key_exports = {};
__export(key_exports, {
  KeyIcon: () => KeyIcon
});
module.exports = __toCommonJS(key_exports);
var import_create_icon = require("../../create-icon.cjs");
const KeyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("KeyIcon", [["path", { "d": "m2 21 9.6-9.6" }], ["path", { "d": "m7.5 15.5 2.3 2.3a1 1 0 0 1 0 1.4l-2.1 2.1a1 1 0 0 1-1.4 0L4 19" }], ["circle", { "cx": "15.5", "cy": "7.5", "r": "5.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KeyIcon
});
