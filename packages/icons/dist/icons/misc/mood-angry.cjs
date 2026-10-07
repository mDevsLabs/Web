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
var mood_angry_exports = {};
__export(mood_angry_exports, {
  MoodAngryIcon: () => MoodAngryIcon
});
module.exports = __toCommonJS(mood_angry_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoodAngryIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoodAngryIcon", [["path", { "d": "M12 21a9 9 0 1 1 0 -18a9 9 0 0 1 0 18" }], ["path", { "d": "M8 9l2 1" }], ["path", { "d": "M16 9l-2 1" }], ["path", { "d": "M14.5 16.05a3.5 3.5 0 0 0 -5 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoodAngryIcon
});
