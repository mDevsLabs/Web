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
var butterfly_exports = {};
__export(butterfly_exports, {
  ButterflyIcon: () => ButterflyIcon
});
module.exports = __toCommonJS(butterfly_exports);
var import_create_icon = require("../../create-icon.cjs");
const ButterflyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ButterflyIcon", [["path", { "d": "M12 18.176a3 3 0 1 1 -4.953 -2.449l-.025 .023a4.502 4.502 0 0 1 1.483 -8.75c1.414 0 2.675 .652 3.5 1.671a4.5 4.5 0 1 1 4.983 7.079a3 3 0 1 1 -4.983 2.25l-.005 .176" }], ["path", { "d": "M12 19v-10" }], ["path", { "d": "M9 3l3 2l3 -2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ButterflyIcon
});
