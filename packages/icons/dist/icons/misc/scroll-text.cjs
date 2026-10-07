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
var scroll_text_exports = {};
__export(scroll_text_exports, {
  ScrollTextIcon: () => ScrollTextIcon
});
module.exports = __toCommonJS(scroll_text_exports);
var import_create_icon = require("../../create-icon.cjs");
const ScrollTextIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ScrollTextIcon", [["path", { "d": "M15 12h-5" }], ["path", { "d": "M15 8h-5" }], ["path", { "d": "M19 17V5a2 2 0 0 0-2-2H4" }], ["path", { "d": "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScrollTextIcon
});
