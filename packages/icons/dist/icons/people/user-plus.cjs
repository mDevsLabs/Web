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
var user_plus_exports = {};
__export(user_plus_exports, {
  UserPlusIcon: () => UserPlusIcon
});
module.exports = __toCommonJS(user_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const UserPlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UserPlusIcon", [["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { "cx": "9", "cy": "7", "r": "4" }], ["line", { "x1": "19", "x2": "19", "y1": "8", "y2": "14" }], ["line", { "x1": "22", "x2": "16", "y1": "11", "y2": "11" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserPlusIcon
});
