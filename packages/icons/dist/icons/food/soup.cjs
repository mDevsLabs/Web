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
var soup_exports = {};
__export(soup_exports, {
  SoupIcon: () => SoupIcon
});
module.exports = __toCommonJS(soup_exports);
var import_create_icon = require("../../create-icon.cjs");
const SoupIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SoupIcon", [["path", { "d": "M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" }], ["path", { "d": "M7 21h10" }], ["path", { "d": "M19.5 12 22 6" }], ["path", { "d": "M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62" }], ["path", { "d": "M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62" }], ["path", { "d": "M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SoupIcon
});
