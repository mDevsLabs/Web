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
var cloud_bolt_exports = {};
__export(cloud_bolt_exports, {
  CloudBoltIcon: () => CloudBoltIcon
});
module.exports = __toCommonJS(cloud_bolt_exports);
var import_create_icon = require("../../create-icon.cjs");
const CloudBoltIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CloudBoltIcon", [["path", { "d": "M13 18.004h-6.343c-2.572 -.004 -4.657 -2.011 -4.657 -4.487c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.396 0 2.6 .831 3.148 2.03" }], ["path", { "d": "M19 16l-2 3h4l-2 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudBoltIcon
});
