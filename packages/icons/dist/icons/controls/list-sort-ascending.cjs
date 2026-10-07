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
var list_sort_ascending_exports = {};
__export(list_sort_ascending_exports, {
  ListSortAscendingIcon: () => ListSortAscendingIcon
});
module.exports = __toCommonJS(list_sort_ascending_exports);
var import_create_icon = require("../../create-icon.cjs");
const ListSortAscendingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ListSortAscendingIcon", [["path", { "d": "M3 19h18" }], ["path", { "d": "M15 12H3" }], ["path", { "d": "M9 5H3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ListSortAscendingIcon
});
