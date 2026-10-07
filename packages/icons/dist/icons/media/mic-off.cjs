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
var mic_off_exports = {};
__export(mic_off_exports, {
  MicOffIcon: () => MicOffIcon
});
module.exports = __toCommonJS(mic_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const MicOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MicOffIcon", [["path", { "d": "M12 19v3" }], ["path", { "d": "M15 9.34V5a3 3 0 0 0-5.68-1.33" }], ["path", { "d": "M16.95 16.95A7 7 0 0 1 5 12v-2" }], ["path", { "d": "M18.89 13.23A7 7 0 0 0 19 12v-2" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M9 9v3a3 3 0 0 0 5.12 2.12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MicOffIcon
});
