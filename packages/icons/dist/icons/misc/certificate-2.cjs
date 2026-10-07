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
var certificate_2_exports = {};
__export(certificate_2_exports, {
  Certificate2Icon: () => Certificate2Icon
});
module.exports = __toCommonJS(certificate_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Certificate2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Certificate2Icon", [["path", { "d": "M9 15a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }], ["path", { "d": "M10 7h4" }], ["path", { "d": "M10 18v4l2 -1l2 1v-4" }], ["path", { "d": "M10 19h-2a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Certificate2Icon
});
