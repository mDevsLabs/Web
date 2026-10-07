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
var message_square_dashed_exports = {};
__export(message_square_dashed_exports, {
  MessageSquareDashedIcon: () => MessageSquareDashedIcon
});
module.exports = __toCommonJS(message_square_dashed_exports);
var import_create_icon = require("../../create-icon.cjs");
const MessageSquareDashedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MessageSquareDashedIcon", [["path", { "d": "M14 3h2" }], ["path", { "d": "M16 19h-2" }], ["path", { "d": "M2 12v-2" }], ["path", { "d": "M2 16v5.286a.71.71 0 0 0 1.212.502l1.149-1.149" }], ["path", { "d": "M20 19a2 2 0 0 0 2-2v-1" }], ["path", { "d": "M22 10v2" }], ["path", { "d": "M22 6V5a2 2 0 0 0-2-2" }], ["path", { "d": "M4 3a2 2 0 0 0-2 2v1" }], ["path", { "d": "M8 19h2" }], ["path", { "d": "M8 3h2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MessageSquareDashedIcon
});
