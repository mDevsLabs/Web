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
var user_lock_exports = {};
__export(user_lock_exports, {
  UserLockIcon: () => UserLockIcon
});
module.exports = __toCommonJS(user_lock_exports);
var import_create_icon = require("../../create-icon.cjs");
const UserLockIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UserLockIcon", [["path", { "d": "M19 16v-2a2 2 0 0 0-4 0v2" }], ["path", { "d": "M9.5 15H7a4 4 0 0 0-4 4v2" }], ["circle", { "cx": "10", "cy": "7", "r": "4" }], ["rect", { "x": "13", "y": "16", "width": "8", "height": "5", "rx": ".899" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserLockIcon
});
