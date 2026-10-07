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
var egg_fried_exports = {};
__export(egg_fried_exports, {
  EggFriedIcon: () => EggFriedIcon
});
module.exports = __toCommonJS(egg_fried_exports);
var import_create_icon = require("../../create-icon.cjs");
const EggFriedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EggFriedIcon", [["circle", { "cx": "11.5", "cy": "12.5", "r": "3.5" }], ["path", { "d": "M3 8c0-3.5 2.5-6 6.5-6 5 0 4.83 3 7.5 5s5 2 5 6c0 4.5-2.5 6.5-7 6.5-2.5 0-2.5 2.5-6 2.5s-7-2-7-5.5c0-3 1.5-3 1.5-5C3.5 10 3 9 3 8Z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EggFriedIcon
});
