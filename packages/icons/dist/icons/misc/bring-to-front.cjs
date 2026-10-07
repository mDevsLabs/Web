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
var bring_to_front_exports = {};
__export(bring_to_front_exports, {
  BringToFrontIcon: () => BringToFrontIcon
});
module.exports = __toCommonJS(bring_to_front_exports);
var import_create_icon = require("../../create-icon.cjs");
const BringToFrontIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BringToFrontIcon", [["rect", { "x": "8", "y": "8", "width": "8", "height": "8", "rx": "2" }], ["path", { "d": "M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" }], ["path", { "d": "M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BringToFrontIcon
});
