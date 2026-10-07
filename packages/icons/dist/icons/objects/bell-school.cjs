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
var bell_school_exports = {};
__export(bell_school_exports, {
  BellSchoolIcon: () => BellSchoolIcon
});
module.exports = __toCommonJS(bell_school_exports);
var import_create_icon = require("../../create-icon.cjs");
const BellSchoolIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BellSchoolIcon", [["path", { "d": "M4 10a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" }], ["path", { "d": "M13.5 15h.5a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-1a2 2 0 0 1 2 -2h.5" }], ["path", { "d": "M16 17a5.698 5.698 0 0 0 4.467 -7.932l-.467 -1.068" }], ["path", { "d": "M10 10v.01" }], ["path", { "d": "M19 8a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BellSchoolIcon
});
