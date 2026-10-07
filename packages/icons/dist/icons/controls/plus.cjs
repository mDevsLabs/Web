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
var plus_exports = {};
__export(plus_exports, {
  PlusIcon: () => PlusIcon
});
module.exports = __toCommonJS(plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const PlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PlusIcon", [["path", { "d": "M5 12h14" }], ["path", { "d": "M12 5v14" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PlusIcon
});
