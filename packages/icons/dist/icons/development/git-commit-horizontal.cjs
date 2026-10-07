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
var git_commit_horizontal_exports = {};
__export(git_commit_horizontal_exports, {
  GitCommitHorizontalIcon: () => GitCommitHorizontalIcon
});
module.exports = __toCommonJS(git_commit_horizontal_exports);
var import_create_icon = require("../../create-icon.cjs");
const GitCommitHorizontalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GitCommitHorizontalIcon", [["circle", { "cx": "12", "cy": "12", "r": "3" }], ["line", { "x1": "3", "x2": "9", "y1": "12", "y2": "12" }], ["line", { "x1": "15", "x2": "21", "y1": "12", "y2": "12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GitCommitHorizontalIcon
});
