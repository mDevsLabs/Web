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
var circle_stop_exports = {};
__export(circle_stop_exports, {
  CircleStopIcon: () => CircleStopIcon
});
module.exports = __toCommonJS(circle_stop_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleStopIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleStopIcon", [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["rect", { "x": "9", "y": "9", "width": "6", "height": "6", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleStopIcon
});
