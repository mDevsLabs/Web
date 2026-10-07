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
var gender_androgyne_exports = {};
__export(gender_androgyne_exports, {
  GenderAndrogyneIcon: () => GenderAndrogyneIcon
});
module.exports = __toCommonJS(gender_androgyne_exports);
var import_create_icon = require("../../create-icon.cjs");
const GenderAndrogyneIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GenderAndrogyneIcon", [["path", { "d": "M13 11l6 -6" }], ["path", { "d": "M4 15a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" }], ["path", { "d": "M19 9v-4h-4" }], ["path", { "d": "M16.5 10.5l-3 -3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GenderAndrogyneIcon
});
