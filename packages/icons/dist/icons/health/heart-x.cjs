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
var heart_x_exports = {};
__export(heart_x_exports, {
  HeartXIcon: () => HeartXIcon
});
module.exports = __toCommonJS(heart_x_exports);
var import_create_icon = require("../../create-icon.cjs");
const HeartXIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HeartXIcon", [["path", { "d": "m15.5 12.5 5 5" }], ["path", { "d": "m20.5 12.5-5 5" }], ["path", { "d": "M21.955 8.774a5.5 5.5 0 0 0-9.546-2.95.6.6 0 0 1-.818 0A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.508 5.332a2 2 0 0 0 2.57.352" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HeartXIcon
});
