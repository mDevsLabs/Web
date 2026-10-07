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
var mood_boy_exports = {};
__export(mood_boy_exports, {
  MoodBoyIcon: () => MoodBoyIcon
});
module.exports = __toCommonJS(mood_boy_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoodBoyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoodBoyIcon", [["path", { "d": "M17 4.5a9 9 0 0 1 3.864 5.89a2.5 2.5 0 0 1 -.29 4.36a9 9 0 0 1 -17.137 0a2.5 2.5 0 0 1 -.29 -4.36a9 9 0 0 1 3.746 -5.81" }], ["path", { "d": "M9.5 16a3.5 3.5 0 0 0 5 0" }], ["path", { "d": "M8.5 2c1.5 1 2.5 3.5 2.5 5" }], ["path", { "d": "M12.5 2c1.5 2 2 3.5 2 5" }], ["path", { "d": "M9 12l.01 0" }], ["path", { "d": "M15 12l.01 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoodBoyIcon
});
