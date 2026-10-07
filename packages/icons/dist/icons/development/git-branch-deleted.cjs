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
var git_branch_deleted_exports = {};
__export(git_branch_deleted_exports, {
  GitBranchDeletedIcon: () => GitBranchDeletedIcon
});
module.exports = __toCommonJS(git_branch_deleted_exports);
var import_create_icon = require("../../create-icon.cjs");
const GitBranchDeletedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GitBranchDeletedIcon", [["path", { "d": "M5 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M5 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M7 8v8" }], ["path", { "d": "M9 18h6a2 2 0 0 0 2 -2v-5" }], ["path", { "d": "M14 14l3 -3l3 3" }], ["path", { "d": "M15 4l4 4" }], ["path", { "d": "M15 8l4 -4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GitBranchDeletedIcon
});
