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
var card_sim_exports = {};
__export(card_sim_exports, {
  CardSimIcon: () => CardSimIcon
});
module.exports = __toCommonJS(card_sim_exports);
var import_create_icon = require("../../create-icon.cjs");
const CardSimIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CardSimIcon", [["path", { "d": "M12 14v4" }], ["path", { "d": "M14.172 2a2 2 0 0 1 1.414.586l3.828 3.828A2 2 0 0 1 20 7.828V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" }], ["path", { "d": "M8 14h8" }], ["rect", { "x": "8", "y": "10", "width": "8", "height": "8", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CardSimIcon
});
