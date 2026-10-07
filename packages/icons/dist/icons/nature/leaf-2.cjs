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
var leaf_2_exports = {};
__export(leaf_2_exports, {
  Leaf2Icon: () => Leaf2Icon
});
module.exports = __toCommonJS(leaf_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Leaf2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Leaf2Icon", [["path", { "d": "M5 21c.5 -4.5 2.5 -8 7 -10" }], ["path", { "d": "M7.5 15q -3.5 0 -4.5 -6a8.4 8.4 0 0 1 3.438 .402a12 12 0 0 1 -.052 -.793c0 -3.606 3.204 -5.609 3.204 -5.609s2.003 1.252 2.842 3.557q 2.568 -1.557 6.568 -1.557q .396 3.775 -1.557 6.568c2.305 .839 3.557 2.842 3.557 2.842s-3 2.59 -7 2.59c0 1 0 1 .5 3q -6 0 -7 -5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Leaf2Icon
});
