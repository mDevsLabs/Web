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
var git_branch_x_exports = {};
__export(git_branch_x_exports, {
  GitBranchXIcon: () => GitBranchXIcon
});
module.exports = __toCommonJS(git_branch_x_exports);
var import_create_icon = require("../../create-icon.cjs");
const GitBranchXIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GitBranchXIcon", [["path", { "d": "M5 18a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M5 6a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M15 6a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M7 8v8" }], ["path", { "d": "M7 12h8a2 2 0 0 0 2 -2v-2" }], ["path", { "d": "M22 22l-5 -5" }], ["path", { "d": "M17 22l5 -5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GitBranchXIcon
});
