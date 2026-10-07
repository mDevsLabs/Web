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
var list_checks_exports = {};
__export(list_checks_exports, {
  ListChecksIcon: () => ListChecksIcon
});
module.exports = __toCommonJS(list_checks_exports);
var import_create_icon = require("../../create-icon.cjs");
const ListChecksIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ListChecksIcon", [["path", { "d": "M13 5h8" }], ["path", { "d": "M13 12h8" }], ["path", { "d": "M13 19h8" }], ["path", { "d": "m3 17 2 2 4-4" }], ["path", { "d": "m3 7 2 2 4-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ListChecksIcon
});
