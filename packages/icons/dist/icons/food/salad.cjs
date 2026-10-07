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
var salad_exports = {};
__export(salad_exports, {
  SaladIcon: () => SaladIcon
});
module.exports = __toCommonJS(salad_exports);
var import_create_icon = require("../../create-icon.cjs");
const SaladIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SaladIcon", [["path", { "d": "M7 21h10" }], ["path", { "d": "M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" }], ["path", { "d": "M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1" }], ["path", { "d": "m13 12 4-4" }], ["path", { "d": "M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SaladIcon
});
