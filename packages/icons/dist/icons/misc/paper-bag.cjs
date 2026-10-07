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
var paper_bag_exports = {};
__export(paper_bag_exports, {
  PaperBagIcon: () => PaperBagIcon
});
module.exports = __toCommonJS(paper_bag_exports);
var import_create_icon = require("../../create-icon.cjs");
const PaperBagIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PaperBagIcon", [["path", { "d": "M5.364 3.848C4 6 3 9.652 3 12.652V19a2 2 0 002 2h14a2 2 0 002-2v-5c0-2.334-1.816-4.668-2.622-7.002" }], ["path", { "d": "M7 3h11.379a2 2 0 011.789 1.106l.723 1.447A1 1 0 0119.997 7h-8.525a2 2 0 01-1.789-1.106L8.79 4.105a2 2 0 10-3.579 1.789l2.261 4.522A5 5 0 018 12.652V21" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PaperBagIcon
});
