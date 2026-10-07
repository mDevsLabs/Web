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
var git_branch_exports = {};
__export(git_branch_exports, {
  GitBranchIcon: () => GitBranchIcon
});
module.exports = __toCommonJS(git_branch_exports);
var import_create_icon = require("../../create-icon.cjs");
const GitBranchIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GitBranchIcon", [["path", { "d": "M15 6a9 9 0 0 0-9 9V3" }], ["circle", { "cx": "18", "cy": "6", "r": "3" }], ["circle", { "cx": "6", "cy": "18", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GitBranchIcon
});
