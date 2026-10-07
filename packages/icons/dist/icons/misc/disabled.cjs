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
var disabled_exports = {};
__export(disabled_exports, {
  DisabledIcon: () => DisabledIcon
});
module.exports = __toCommonJS(disabled_exports);
var import_create_icon = require("../../create-icon.cjs");
const DisabledIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DisabledIcon", [["path", { "d": "M9 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M11 7l0 8l4 0l4 5" }], ["path", { "d": "M11 11l5 0" }], ["path", { "d": "M7 11.5a5 5 0 1 0 6 7.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DisabledIcon
});
