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
var fishing_hook_exports = {};
__export(fishing_hook_exports, {
  FishingHookIcon: () => FishingHookIcon
});
module.exports = __toCommonJS(fishing_hook_exports);
var import_create_icon = require("../../create-icon.cjs");
const FishingHookIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FishingHookIcon", [["path", { "d": "m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10" }], ["path", { "d": "M20.414 8.586 22 7" }], ["circle", { "cx": "19", "cy": "10", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FishingHookIcon
});
