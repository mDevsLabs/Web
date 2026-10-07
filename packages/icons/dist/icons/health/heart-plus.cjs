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
var heart_plus_exports = {};
__export(heart_plus_exports, {
  HeartPlusIcon: () => HeartPlusIcon
});
module.exports = __toCommonJS(heart_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const HeartPlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HeartPlusIcon", [["path", { "d": "m14.479 19.374-.971.939a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5a5.2 5.2 0 0 1-.219 1.49" }], ["path", { "d": "M15 15h6" }], ["path", { "d": "M18 12v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HeartPlusIcon
});
