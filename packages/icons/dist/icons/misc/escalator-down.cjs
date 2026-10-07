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
var escalator_down_exports = {};
__export(escalator_down_exports, {
  EscalatorDownIcon: () => EscalatorDownIcon
});
module.exports = __toCommonJS(escalator_down_exports);
var import_create_icon = require("../../create-icon.cjs");
const EscalatorDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EscalatorDownIcon", [["path", { "d": "M4.5 7h2.733a2 2 0 0 1 1.337 .513l9.43 8.487h1.5a2.5 2.5 0 1 1 0 5h-2.733a2 2 0 0 1 -1.337 -.513l-9.43 -8.487h-1.5a2.5 2.5 0 1 1 0 -5" }], ["path", { "d": "M18 3v7" }], ["path", { "d": "M15 7l3 3l3 -3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EscalatorDownIcon
});
