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
var megaphone_off_exports = {};
__export(megaphone_off_exports, {
  MegaphoneOffIcon: () => MegaphoneOffIcon
});
module.exports = __toCommonJS(megaphone_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const MegaphoneOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MegaphoneOffIcon", [["path", { "d": "M11.636 6A13 13 0 0 0 19.4 3.2 1 1 0 0 1 21 4v11.344" }], ["path", { "d": "M14.378 14.357A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" }], ["path", { "d": "M8 8v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MegaphoneOffIcon
});
