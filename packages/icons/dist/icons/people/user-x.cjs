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
var user_x_exports = {};
__export(user_x_exports, {
  UserXIcon: () => UserXIcon
});
module.exports = __toCommonJS(user_x_exports);
var import_create_icon = require("../../create-icon.cjs");
const UserXIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UserXIcon", [["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { "cx": "9", "cy": "7", "r": "4" }], ["line", { "x1": "17", "x2": "22", "y1": "8", "y2": "13" }], ["line", { "x1": "22", "x2": "17", "y1": "8", "y2": "13" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserXIcon
});
