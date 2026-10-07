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
var users_2_exports = {};
__export(users_2_exports, {
  Users2Icon: () => Users2Icon
});
module.exports = __toCommonJS(users_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Users2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Users2Icon", [["path", { "d": "M18 21a8 8 0 0 0-16 0" }], ["circle", { "cx": "10", "cy": "8", "r": "5" }], ["path", { "d": "M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Users2Icon
});
