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
var cloud_computing_exports = {};
__export(cloud_computing_exports, {
  CloudComputingIcon: () => CloudComputingIcon
});
module.exports = __toCommonJS(cloud_computing_exports);
var import_create_icon = require("../../create-icon.cjs");
const CloudComputingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CloudComputingIcon", [["path", { "d": "M6.657 16c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878" }], ["path", { "d": "M12 16v5" }], ["path", { "d": "M16 16v4a1 1 0 0 0 1 1h4" }], ["path", { "d": "M8 16v4a1 1 0 0 1 -1 1h-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudComputingIcon
});
