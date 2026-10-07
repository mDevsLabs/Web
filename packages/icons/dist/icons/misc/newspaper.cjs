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
var newspaper_exports = {};
__export(newspaper_exports, {
  NewspaperIcon: () => NewspaperIcon
});
module.exports = __toCommonJS(newspaper_exports);
var import_create_icon = require("../../create-icon.cjs");
const NewspaperIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("NewspaperIcon", [["path", { "d": "M15 18h-5" }], ["path", { "d": "M18 14h-8" }], ["path", { "d": "M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" }], ["rect", { "width": "8", "height": "4", "x": "10", "y": "6", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NewspaperIcon
});
