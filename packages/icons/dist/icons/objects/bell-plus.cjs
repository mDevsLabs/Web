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
var bell_plus_exports = {};
__export(bell_plus_exports, {
  BellPlusIcon: () => BellPlusIcon
});
module.exports = __toCommonJS(bell_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const BellPlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BellPlusIcon", [["path", { "d": "M10.268 21a2 2 0 0 0 3.464 0" }], ["path", { "d": "M15 8h6" }], ["path", { "d": "M18 5v6" }], ["path", { "d": "M20.002 14.464a9 9 0 0 0 .738.863A1 1 0 0 1 20 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 8.75-5.332" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BellPlusIcon
});
