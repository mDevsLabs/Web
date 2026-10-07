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
var bolt_off_exports = {};
__export(bolt_off_exports, {
  BoltOffIcon: () => BoltOffIcon
});
module.exports = __toCommonJS(bolt_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BoltOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BoltOffIcon", [["path", { "d": "M3 3l18 18" }], ["path", { "d": "M15.212 15.21l-4.212 5.79v-7h-6l3.79 -5.21m1.685 -2.32l2.525 -3.47v6m1 1h5l-2.104 2.893" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BoltOffIcon
});
