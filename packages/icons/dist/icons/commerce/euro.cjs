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
var euro_exports = {};
__export(euro_exports, {
  EuroIcon: () => EuroIcon
});
module.exports = __toCommonJS(euro_exports);
var import_create_icon = require("../../create-icon.cjs");
const EuroIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EuroIcon", [["path", { "d": "M4 10h12" }], ["path", { "d": "M4 14h9" }], ["path", { "d": "M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EuroIcon
});
