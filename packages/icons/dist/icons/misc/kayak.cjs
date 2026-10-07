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
var kayak_exports = {};
__export(kayak_exports, {
  KayakIcon: () => KayakIcon
});
module.exports = __toCommonJS(kayak_exports);
var import_create_icon = require("../../create-icon.cjs");
const KayakIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("KayakIcon", [["path", { "d": "M18 17a1 1 0 0 0-1 1v1a2 2 0 1 0 2-2z" }], ["path", { "d": "M20.97 3.61a.45.45 0 0 0-.58-.58C10.2 6.6 6.6 10.2 3.03 20.39a.45.45 0 0 0 .58.58C13.8 17.4 17.4 13.8 20.97 3.61" }], ["path", { "d": "m6.707 6.707 10.586 10.586" }], ["path", { "d": "M7 5a2 2 0 1 0-2 2h1a1 1 0 0 0 1-1z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KayakIcon
});
