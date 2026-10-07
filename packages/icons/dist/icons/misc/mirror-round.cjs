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
var mirror_round_exports = {};
__export(mirror_round_exports, {
  MirrorRoundIcon: () => MirrorRoundIcon
});
module.exports = __toCommonJS(mirror_round_exports);
var import_create_icon = require("../../create-icon.cjs");
const MirrorRoundIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MirrorRoundIcon", [["path", { "d": "M10 6.6 8.6 8" }], ["path", { "d": "M12 18v4" }], ["path", { "d": "M15 7.5 9.5 13" }], ["path", { "d": "M7 22h10" }], ["circle", { "cx": "12", "cy": "10", "r": "8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MirrorRoundIcon
});
