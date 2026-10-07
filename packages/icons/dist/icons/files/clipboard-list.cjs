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
var clipboard_list_exports = {};
__export(clipboard_list_exports, {
  ClipboardListIcon: () => ClipboardListIcon
});
module.exports = __toCommonJS(clipboard_list_exports);
var import_create_icon = require("../../create-icon.cjs");
const ClipboardListIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ClipboardListIcon", [["rect", { "width": "8", "height": "4", "x": "8", "y": "2", "rx": "1", "ry": "1" }], ["path", { "d": "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }], ["path", { "d": "M12 11h4" }], ["path", { "d": "M12 16h4" }], ["path", { "d": "M8 11h.01" }], ["path", { "d": "M8 16h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClipboardListIcon
});
