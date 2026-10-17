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
var message_circle_question_exports = {};
__export(message_circle_question_exports, {
  MessageCircleQuestionIcon: () => MessageCircleQuestionIcon
});
module.exports = __toCommonJS(message_circle_question_exports);
var import_create_icon = require("../../create-icon.js");
const MessageCircleQuestionIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MessageCircleQuestionIcon", [
  ["path", { d: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" }],
  ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }],
  ["path", { d: "M12 17h.01" }]
]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MessageCircleQuestionIcon
});
