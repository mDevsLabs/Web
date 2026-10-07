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
var ham_exports = {};
__export(ham_exports, {
  HamIcon: () => HamIcon
});
module.exports = __toCommonJS(ham_exports);
var import_create_icon = require("../../create-icon.cjs");
const HamIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HamIcon", [["path", { "d": "M13.144 21.144A7.274 10.445 45 1 0 2.856 10.856" }], ["path", { "d": "M13.144 21.144A7.274 4.365 45 0 0 2.856 10.856a7.274 4.365 45 0 0 10.288 10.288" }], ["path", { "d": "M16.565 10.435 18.6 8.4a2.501 2.501 0 1 0 1.65-4.65 2.5 2.5 0 1 0-4.66 1.66l-2.024 2.025" }], ["path", { "d": "m8.5 16.5-1-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HamIcon
});
