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
var circle_help_exports = {};
__export(circle_help_exports, {
  CircleHelpIcon: () => CircleHelpIcon
});
module.exports = __toCommonJS(circle_help_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleHelpIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleHelpIcon", [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }], ["path", { "d": "M12 17h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleHelpIcon
});
