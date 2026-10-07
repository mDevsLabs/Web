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
var cookie_exports = {};
__export(cookie_exports, {
  CookieIcon: () => CookieIcon
});
module.exports = __toCommonJS(cookie_exports);
var import_create_icon = require("../../create-icon.cjs");
const CookieIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CookieIcon", [["path", { "d": "M11 17h.01" }], ["path", { "d": "M11.496 2c.324-.016.558.292.529.615a4 4 0 004.235 4.368.713.713 0 01.758.757 4 4 0 004.366 4.237c.323-.03.63.204.614.527a10 10 0 01-2.915 6.566A1 1 0 114.93 4.918 10 10 0 0111.496 2" }], ["path", { "d": "M12 12h.01" }], ["path", { "d": "M16 16h.01" }], ["path", { "d": "M16 3h.01" }], ["path", { "d": "M21 4h.01" }], ["path", { "d": "M21 8h.01" }], ["path", { "d": "M7 14h.01" }], ["path", { "d": "M9 8h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CookieIcon
});
