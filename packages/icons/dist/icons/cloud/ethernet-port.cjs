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
var ethernet_port_exports = {};
__export(ethernet_port_exports, {
  EthernetPortIcon: () => EthernetPortIcon
});
module.exports = __toCommonJS(ethernet_port_exports);
var import_create_icon = require("../../create-icon.cjs");
const EthernetPortIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EthernetPortIcon", [["path", { "d": "M10 8v1" }], ["path", { "d": "M14 8v1" }], ["path", { "d": "M18 8v1" }], ["path", { "d": "M19 17a2 2 0 00-1.765 1.059l-.47.882A2 2 0 0115 20H9a2 2 0 01-1.765-1.059l-.47-.882A2 2 0 005 17H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v9a2 2 0 01-2 2z" }], ["path", { "d": "M6 8v1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EthernetPortIcon
});
