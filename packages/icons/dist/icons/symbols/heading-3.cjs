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
var heading_3_exports = {};
__export(heading_3_exports, {
  Heading3Icon: () => Heading3Icon
});
module.exports = __toCommonJS(heading_3_exports);
var import_create_icon = require("../../create-icon.cjs");
const Heading3Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Heading3Icon", [["path", { "d": "M4 12h8" }], ["path", { "d": "M4 18V6" }], ["path", { "d": "M12 18V6" }], ["path", { "d": "M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" }], ["path", { "d": "M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Heading3Icon
});
