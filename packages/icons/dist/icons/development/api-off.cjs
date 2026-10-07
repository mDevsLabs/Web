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
var api_off_exports = {};
__export(api_off_exports, {
  ApiOffIcon: () => ApiOffIcon
});
module.exports = __toCommonJS(api_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const ApiOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ApiOffIcon", [["path", { "d": "M4 13h5" }], ["path", { "d": "M12 16v-4m0 -4h3a2 2 0 0 1 2 2v1c0 .554 -.225 1.055 -.589 1.417m-3.411 .583h-1" }], ["path", { "d": "M20 8v8" }], ["path", { "d": "M9 16v-5.5a2.5 2.5 0 0 0 -5 0v5.5" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiOffIcon
});
