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
var bot_off_exports = {};
__export(bot_off_exports, {
  BotOffIcon: () => BotOffIcon
});
module.exports = __toCommonJS(bot_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BotOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BotOffIcon", [["path", { "d": "M13.67 8H18a2 2 0 0 1 2 2v4.33" }], ["path", { "d": "M2 14h2" }], ["path", { "d": "M20 14h2" }], ["path", { "d": "M22 22 2 2" }], ["path", { "d": "M8 8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 1.414-.586" }], ["path", { "d": "M9 13v2" }], ["path", { "d": "M9.67 4H12v2.33" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BotOffIcon
});
