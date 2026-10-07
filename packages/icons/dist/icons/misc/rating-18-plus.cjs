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
var rating_18_plus_exports = {};
__export(rating_18_plus_exports, {
  Rating18PlusIcon: () => Rating18PlusIcon
});
module.exports = __toCommonJS(rating_18_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const Rating18PlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Rating18PlusIcon", [["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }], ["path", { "d": "M10 10.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" }], ["path", { "d": "M10 13.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" }], ["path", { "d": "M7 15v-6" }], ["path", { "d": "M15.5 12h3" }], ["path", { "d": "M17 10.5v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Rating18PlusIcon
});
