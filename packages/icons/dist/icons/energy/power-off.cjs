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
var power_off_exports = {};
__export(power_off_exports, {
  PowerOffIcon: () => PowerOffIcon
});
module.exports = __toCommonJS(power_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const PowerOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PowerOffIcon", [["path", { "d": "M18.36 6.64A9 9 0 0 1 20.77 15" }], ["path", { "d": "M6.16 6.16a9 9 0 1 0 12.68 12.68" }], ["path", { "d": "M12 2v4" }], ["path", { "d": "m2 2 20 20" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PowerOffIcon
});
