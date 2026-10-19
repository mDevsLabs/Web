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
var arrow_down_right_from_square_exports = {};
__export(arrow_down_right_from_square_exports, {
  ArrowDownRightFromSquareIcon: () => ArrowDownRightFromSquareIcon
});
module.exports = __toCommonJS(arrow_down_right_from_square_exports);
var import_create_icon = require("../../create-icon.js");
const ArrowDownRightFromSquareIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowDownRightFromSquareIcon", [["path", { "d": "M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" }], ["path", { "d": "m21 21-9-9" }], ["path", { "d": "M21 15v6h-6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowDownRightFromSquareIcon
});
