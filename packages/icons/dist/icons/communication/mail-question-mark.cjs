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
var mail_question_mark_exports = {};
__export(mail_question_mark_exports, {
  MailQuestionMarkIcon: () => MailQuestionMarkIcon
});
module.exports = __toCommonJS(mail_question_mark_exports);
var import_create_icon = require("../../create-icon.cjs");
const MailQuestionMarkIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MailQuestionMarkIcon", [["path", { "d": "M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" }], ["path", { "d": "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }], ["path", { "d": "M18 15.28c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2" }], ["path", { "d": "M20 22v.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailQuestionMarkIcon
});
