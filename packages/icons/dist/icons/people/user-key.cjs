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
var user_key_exports = {};
__export(user_key_exports, {
  UserKeyIcon: () => UserKeyIcon
});
module.exports = __toCommonJS(user_key_exports);
var import_create_icon = require("../../create-icon.cjs");
const UserKeyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UserKeyIcon", [["path", { "d": "M20 11v6" }], ["path", { "d": "M20 13h2" }], ["path", { "d": "M3 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 2.072.578" }], ["circle", { "cx": "10", "cy": "7", "r": "4" }], ["circle", { "cx": "20", "cy": "19", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserKeyIcon
});
