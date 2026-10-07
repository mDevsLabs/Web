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
var toggle_right_exports = {};
__export(toggle_right_exports, {
  ToggleRightIcon: () => ToggleRightIcon
});
module.exports = __toCommonJS(toggle_right_exports);
var import_create_icon = require("../../create-icon.cjs");
const ToggleRightIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ToggleRightIcon", [["circle", { "cx": "15", "cy": "12", "r": "3" }], ["rect", { "width": "20", "height": "14", "x": "2", "y": "5", "rx": "7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToggleRightIcon
});
