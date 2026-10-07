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
var computer_exports = {};
__export(computer_exports, {
  ComputerIcon: () => ComputerIcon
});
module.exports = __toCommonJS(computer_exports);
var import_create_icon = require("../../create-icon.cjs");
const ComputerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ComputerIcon", [["path", { "d": "M12 18h6" }], ["path", { "d": "M6 18h.01" }], ["path", { "d": "M8 6h1" }], ["rect", { "x": "2", "y": "14", "width": "20", "height": "8", "rx": "2" }], ["rect", { "x": "4", "y": "2", "width": "16", "height": "12", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ComputerIcon
});
