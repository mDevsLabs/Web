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
var chrome_exports = {};
__export(chrome_exports, {
  ChromeIcon: () => ChromeIcon
});
module.exports = __toCommonJS(chrome_exports);
var import_create_icon = require("../../create-icon.js");
const ChromeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChromeIcon", [
  ["circle", { cx: "12", cy: "12", r: "10" }],
  ["circle", { cx: "12", cy: "12", r: "4" }],
  ["line", { x1: "21.17", x2: "12", y1: "8", y2: "8" }],
  ["line", { x1: "3.95", x2: "8.54", y1: "6.06", y2: "14" }],
  ["line", { x1: "10.88", x2: "15.46", y1: "21.94", y2: "14" }]
]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChromeIcon
});
