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
var siren_exports = {};
__export(siren_exports, {
  SirenIcon: () => SirenIcon
});
module.exports = __toCommonJS(siren_exports);
var import_create_icon = require("../../create-icon.cjs");
const SirenIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SirenIcon", [["path", { "d": "M7 18v-6a5 5 0 1 1 10 0v6" }], ["path", { "d": "M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" }], ["path", { "d": "M21 12h1" }], ["path", { "d": "M18.5 4.5 18 5" }], ["path", { "d": "M2 12h1" }], ["path", { "d": "M12 2v1" }], ["path", { "d": "m4.929 4.929.707.707" }], ["path", { "d": "M12 12v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SirenIcon
});
