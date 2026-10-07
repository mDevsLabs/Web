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
var recycle_exports = {};
__export(recycle_exports, {
  RecycleIcon: () => RecycleIcon
});
module.exports = __toCommonJS(recycle_exports);
var import_create_icon = require("../../create-icon.cjs");
const RecycleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RecycleIcon", [["path", { "d": "M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" }], ["path", { "d": "M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" }], ["path", { "d": "m14 16-3 3 3 3" }], ["path", { "d": "M8.293 13.596 7.196 9.5 3.1 10.598" }], ["path", { "d": "m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" }], ["path", { "d": "m13.378 9.633 4.096 1.098 1.097-4.096" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RecycleIcon
});
