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
var popsicle_exports = {};
__export(popsicle_exports, {
  PopsicleIcon: () => PopsicleIcon
});
module.exports = __toCommonJS(popsicle_exports);
var import_create_icon = require("../../create-icon.cjs");
const PopsicleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PopsicleIcon", [["path", { "d": "M18.6 14.4c.8-.8.8-2 0-2.8l-8.1-8.1a4.95 4.95 0 1 0-7.1 7.1l8.1 8.1c.9.7 2.1.7 2.9-.1Z" }], ["path", { "d": "m22 22-5.5-5.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PopsicleIcon
});
