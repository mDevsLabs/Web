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
var christmas_tree_exports = {};
__export(christmas_tree_exports, {
  ChristmasTreeIcon: () => ChristmasTreeIcon
});
module.exports = __toCommonJS(christmas_tree_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChristmasTreeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChristmasTreeIcon", [["path", { "d": "M12 3l4 4l-2 1l4 4l-3 1l4 4h-14l4 -4l-3 -1l4 -4l-2 -1l4 -4" }], ["path", { "d": "M14 17v3a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChristmasTreeIcon
});
