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
var link_2_exports = {};
__export(link_2_exports, {
  Link2Icon: () => Link2Icon
});
module.exports = __toCommonJS(link_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Link2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Link2Icon", [["path", { "d": "M9 17H7A5 5 0 0 1 7 7h2" }], ["path", { "d": "M15 7h2a5 5 0 1 1 0 10h-2" }], ["line", { "x1": "8", "x2": "16", "y1": "12", "y2": "12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Link2Icon
});
