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
var baguette_exports = {};
__export(baguette_exports, {
  BaguetteIcon: () => BaguetteIcon
});
module.exports = __toCommonJS(baguette_exports);
var import_create_icon = require("../../create-icon.cjs");
const BaguetteIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BaguetteIcon", [["path", { "d": "M5.628 11.283l5.644 -5.637c2.665 -2.663 5.924 -3.747 8.663 -1.205l.188 .181a2.987 2.987 0 0 1 0 4.228l-11.287 11.274a3 3 0 0 1 -4.089 .135l-.143 -.135c-2.728 -2.724 -1.704 -6.117 1.024 -8.841" }], ["path", { "d": "M9.5 7.5l1.5 3.5" }], ["path", { "d": "M6.5 10.5l1.5 3.5" }], ["path", { "d": "M12.5 4.5l1.5 3.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaguetteIcon
});
