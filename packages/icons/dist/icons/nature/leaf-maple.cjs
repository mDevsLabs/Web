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
var leaf_maple_exports = {};
__export(leaf_maple_exports, {
  LeafMapleIcon: () => LeafMapleIcon
});
module.exports = __toCommonJS(leaf_maple_exports);
var import_create_icon = require("../../create-icon.cjs");
const LeafMapleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LeafMapleIcon", [["path", { "d": "M5 21c.5 -4.5 2.5 -8 7 -10" }], ["path", { "d": "M13 19c-2.733 0 -4.16 -3.11 -5 -5c-1.892 -.84 -4 -1.826 -4 -4.556c1.014 -.644 2.816 -.649 4 -.444c-.312 -2.071 -.37 -4.414 1 -6c2.364 .369 3 4 3 4c1.463 -1.368 4 -2 6 -2c0 2 -.63 4.538 -2 6q 3.687 .996 4 3c-1.586 1.36 -3.933 1.311 -6 1q .19 1.098 -1 4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LeafMapleIcon
});
