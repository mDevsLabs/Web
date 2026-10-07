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
var podium_exports = {};
__export(podium_exports, {
  PodiumIcon: () => PodiumIcon
});
module.exports = __toCommonJS(podium_exports);
var import_create_icon = require("../../create-icon.cjs");
const PodiumIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PodiumIcon", [["path", { "d": "M12 6V2h-1" }], ["path", { "d": "M9 15a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1" }], ["path", { "d": "M9 21V11a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PodiumIcon
});
