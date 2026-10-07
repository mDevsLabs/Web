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
var shrub_exports = {};
__export(shrub_exports, {
  ShrubIcon: () => ShrubIcon
});
module.exports = __toCommonJS(shrub_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShrubIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShrubIcon", [["path", { "d": "M12 22v-5.172a2 2 0 0 0-.586-1.414L9.5 13.5" }], ["path", { "d": "M14.5 14.5 12 17" }], ["path", { "d": "M17 8.8A6 6 0 0 1 13.8 20H10A6.5 6.5 0 0 1 7 8a5 5 0 0 1 10 0z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShrubIcon
});
