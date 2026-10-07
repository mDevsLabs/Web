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
var lightbulb_off_exports = {};
__export(lightbulb_off_exports, {
  LightbulbOffIcon: () => LightbulbOffIcon
});
module.exports = __toCommonJS(lightbulb_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const LightbulbOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LightbulbOffIcon", [["path", { "d": "M16.8 11.2c.8-.9 1.2-2 1.2-3.2a6 6 0 0 0-9.3-5" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M6.3 6.3a4.67 4.67 0 0 0 1.2 5.2c.7.7 1.3 1.5 1.5 2.5" }], ["path", { "d": "M9 18h6" }], ["path", { "d": "M10 22h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LightbulbOffIcon
});
