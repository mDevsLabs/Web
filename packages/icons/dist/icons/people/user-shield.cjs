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
var user_shield_exports = {};
__export(user_shield_exports, {
  UserShieldIcon: () => UserShieldIcon
});
module.exports = __toCommonJS(user_shield_exports);
var import_create_icon = require("../../create-icon.cjs");
const UserShieldIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UserShieldIcon", [["path", { "d": "M10 15H6a4 4 0 0 0-4 4v2" }], ["path", { "d": "M22 17.5c0 2.499-1.75 3.749-3.83 4.474a.5.5 0 0 1-.335-.005c-2.085-.72-3.835-1.97-3.835-4.47V14a.5.5 0 0 1 .5-.499c1 0 2.25-.6 3.12-1.36a.6.6 0 0 1 .76-.001c.875.765 2.12 1.36 3.12 1.36a.5.5 0 0 1 .5.5z" }], ["circle", { "cx": "9", "cy": "7", "r": "4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserShieldIcon
});
