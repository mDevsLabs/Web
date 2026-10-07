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
var wifi_sync_exports = {};
__export(wifi_sync_exports, {
  WifiSyncIcon: () => WifiSyncIcon
});
module.exports = __toCommonJS(wifi_sync_exports);
var import_create_icon = require("../../create-icon.cjs");
const WifiSyncIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WifiSyncIcon", [["path", { "d": "M11.965 10.105v4L13.5 12.5a5 5 0 0 1 8 1.5" }], ["path", { "d": "M11.965 14.105h4" }], ["path", { "d": "M17.965 18.105h4L20.43 19.71a5 5 0 0 1-8-1.5" }], ["path", { "d": "M2 8.82a15 15 0 0 1 20 0" }], ["path", { "d": "M21.965 22.105v-4" }], ["path", { "d": "M5 12.86a10 10 0 0 1 3-2.032" }], ["path", { "d": "M8.5 16.429h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WifiSyncIcon
});
