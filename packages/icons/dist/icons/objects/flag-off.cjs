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
var flag_off_exports = {};
__export(flag_off_exports, {
  FlagOffIcon: () => FlagOffIcon
});
module.exports = __toCommonJS(flag_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const FlagOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FlagOffIcon", [["path", { "d": "M16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M4 22V4" }], ["path", { "d": "M7.656 2H8c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10.347" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FlagOffIcon
});
