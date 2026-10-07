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
var towel_rack_exports = {};
__export(towel_rack_exports, {
  TowelRackIcon: () => TowelRackIcon
});
module.exports = __toCommonJS(towel_rack_exports);
var import_create_icon = require("../../create-icon.cjs");
const TowelRackIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TowelRackIcon", [["path", { "d": "M22 7h-2" }], ["path", { "d": "M6.5 3h11A2.5 2.5 0 0 1 20 5.5V20a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V5.5a1 1 0 0 0-5 0V17a1 1 0 0 0 1 1h4" }], ["path", { "d": "M9 7H2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TowelRackIcon
});
