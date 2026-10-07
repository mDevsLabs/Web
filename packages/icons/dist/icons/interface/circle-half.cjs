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
var circle_half_exports = {};
__export(circle_half_exports, {
  CircleHalfIcon: () => CircleHalfIcon
});
module.exports = __toCommonJS(circle_half_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleHalfIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleHalfIcon", [["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }], ["path", { "d": "M12 3v18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleHalfIcon
});
