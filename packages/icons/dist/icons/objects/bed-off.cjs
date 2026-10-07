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
var bed_off_exports = {};
__export(bed_off_exports, {
  BedOffIcon: () => BedOffIcon
});
module.exports = __toCommonJS(bed_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BedOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BedOffIcon", [["path", { "d": "M7 7a2 2 0 1 0 2 2" }], ["path", { "d": "M22 17v-3h-4m-4 0h-12" }], ["path", { "d": "M2 8v9" }], ["path", { "d": "M12 12v2h2m4 0h4v-2a3 3 0 0 0 -3 -3h-6" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BedOffIcon
});
