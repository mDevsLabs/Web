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
var escalator_up_exports = {};
__export(escalator_up_exports, {
  EscalatorUpIcon: () => EscalatorUpIcon
});
module.exports = __toCommonJS(escalator_up_exports);
var import_create_icon = require("../../create-icon.cjs");
const EscalatorUpIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EscalatorUpIcon", [["path", { "d": "M19.5 7h-2.672a2 2 0 0 0 -1.414 .586l-8.414 8.414h-2.5a2.5 2.5 0 1 0 0 5h3.672a2 2 0 0 0 1.414 -.586l8.414 -8.414h1.5a2.5 2.5 0 1 0 0 -5" }], ["path", { "d": "M6 10v-7" }], ["path", { "d": "M3 6l3 -3l3 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EscalatorUpIcon
});
