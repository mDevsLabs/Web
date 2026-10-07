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
var projector_exports = {};
__export(projector_exports, {
  ProjectorIcon: () => ProjectorIcon
});
module.exports = __toCommonJS(projector_exports);
var import_create_icon = require("../../create-icon.cjs");
const ProjectorIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ProjectorIcon", [["path", { "d": "M5 7 3 5" }], ["path", { "d": "M9 6V3" }], ["path", { "d": "m13 7 2-2" }], ["circle", { "cx": "9", "cy": "13", "r": "3" }], ["path", { "d": "M11.83 12H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2.17" }], ["path", { "d": "M16 16h2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ProjectorIcon
});
