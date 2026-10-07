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
var angry_exports = {};
__export(angry_exports, {
  AngryIcon: () => AngryIcon
});
module.exports = __toCommonJS(angry_exports);
var import_create_icon = require("../../create-icon.cjs");
const AngryIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AngryIcon", [["path", { "d": "M15 12v-1.584" }], ["path", { "d": "M17 10a5 5 0 00-3 1" }], ["path", { "d": "M7 10a5 5 0 013 1" }], ["path", { "d": "M9 12v-1.584" }], ["path", { "d": "M9 17a5 5 0 016.001 0" }], ["circle", { "cx": "12", "cy": "12", "r": "10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AngryIcon
});
