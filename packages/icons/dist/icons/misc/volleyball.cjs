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
var volleyball_exports = {};
__export(volleyball_exports, {
  VolleyballIcon: () => VolleyballIcon
});
module.exports = __toCommonJS(volleyball_exports);
var import_create_icon = require("../../create-icon.cjs");
const VolleyballIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("VolleyballIcon", [["path", { "d": "M11 7a16 16 20 0 1 10.98 4.362" }], ["path", { "d": "M12 12a13 13 0 0 1-8.66 5" }], ["path", { "d": "M16.83 13.634a16 16 0 0 1-9.267 7.328" }], ["path", { "d": "M20.66 17A13 13 0 0 0 12 12a13 13 0 0 1 0-10" }], ["path", { "d": "M8.17 15.366a16 16 0 0 1-1.713-11.69" }], ["circle", { "cx": "12", "cy": "12", "r": "10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VolleyballIcon
});
