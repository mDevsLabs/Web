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
var contact_2_exports = {};
__export(contact_2_exports, {
  Contact2Icon: () => Contact2Icon
});
module.exports = __toCommonJS(contact_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Contact2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Contact2Icon", [["path", { "d": "M16 2v2" }], ["path", { "d": "M17.915 21a6 6 0 10-12 0" }], ["path", { "d": "M8 2v2" }], ["circle", { "cx": "12", "cy": "11", "r": "4" }], ["rect", { "x": "3", "y": "3", "width": "18", "height": "18", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Contact2Icon
});
