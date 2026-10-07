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
var acrobatic_exports = {};
__export(acrobatic_exports, {
  AcrobaticIcon: () => AcrobaticIcon
});
module.exports = __toCommonJS(acrobatic_exports);
var import_create_icon = require("../../create-icon.cjs");
const AcrobaticIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AcrobaticIcon", [["path", { "d": "M13.207 3l-6.735 2.462a1 1 0 0 0 -.364 1.646l1.892 1.892" }], ["path", { "d": "M10.5 8.25l1.5 -.25h3.174a2 2 0 0 1 1.411 .583l1.422 1.417" }], ["path", { "d": "M8 9c0 4.5 1.781 5.14 3 5.5" }], ["path", { "d": "M13.007 21h-1a1 1 0 0 1 -1 -1l-.007 -5.5" }], ["path", { "d": "M12.007 14a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AcrobaticIcon
});
