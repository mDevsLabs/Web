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
var repeat_off_exports = {};
__export(repeat_off_exports, {
  RepeatOffIcon: () => RepeatOffIcon
});
module.exports = __toCommonJS(repeat_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const RepeatOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RepeatOffIcon", [["path", { "d": "M11.656 6H21l-4-4" }], ["path", { "d": "M17.898 17.898A4 4 0 0 1 17 18H3l4-4" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M21 13v1a4 4 0 0 1-.171 1.159" }], ["path", { "d": "m21 6-4 4" }], ["path", { "d": "M3 11v-1a4 4 0 0 1 3.102-3.898" }], ["path", { "d": "m7 22-4-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RepeatOffIcon
});
