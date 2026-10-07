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
var rocket_exports = {};
__export(rocket_exports, {
  RocketIcon: () => RocketIcon
});
module.exports = __toCommonJS(rocket_exports);
var import_create_icon = require("../../create-icon.cjs");
const RocketIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RocketIcon", [["path", { "d": "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" }], ["path", { "d": "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" }], ["path", { "d": "M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" }], ["path", { "d": "M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RocketIcon
});
