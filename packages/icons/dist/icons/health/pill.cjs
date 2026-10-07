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
var pill_exports = {};
__export(pill_exports, {
  PillIcon: () => PillIcon
});
module.exports = __toCommonJS(pill_exports);
var import_create_icon = require("../../create-icon.cjs");
const PillIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PillIcon", [["path", { "d": "m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" }], ["path", { "d": "m8.5 8.5 7 7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PillIcon
});
