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
var mood_dollar_exports = {};
__export(mood_dollar_exports, {
  MoodDollarIcon: () => MoodDollarIcon
});
module.exports = __toCommonJS(mood_dollar_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoodDollarIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoodDollarIcon", [["path", { "d": "M20.87 10.48a9 9 0 1 0 -7.876 10.465" }], ["path", { "d": "M9 10h.01" }], ["path", { "d": "M15 10h.01" }], ["path", { "d": "M9.5 15c.658 .64 1.56 1 2.5 1c.357 0 .709 -.052 1.043 -.151" }], ["path", { "d": "M21 15h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5" }], ["path", { "d": "M19 21v1m0 -8v1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoodDollarIcon
});
