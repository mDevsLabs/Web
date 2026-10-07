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
var ad_circle_off_exports = {};
__export(ad_circle_off_exports, {
  AdCircleOffIcon: () => AdCircleOffIcon
});
module.exports = __toCommonJS(ad_circle_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const AdCircleOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AdCircleOffIcon", [["path", { "d": "M4.91 4.949a9.968 9.968 0 0 0 -2.91 7.051c0 5.523 4.477 10 10 10a9.968 9.968 0 0 0 7.05 -2.909" }], ["path", { "d": "M20.778 16.793a9.955 9.955 0 0 0 1.222 -4.793c0 -5.523 -4.477 -10 -10 -10c-1.74 0 -3.376 .444 -4.8 1.225" }], ["path", { "d": "M7 15v-4.5a1.5 1.5 0 0 1 2.138 -1.358" }], ["path", { "d": "M9.854 9.853c.094 .196 .146 .415 .146 .647v4.5" }], ["path", { "d": "M7 13h3" }], ["path", { "d": "M14 14v1h1" }], ["path", { "d": "M17 13v-2a2 2 0 0 0 -2 -2h-1v1" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdCircleOffIcon
});
