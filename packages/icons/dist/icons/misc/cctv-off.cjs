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
var cctv_off_exports = {};
__export(cctv_off_exports, {
  CctvOffIcon: () => CctvOffIcon
});
module.exports = __toCommonJS(cctv_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CctvOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CctvOffIcon", [["path", { "d": "m12.309 6.652 4.797 2.401a1 1 0 0 1 .447 1.341l-.501 1.001.605.605h2.725a1 1 0 0 1 .894 1.447l-.724 1.448" }], ["path", { "d": "m15.166 15.166-.719 1.439a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.9 2.9 0 0 1 .873-1.037" }], ["path", { "d": "M2 19h3.76a2 2 0 0 0 1.8-1.1l1.441-2.902" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M2 21v-4" }], ["path", { "d": "M7 9h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CctvOffIcon
});
