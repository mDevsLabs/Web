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
var play_card_6_exports = {};
__export(play_card_6_exports, {
  PlayCard6Icon: () => PlayCard6Icon
});
module.exports = __toCommonJS(play_card_6_exports);
var import_create_icon = require("../../create-icon.cjs");
const PlayCard6Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PlayCard6Icon", [["path", { "d": "M19 5v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2" }], ["path", { "d": "M8 6h.01" }], ["path", { "d": "M16 18h.01" }], ["path", { "d": "M14 9h-3a1 1 0 0 0 -1 1v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-1a1 1 0 0 0 -1 -1h-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PlayCard6Icon
});
