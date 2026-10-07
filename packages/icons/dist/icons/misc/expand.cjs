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
var expand_exports = {};
__export(expand_exports, {
  ExpandIcon: () => ExpandIcon
});
module.exports = __toCommonJS(expand_exports);
var import_create_icon = require("../../create-icon.cjs");
const ExpandIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ExpandIcon", [["path", { "d": "m15 15 6 6" }], ["path", { "d": "m15 9 6-6" }], ["path", { "d": "M21 16v5h-5" }], ["path", { "d": "M21 8V3h-5" }], ["path", { "d": "M3 16v5h5" }], ["path", { "d": "m3 21 6-6" }], ["path", { "d": "M3 8V3h5" }], ["path", { "d": "M9 9 3 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExpandIcon
});
