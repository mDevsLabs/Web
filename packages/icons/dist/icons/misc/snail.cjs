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
var snail_exports = {};
__export(snail_exports, {
  SnailIcon: () => SnailIcon
});
module.exports = __toCommonJS(snail_exports);
var import_create_icon = require("../../create-icon.cjs");
const SnailIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SnailIcon", [["path", { "d": "M2 13a6 6 0 1 0 12 0 4 4 0 1 0-8 0 2 2 0 0 0 4 0" }], ["circle", { "cx": "10", "cy": "13", "r": "8" }], ["path", { "d": "M2 21h12c4.4 0 8-3.6 8-8V7a2 2 0 1 0-4 0v6" }], ["path", { "d": "M18 3 19.1 5.2" }], ["path", { "d": "M22 3 20.9 5.2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SnailIcon
});
