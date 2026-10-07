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
var hdmi_port_exports = {};
__export(hdmi_port_exports, {
  HdmiPortIcon: () => HdmiPortIcon
});
module.exports = __toCommonJS(hdmi_port_exports);
var import_create_icon = require("../../create-icon.cjs");
const HdmiPortIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HdmiPortIcon", [["path", { "d": "M22 9a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h.5a2 2 0 011.6.8l.3.4A2 2 0 007 16h10a2 2 0 001.6-.8l.3-.4a2 2 0 011.6-.8h.5a1 1 0 001-1z" }], ["path", { "d": "M8 12h8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HdmiPortIcon
});
