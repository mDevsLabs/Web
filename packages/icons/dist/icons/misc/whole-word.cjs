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
var whole_word_exports = {};
__export(whole_word_exports, {
  WholeWordIcon: () => WholeWordIcon
});
module.exports = __toCommonJS(whole_word_exports);
var import_create_icon = require("../../create-icon.cjs");
const WholeWordIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WholeWordIcon", [["circle", { "cx": "7", "cy": "12", "r": "3" }], ["path", { "d": "M10 9v6" }], ["circle", { "cx": "17", "cy": "12", "r": "3" }], ["path", { "d": "M14 7v8" }], ["path", { "d": "M22 17v1c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WholeWordIcon
});
