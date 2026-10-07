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
var user_search_exports = {};
__export(user_search_exports, {
  UserSearchIcon: () => UserSearchIcon
});
module.exports = __toCommonJS(user_search_exports);
var import_create_icon = require("../../create-icon.cjs");
const UserSearchIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UserSearchIcon", [["circle", { "cx": "10", "cy": "7", "r": "4" }], ["path", { "d": "M10.3 15H7a4 4 0 0 0-4 4v2" }], ["circle", { "cx": "17", "cy": "17", "r": "3" }], ["path", { "d": "m21 21-1.9-1.9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserSearchIcon
});
