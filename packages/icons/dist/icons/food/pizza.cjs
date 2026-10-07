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
var pizza_exports = {};
__export(pizza_exports, {
  PizzaIcon: () => PizzaIcon
});
module.exports = __toCommonJS(pizza_exports);
var import_create_icon = require("../../create-icon.cjs");
const PizzaIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PizzaIcon", [["path", { "d": "m12 14-1 1" }], ["path", { "d": "m13.75 18.25-1.25 1.42" }], ["path", { "d": "M17.775 5.654a15.68 15.68 0 0 0-12.121 12.12" }], ["path", { "d": "M18.8 9.3a1 1 0 0 0 2.1 7.7" }], ["path", { "d": "M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PizzaIcon
});
