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
var radio_receiver_exports = {};
__export(radio_receiver_exports, {
  RadioReceiverIcon: () => RadioReceiverIcon
});
module.exports = __toCommonJS(radio_receiver_exports);
var import_create_icon = require("../../create-icon.cjs");
const RadioReceiverIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RadioReceiverIcon", [["path", { "d": "M5 16v2" }], ["path", { "d": "M19 16v2" }], ["rect", { "width": "20", "height": "8", "x": "2", "y": "8", "rx": "2" }], ["path", { "d": "M18 12h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RadioReceiverIcon
});
