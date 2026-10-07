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
var mood_annoyed_exports = {};
__export(mood_annoyed_exports, {
  MoodAnnoyedIcon: () => MoodAnnoyedIcon
});
module.exports = __toCommonJS(mood_annoyed_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoodAnnoyedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoodAnnoyedIcon", [["path", { "d": "M12 21a9 9 0 1 1 0 -18a9 9 0 0 1 0 18" }], ["path", { "d": "M15 14c-2 0 -3 1 -3.5 2.05" }], ["path", { "d": "M9 10h-.01" }], ["path", { "d": "M15 10h-.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoodAnnoyedIcon
});
