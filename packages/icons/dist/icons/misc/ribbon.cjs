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
var ribbon_exports = {};
__export(ribbon_exports, {
  RibbonIcon: () => RibbonIcon
});
module.exports = __toCommonJS(ribbon_exports);
var import_create_icon = require("../../create-icon.cjs");
const RibbonIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RibbonIcon", [["path", { "d": "M12 11.22C11 9.997 10 9 10 8a2 2 0 0 1 4 0c0 1-.998 2.002-2.01 3.22" }], ["path", { "d": "m12 18 2.57-3.5" }], ["path", { "d": "M6.243 9.016a7 7 0 0 1 11.507-.009" }], ["path", { "d": "M9.35 14.53 12 11.22" }], ["path", { "d": "M9.35 14.53C7.728 12.246 6 10.221 6 7a6 5 0 0 1 12 0c-.005 3.22-1.778 5.235-3.43 7.5l3.557 4.527a1 1 0 0 1-.203 1.43l-1.894 1.36a1 1 0 0 1-1.384-.215L12 18l-2.679 3.593a1 1 0 0 1-1.39.213l-1.865-1.353a1 1 0 0 1-.203-1.422z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RibbonIcon
});
