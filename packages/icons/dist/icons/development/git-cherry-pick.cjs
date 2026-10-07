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
var git_cherry_pick_exports = {};
__export(git_cherry_pick_exports, {
  GitCherryPickIcon: () => GitCherryPickIcon
});
module.exports = __toCommonJS(git_cherry_pick_exports);
var import_create_icon = require("../../create-icon.cjs");
const GitCherryPickIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GitCherryPickIcon", [["path", { "d": "M4 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }], ["path", { "d": "M7 3v6" }], ["path", { "d": "M7 15v6" }], ["path", { "d": "M13 7h2.5l1.5 5l-1.5 5h-2.5" }], ["path", { "d": "M17 12h3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GitCherryPickIcon
});
