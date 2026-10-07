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
var aerial_lift_exports = {};
__export(aerial_lift_exports, {
  AerialLiftIcon: () => AerialLiftIcon
});
module.exports = __toCommonJS(aerial_lift_exports);
var import_create_icon = require("../../create-icon.cjs");
const AerialLiftIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AerialLiftIcon", [["path", { "d": "M4 5l16 -2" }], ["path", { "d": "M12 4v10" }], ["path", { "d": "M6.894 8h10.306c2.45 3 2.45 9 -.2 12h-10.106c-2.544 -3 -2.544 -9 0 -12" }], ["path", { "d": "M5 14h14" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AerialLiftIcon
});
