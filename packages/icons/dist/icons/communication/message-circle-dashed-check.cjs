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
var message_circle_dashed_check_exports = {};
__export(message_circle_dashed_check_exports, {
  MessageCircleDashedCheckIcon: () => MessageCircleDashedCheckIcon
});
module.exports = __toCommonJS(message_circle_dashed_check_exports);
var import_create_icon = require("../../create-icon.cjs");
const MessageCircleDashedCheckIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MessageCircleDashedCheckIcon", [["path", { "d": "M10.1 2.182a10 10 0 013.8 0" }], ["path", { "d": "M13.9 21.818a10 10 0 01-3.8 0" }], ["path", { "d": "M17.609 3.72a10 10 0 012.69 2.7" }], ["path", { "d": "M2.182 13.9a10 10 0 010-3.8" }], ["path", { "d": "M20.28 17.61a10 10 0 01-2.7 2.69" }], ["path", { "d": "M21.818 10.1a10 10 0 010 3.8" }], ["path", { "d": "M3.721 6.391a10 10 0 012.7-2.69" }], ["path", { "d": "m6.163 21.117-2.906.85a1 1 0 01-1.236-1.169l.965-2.98" }], ["path", { "d": "m16 9-5.5 5.5L8 12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MessageCircleDashedCheckIcon
});
