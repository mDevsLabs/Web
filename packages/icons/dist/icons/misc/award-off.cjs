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
var award_off_exports = {};
__export(award_off_exports, {
  AwardOffIcon: () => AwardOffIcon
});
module.exports = __toCommonJS(award_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const AwardOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AwardOffIcon", [["path", { "d": "M16.72 12.704a6 6 0 0 0 -8.433 -8.418m-1.755 2.24a6 6 0 0 0 7.936 7.944" }], ["path", { "d": "M12 15l3.4 5.89l1.598 -3.233l.707 .046m1.108 -2.902l-1.617 -2.8" }], ["path", { "d": "M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AwardOffIcon
});
