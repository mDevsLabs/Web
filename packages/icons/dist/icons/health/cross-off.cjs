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
var cross_off_exports = {};
__export(cross_off_exports, {
  CrossOffIcon: () => CrossOffIcon
});
module.exports = __toCommonJS(cross_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CrossOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CrossOffIcon", [["path", { "d": "M16 12h3v-4h-5v-5h-4v3m-2 2h-3v4h5v9h4v-7" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CrossOffIcon
});
