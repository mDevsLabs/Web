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
var cloud_exclamation_exports = {};
__export(cloud_exclamation_exports, {
  CloudExclamationIcon: () => CloudExclamationIcon
});
module.exports = __toCommonJS(cloud_exclamation_exports);
var import_create_icon = require("../../create-icon.cjs");
const CloudExclamationIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CloudExclamationIcon", [["path", { "d": "M15 18.004h-8.343c-2.572 -.004 -4.657 -2.011 -4.657 -4.487c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.374 0 2.562 .805 3.121 1.972" }], ["path", { "d": "M19 16v3" }], ["path", { "d": "M19 22v.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudExclamationIcon
});
