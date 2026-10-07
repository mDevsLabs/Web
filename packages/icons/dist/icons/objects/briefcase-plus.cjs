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
var briefcase_plus_exports = {};
__export(briefcase_plus_exports, {
  BriefcasePlusIcon: () => BriefcasePlusIcon
});
module.exports = __toCommonJS(briefcase_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const BriefcasePlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BriefcasePlusIcon", [["path", { "d": "M13.354 20H4a2 2 0 01-2-2V8a2 2 0 012-2h16a2 2 0 012 2v3.354" }], ["path", { "d": "M16 11.354V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" }], ["path", { "d": "M16 17h6" }], ["path", { "d": "M19 14v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BriefcasePlusIcon
});
