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
var type_exports = {};
__export(type_exports, {
  TypeIcon: () => TypeIcon
});
module.exports = __toCommonJS(type_exports);
var import_create_icon = require("../../create-icon.cjs");
const TypeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TypeIcon", [["path", { "d": "M12 4v16" }], ["path", { "d": "M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" }], ["path", { "d": "M9 20h6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TypeIcon
});
