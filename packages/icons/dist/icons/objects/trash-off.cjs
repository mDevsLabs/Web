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
var trash_off_exports = {};
__export(trash_off_exports, {
  TrashOffIcon: () => TrashOffIcon
});
module.exports = __toCommonJS(trash_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const TrashOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TrashOffIcon", [["path", { "d": "M10 11v6" }], ["path", { "d": "M14 17v-3" }], ["path", { "d": "M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-1.576.768" }], ["path", { "d": "M19 6v7.344" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M21 6h-9.344" }], ["path", { "d": "M3 6h3" }], ["path", { "d": "M5 6v14a2 2 0 002 2h10a2 2 0 002-2v-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TrashOffIcon
});
