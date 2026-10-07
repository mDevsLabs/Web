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
var ghost_2_exports = {};
__export(ghost_2_exports, {
  Ghost2Icon: () => Ghost2Icon
});
module.exports = __toCommonJS(ghost_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Ghost2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Ghost2Icon", [["path", { "d": "M10 9h.01" }], ["path", { "d": "M14 9h.01" }], ["path", { "d": "M12 3a7 7 0 0 1 7 7v1l1 0a2 2 0 1 1 0 4l-1 0v3l2 3h-10a6 6 0 0 1 -6 -5.775l0 -.226l-1 0a2 2 0 0 1 0 -4l1 0v-1a7 7 0 0 1 7 -7l0 .001" }], ["path", { "d": "M11 14h2a1 1 0 0 0 -2 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Ghost2Icon
});
