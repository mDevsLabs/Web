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
var circle_dashed_plus_exports = {};
__export(circle_dashed_plus_exports, {
  CircleDashedPlusIcon: () => CircleDashedPlusIcon
});
module.exports = __toCommonJS(circle_dashed_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleDashedPlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleDashedPlusIcon", [["path", { "d": "M8.56 3.69a9 9 0 0 0 -2.92 1.95" }], ["path", { "d": "M3.69 8.56a9 9 0 0 0 -.69 3.44" }], ["path", { "d": "M3.69 15.44a9 9 0 0 0 1.95 2.92" }], ["path", { "d": "M8.56 20.31a9 9 0 0 0 3.44 .69" }], ["path", { "d": "M15.44 20.31a9 9 0 0 0 2.92 -1.95" }], ["path", { "d": "M20.31 15.44a9 9 0 0 0 .69 -3.44" }], ["path", { "d": "M20.31 8.56a9 9 0 0 0 -1.95 -2.92" }], ["path", { "d": "M15.44 3.69a9 9 0 0 0 -3.44 -.69" }], ["path", { "d": "M9 12h6" }], ["path", { "d": "M12 9v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleDashedPlusIcon
});
