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
var mood_cry_exports = {};
__export(mood_cry_exports, {
  MoodCryIcon: () => MoodCryIcon
});
module.exports = __toCommonJS(mood_cry_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoodCryIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoodCryIcon", [["path", { "d": "M9 10l.01 0" }], ["path", { "d": "M15 10l.01 0" }], ["path", { "d": "M9.5 15.25a3.5 3.5 0 0 1 5 0" }], ["path", { "d": "M17.566 17.606a2 2 0 1 0 2.897 .03l-1.463 -1.636l-1.434 1.606" }], ["path", { "d": "M20.865 13.517a8.937 8.937 0 0 0 .135 -1.517a9 9 0 1 0 -9 9c.69 0 1.36 -.076 2 -.222" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoodCryIcon
});
