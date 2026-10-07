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
var bug_exports = {};
__export(bug_exports, {
  BugIcon: () => BugIcon
});
module.exports = __toCommonJS(bug_exports);
var import_create_icon = require("../../create-icon.cjs");
const BugIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BugIcon", [["path", { "d": "M12 20v-9" }], ["path", { "d": "M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z" }], ["path", { "d": "M14.12 3.88 16 2" }], ["path", { "d": "M21 21a4 4 0 0 0-3.81-4" }], ["path", { "d": "M21 5a4 4 0 0 1-3.55 3.97" }], ["path", { "d": "M22 13h-4" }], ["path", { "d": "M3 21a4 4 0 0 1 3.81-4" }], ["path", { "d": "M3 5a4 4 0 0 0 3.55 3.97" }], ["path", { "d": "M6 13H2" }], ["path", { "d": "m8 2 1.88 1.88" }], ["path", { "d": "M9 7.13V6a3 3 0 1 1 6 0v1.13" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BugIcon
});
