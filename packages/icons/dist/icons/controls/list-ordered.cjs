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
var list_ordered_exports = {};
__export(list_ordered_exports, {
  ListOrderedIcon: () => ListOrderedIcon
});
module.exports = __toCommonJS(list_ordered_exports);
var import_create_icon = require("../../create-icon.cjs");
const ListOrderedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ListOrderedIcon", [["path", { "d": "M11 5h10" }], ["path", { "d": "M11 12h10" }], ["path", { "d": "M11 19h10" }], ["path", { "d": "M4 4h1v5" }], ["path", { "d": "M4 9h2" }], ["path", { "d": "M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ListOrderedIcon
});
