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
var burger_exports = {};
__export(burger_exports, {
  BurgerIcon: () => BurgerIcon
});
module.exports = __toCommonJS(burger_exports);
var import_create_icon = require("../../create-icon.cjs");
const BurgerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BurgerIcon", [["path", { "d": "M4 15h16a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4" }], ["path", { "d": "M12 4c3.783 0 6.953 2.133 7.786 5h-15.572c.833 -2.867 4.003 -5 7.786 -5" }], ["path", { "d": "M5 12h14" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BurgerIcon
});
