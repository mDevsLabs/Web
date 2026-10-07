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
var chocolate_exports = {};
__export(chocolate_exports, {
  ChocolateIcon: () => ChocolateIcon
});
module.exports = __toCommonJS(chocolate_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChocolateIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChocolateIcon", [["path", { "d": "M12 21v-16" }], ["path", { "d": "M6 15h12" }], ["path", { "d": "M6 9h10.5" }], ["path", { "d": "M10.05 3a2.5 2.5 0 0 0 3.987 1.47a3 3 0 0 0 2.047 2.387a2.504 2.504 0 0 0 1.916 3.093v9.05a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h2.05" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChocolateIcon
});
