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
var drama_exports = {};
__export(drama_exports, {
  DramaIcon: () => DramaIcon
});
module.exports = __toCommonJS(drama_exports);
var import_create_icon = require("../../create-icon.cjs");
const DramaIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DramaIcon", [["path", { "d": "M10 11h.01" }], ["path", { "d": "M14 6h.01" }], ["path", { "d": "M18 6h.01" }], ["path", { "d": "M6.5 13.1h.01" }], ["path", { "d": "M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3" }], ["path", { "d": "M17.4 9.9c-.8.8-2 .8-2.8 0" }], ["path", { "d": "M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7" }], ["path", { "d": "M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DramaIcon
});
