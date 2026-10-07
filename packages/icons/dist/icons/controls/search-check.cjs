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
var search_check_exports = {};
__export(search_check_exports, {
  SearchCheckIcon: () => SearchCheckIcon
});
module.exports = __toCommonJS(search_check_exports);
var import_create_icon = require("../../create-icon.cjs");
const SearchCheckIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SearchCheckIcon", [["path", { "d": "m8 11 2 2 4-4" }], ["circle", { "cx": "11", "cy": "11", "r": "8" }], ["path", { "d": "m21 21-4.3-4.3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SearchCheckIcon
});
