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
var circle_gauge_exports = {};
__export(circle_gauge_exports, {
  CircleGaugeIcon: () => CircleGaugeIcon
});
module.exports = __toCommonJS(circle_gauge_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleGaugeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleGaugeIcon", [["path", { "d": "M15.6 2.7a10 10 0 1 0 5.7 5.7" }], ["circle", { "cx": "12", "cy": "12", "r": "2" }], ["path", { "d": "M13.4 10.6 19 5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleGaugeIcon
});
