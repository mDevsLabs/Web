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
var squircle_dashed_exports = {};
__export(squircle_dashed_exports, {
  SquircleDashedIcon: () => SquircleDashedIcon
});
module.exports = __toCommonJS(squircle_dashed_exports);
var import_create_icon = require("../../create-icon.cjs");
const SquircleDashedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SquircleDashedIcon", [["path", { "d": "M13.77 3.043a34 34 0 0 0-3.54 0" }], ["path", { "d": "M13.771 20.956a33 33 0 0 1-3.541.001" }], ["path", { "d": "M20.18 17.74c-.51 1.15-1.29 1.93-2.439 2.44" }], ["path", { "d": "M20.18 6.259c-.51-1.148-1.291-1.929-2.44-2.438" }], ["path", { "d": "M20.957 10.23a33 33 0 0 1 0 3.54" }], ["path", { "d": "M3.043 10.23a34 34 0 0 0 .001 3.541" }], ["path", { "d": "M6.26 20.179c-1.15-.508-1.93-1.29-2.44-2.438" }], ["path", { "d": "M6.26 3.82c-1.149.51-1.93 1.291-2.44 2.44" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SquircleDashedIcon
});
