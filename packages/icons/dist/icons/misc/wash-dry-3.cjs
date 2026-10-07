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
var wash_dry_3_exports = {};
__export(wash_dry_3_exports, {
  WashDry3Icon: () => WashDry3Icon
});
module.exports = __toCommonJS(wash_dry_3_exports);
var import_create_icon = require("../../create-icon.cjs");
const WashDry3Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WashDry3Icon", [["path", { "d": "M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" }], ["path", { "d": "M6 12a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" }], ["path", { "d": "M12 12h.01" }], ["path", { "d": "M9 12h.01" }], ["path", { "d": "M15 12h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WashDry3Icon
});
