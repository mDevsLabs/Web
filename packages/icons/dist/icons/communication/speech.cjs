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
var speech_exports = {};
__export(speech_exports, {
  SpeechIcon: () => SpeechIcon
});
module.exports = __toCommonJS(speech_exports);
var import_create_icon = require("../../create-icon.cjs");
const SpeechIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SpeechIcon", [["path", { "d": "M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.054 1 4.55a5.77 5.77 0 0 1 .029 2.758L2 20" }], ["path", { "d": "M19.8 17.8a7.5 7.5 0 0 0 .003-10.603" }], ["path", { "d": "M17 15a3.5 3.5 0 0 0-.025-4.975" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SpeechIcon
});
