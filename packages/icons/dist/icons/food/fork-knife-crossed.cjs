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
var fork_knife_crossed_exports = {};
__export(fork_knife_crossed_exports, {
  ForkKnifeCrossedIcon: () => ForkKnifeCrossedIcon
});
module.exports = __toCommonJS(fork_knife_crossed_exports);
var import_create_icon = require("../../create-icon.cjs");
const ForkKnifeCrossedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ForkKnifeCrossedIcon", [["path", { "d": "m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" }], ["path", { "d": "M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" }], ["path", { "d": "m2.1 21.8 6.4-6.3" }], ["path", { "d": "m19 5-7 7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ForkKnifeCrossedIcon
});
