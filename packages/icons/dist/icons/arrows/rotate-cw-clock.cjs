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
var rotate_cw_clock_exports = {};
__export(rotate_cw_clock_exports, {
  RotateCwClockIcon: () => RotateCwClockIcon
});
module.exports = __toCommonJS(rotate_cw_clock_exports);
var import_create_icon = require("../../create-icon.cjs");
const RotateCwClockIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RotateCwClockIcon", [["path", { "d": "M12 7v5l4 2" }], ["path", { "d": "M16 8h5V3" }], ["path", { "d": "m21 8-2.3-2.3A9.7 9.7 0 0012 3a9 9 0 109 9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RotateCwClockIcon
});
