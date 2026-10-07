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
var clipboard_clock_exports = {};
__export(clipboard_clock_exports, {
  ClipboardClockIcon: () => ClipboardClockIcon
});
module.exports = __toCommonJS(clipboard_clock_exports);
var import_create_icon = require("../../create-icon.cjs");
const ClipboardClockIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ClipboardClockIcon", [["path", { "d": "M16 14v2.2l1.6 1" }], ["path", { "d": "M16 4h2a2 2 0 0 1 2 2v.832" }], ["path", { "d": "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" }], ["circle", { "cx": "16", "cy": "16", "r": "6" }], ["rect", { "x": "8", "y": "2", "width": "8", "height": "4", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClipboardClockIcon
});
