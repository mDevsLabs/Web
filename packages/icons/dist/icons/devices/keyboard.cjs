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
var keyboard_exports = {};
__export(keyboard_exports, {
  KeyboardIcon: () => KeyboardIcon
});
module.exports = __toCommonJS(keyboard_exports);
var import_create_icon = require("../../create-icon.cjs");
const KeyboardIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("KeyboardIcon", [["path", { "d": "M10 8h.01" }], ["path", { "d": "M12 12h.01" }], ["path", { "d": "M14 8h.01" }], ["path", { "d": "M16 12h.01" }], ["path", { "d": "M18 8h.01" }], ["path", { "d": "M6 8h.01" }], ["path", { "d": "M7 16h10" }], ["path", { "d": "M8 12h.01" }], ["rect", { "width": "20", "height": "16", "x": "2", "y": "4", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KeyboardIcon
});
