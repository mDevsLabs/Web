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
var fish_hook_exports = {};
__export(fish_hook_exports, {
  FishHookIcon: () => FishHookIcon
});
module.exports = __toCommonJS(fish_hook_exports);
var import_create_icon = require("../../create-icon.cjs");
const FishHookIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FishHookIcon", [["path", { "d": "M16 9v6a5 5 0 0 1 -10 0v-4l3 3" }], ["path", { "d": "M14 7a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M16 5v-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FishHookIcon
});
