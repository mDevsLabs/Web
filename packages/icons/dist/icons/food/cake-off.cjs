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
var cake_off_exports = {};
__export(cake_off_exports, {
  CakeOffIcon: () => CakeOffIcon
});
module.exports = __toCommonJS(cake_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CakeOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CakeOffIcon", [["path", { "d": "M21 17v-5a3 3 0 0 0 -3 -3h-5m-4 0h-3a3 3 0 0 0 -3 3v8h17" }], ["path", { "d": "M3 14.803c.312 .135 .654 .204 1 .197a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1m4 0a2.4 2.4 0 0 0 2 1c.35 .007 .692 -.062 1 -.197" }], ["path", { "d": "M10.172 6.188c.07 -.158 .163 -.31 .278 -.451l1.55 -1.737l1.465 1.638a2 2 0 0 1 -.65 3.19" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CakeOffIcon
});
