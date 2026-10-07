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
var ironing_steam_off_exports = {};
__export(ironing_steam_off_exports, {
  IroningSteamOffIcon: () => IroningSteamOffIcon
});
module.exports = __toCommonJS(ironing_steam_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const IroningSteamOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("IroningSteamOffIcon", [["path", { "d": "M9 4h7.459a3 3 0 0 1 2.959 2.507l.577 3.464l.81 4.865a1 1 0 0 1 -.821 1.15" }], ["path", { "d": "M16 16h-13a7 7 0 0 1 6.056 -6.937" }], ["path", { "d": "M13 9h6.8" }], ["path", { "d": "M12 19v2" }], ["path", { "d": "M8 19l-1 2" }], ["path", { "d": "M16 19l1 2" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IroningSteamOffIcon
});
