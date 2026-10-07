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
var heading_6_exports = {};
__export(heading_6_exports, {
  Heading6Icon: () => Heading6Icon
});
module.exports = __toCommonJS(heading_6_exports);
var import_create_icon = require("../../create-icon.cjs");
const Heading6Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Heading6Icon", [["path", { "d": "M4 12h8" }], ["path", { "d": "M4 18V6" }], ["path", { "d": "M12 18V6" }], ["circle", { "cx": "19", "cy": "16", "r": "2" }], ["path", { "d": "M20 10c-2 2-3 3.5-3 6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Heading6Icon
});
