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
var fork_knife_exports = {};
__export(fork_knife_exports, {
  ForkKnifeIcon: () => ForkKnifeIcon
});
module.exports = __toCommonJS(fork_knife_exports);
var import_create_icon = require("../../create-icon.cjs");
const ForkKnifeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ForkKnifeIcon", [["path", { "d": "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" }], ["path", { "d": "M7 2v20" }], ["path", { "d": "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ForkKnifeIcon
});
