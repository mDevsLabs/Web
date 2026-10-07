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
var lightbulb_exports = {};
__export(lightbulb_exports, {
  LightbulbIcon: () => LightbulbIcon
});
module.exports = __toCommonJS(lightbulb_exports);
var import_create_icon = require("../../create-icon.cjs");
const LightbulbIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LightbulbIcon", [["path", { "d": "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" }], ["path", { "d": "M9 18h6" }], ["path", { "d": "M10 22h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LightbulbIcon
});
