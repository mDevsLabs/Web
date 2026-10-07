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
var tent_exports = {};
__export(tent_exports, {
  TentIcon: () => TentIcon
});
module.exports = __toCommonJS(tent_exports);
var import_create_icon = require("../../create-icon.cjs");
const TentIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TentIcon", [["path", { "d": "M3.5 21 14 3" }], ["path", { "d": "M20.5 21 10 3" }], ["path", { "d": "M15.5 21 12 15l-3.5 6" }], ["path", { "d": "M2 21h20" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TentIcon
});
