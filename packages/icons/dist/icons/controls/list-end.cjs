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
var list_end_exports = {};
__export(list_end_exports, {
  ListEndIcon: () => ListEndIcon
});
module.exports = __toCommonJS(list_end_exports);
var import_create_icon = require("../../create-icon.cjs");
const ListEndIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ListEndIcon", [["path", { "d": "M16 5H3" }], ["path", { "d": "M16 12H3" }], ["path", { "d": "M9 19H3" }], ["path", { "d": "m16 16-3 3 3 3" }], ["path", { "d": "M21 5v12a2 2 0 0 1-2 2h-6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ListEndIcon
});
