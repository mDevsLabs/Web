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
var anchor_exports = {};
__export(anchor_exports, {
  AnchorIcon: () => AnchorIcon
});
module.exports = __toCommonJS(anchor_exports);
var import_create_icon = require("../../create-icon.cjs");
const AnchorIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AnchorIcon", [["path", { "d": "M12 6v16" }], ["path", { "d": "m19 13 2-1a9 9 0 0 1-18 0l2 1" }], ["path", { "d": "M9 11h6" }], ["circle", { "cx": "12", "cy": "4", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AnchorIcon
});
