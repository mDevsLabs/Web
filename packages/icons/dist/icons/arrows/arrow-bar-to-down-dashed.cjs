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
var arrow_bar_to_down_dashed_exports = {};
__export(arrow_bar_to_down_dashed_exports, {
  ArrowBarToDownDashedIcon: () => ArrowBarToDownDashedIcon
});
module.exports = __toCommonJS(arrow_bar_to_down_dashed_exports);
var import_create_icon = require("../../create-icon.cjs");
const ArrowBarToDownDashedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowBarToDownDashedIcon", [["path", { "d": "M12 14v-10" }], ["path", { "d": "M12 14l4 -4" }], ["path", { "d": "M12 14l-4 -4" }], ["path", { "d": "M4 20h3m13 0h-3m-3.5 0h-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowBarToDownDashedIcon
});
