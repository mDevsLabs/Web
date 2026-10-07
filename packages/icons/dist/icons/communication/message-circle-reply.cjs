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
var message_circle_reply_exports = {};
__export(message_circle_reply_exports, {
  MessageCircleReplyIcon: () => MessageCircleReplyIcon
});
module.exports = __toCommonJS(message_circle_reply_exports);
var import_create_icon = require("../../create-icon.cjs");
const MessageCircleReplyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MessageCircleReplyIcon", [["path", { "d": "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" }], ["path", { "d": "m10 15-3-3 3-3" }], ["path", { "d": "M7 12h8a2 2 0 0 1 2 2v1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MessageCircleReplyIcon
});
