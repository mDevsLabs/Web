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
var sofa_exports = {};
__export(sofa_exports, {
  SofaIcon: () => SofaIcon
});
module.exports = __toCommonJS(sofa_exports);
var import_create_icon = require("../../create-icon.cjs");
const SofaIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SofaIcon", [["path", { "d": "M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" }], ["path", { "d": "M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z" }], ["path", { "d": "M4 18v2" }], ["path", { "d": "M20 18v2" }], ["path", { "d": "M12 4v9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SofaIcon
});
