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
var biceps_flexed_exports = {};
__export(biceps_flexed_exports, {
  BicepsFlexedIcon: () => BicepsFlexedIcon
});
module.exports = __toCommonJS(biceps_flexed_exports);
var import_create_icon = require("../../create-icon.cjs");
const BicepsFlexedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BicepsFlexedIcon", [["path", { "d": "M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1" }], ["path", { "d": "M15 14a5 5 0 0 0-7.584 2" }], ["path", { "d": "M9.964 6.825C8.019 7.977 9.5 13 8 15" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BicepsFlexedIcon
});
