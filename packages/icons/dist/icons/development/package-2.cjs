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
var package_2_exports = {};
__export(package_2_exports, {
  Package2Icon: () => Package2Icon
});
module.exports = __toCommonJS(package_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Package2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Package2Icon", [["path", { "d": "M12 3v6" }], ["path", { "d": "M16.76 3a2 2 0 0 1 1.8 1.1l2.23 4.479a2 2 0 0 1 .21.891V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.472a2 2 0 0 1 .211-.894L5.45 4.1A2 2 0 0 1 7.24 3z" }], ["path", { "d": "M3.054 9.013h17.893" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Package2Icon
});
