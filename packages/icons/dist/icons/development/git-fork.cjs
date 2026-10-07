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
var git_fork_exports = {};
__export(git_fork_exports, {
  GitForkIcon: () => GitForkIcon
});
module.exports = __toCommonJS(git_fork_exports);
var import_create_icon = require("../../create-icon.cjs");
const GitForkIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GitForkIcon", [["circle", { "cx": "12", "cy": "18", "r": "3" }], ["circle", { "cx": "6", "cy": "6", "r": "3" }], ["circle", { "cx": "18", "cy": "6", "r": "3" }], ["path", { "d": "M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" }], ["path", { "d": "M12 12v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GitForkIcon
});
