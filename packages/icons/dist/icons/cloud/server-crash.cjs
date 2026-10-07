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
var server_crash_exports = {};
__export(server_crash_exports, {
  ServerCrashIcon: () => ServerCrashIcon
});
module.exports = __toCommonJS(server_crash_exports);
var import_create_icon = require("../../create-icon.cjs");
const ServerCrashIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ServerCrashIcon", [["path", { "d": "M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" }], ["path", { "d": "M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" }], ["path", { "d": "M6 6h.01" }], ["path", { "d": "M6 18h.01" }], ["path", { "d": "m13 6-4 6h6l-4 6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ServerCrashIcon
});
