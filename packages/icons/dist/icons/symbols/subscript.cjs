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
var subscript_exports = {};
__export(subscript_exports, {
  SubscriptIcon: () => SubscriptIcon
});
module.exports = __toCommonJS(subscript_exports);
var import_create_icon = require("../../create-icon.cjs");
const SubscriptIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SubscriptIcon", [["path", { "d": "m4 5 8 8" }], ["path", { "d": "m12 5-8 8" }], ["path", { "d": "M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SubscriptIcon
});
