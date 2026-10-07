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
var brackets_contain_exports = {};
__export(brackets_contain_exports, {
  BracketsContainIcon: () => BracketsContainIcon
});
module.exports = __toCommonJS(brackets_contain_exports);
var import_create_icon = require("../../create-icon.cjs");
const BracketsContainIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BracketsContainIcon", [["path", { "d": "M7 4h-4v16h4" }], ["path", { "d": "M17 4h4v16h-4" }], ["path", { "d": "M8 16h.01" }], ["path", { "d": "M12 16h.01" }], ["path", { "d": "M16 16h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BracketsContainIcon
});
