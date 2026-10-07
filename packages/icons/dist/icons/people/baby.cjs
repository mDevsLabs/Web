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
var baby_exports = {};
__export(baby_exports, {
  BabyIcon: () => BabyIcon
});
module.exports = __toCommonJS(baby_exports);
var import_create_icon = require("../../create-icon.cjs");
const BabyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BabyIcon", [["path", { "d": "M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" }], ["path", { "d": "M15 12h.01" }], ["path", { "d": "M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" }], ["path", { "d": "M9 12h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BabyIcon
});
