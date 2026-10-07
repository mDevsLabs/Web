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
var circle_off_exports = {};
__export(circle_off_exports, {
  CircleOffIcon: () => CircleOffIcon
});
module.exports = __toCommonJS(circle_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleOffIcon", [["path", { "d": "m2 2 20 20" }], ["path", { "d": "M8.35 2.69A10 10 0 0 1 21.3 15.65" }], ["path", { "d": "M19.08 19.08A10 10 0 1 1 4.92 4.92" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleOffIcon
});
