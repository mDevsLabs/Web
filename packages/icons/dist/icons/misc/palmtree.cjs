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
var palmtree_exports = {};
__export(palmtree_exports, {
  PalmtreeIcon: () => PalmtreeIcon
});
module.exports = __toCommonJS(palmtree_exports);
var import_create_icon = require("../../create-icon.cjs");
const PalmtreeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PalmtreeIcon", [["path", { "d": "M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4" }], ["path", { "d": "M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3" }], ["path", { "d": "M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35" }], ["path", { "d": "M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PalmtreeIcon
});
