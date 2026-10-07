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
var view_exports = {};
__export(view_exports, {
  ViewIcon: () => ViewIcon
});
module.exports = __toCommonJS(view_exports);
var import_create_icon = require("../../create-icon.cjs");
const ViewIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ViewIcon", [["path", { "d": "M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" }], ["path", { "d": "M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" }], ["circle", { "cx": "12", "cy": "12", "r": "1" }], ["path", { "d": "M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ViewIcon
});
