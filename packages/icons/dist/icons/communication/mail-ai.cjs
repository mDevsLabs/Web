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
var mail_ai_exports = {};
__export(mail_ai_exports, {
  MailAiIcon: () => MailAiIcon
});
module.exports = __toCommonJS(mail_ai_exports);
var import_create_icon = require("../../create-icon.cjs");
const MailAiIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MailAiIcon", [["path", { "d": "M10 19h-5a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4" }], ["path", { "d": "M3 7l8 5.345m4 -1.345l6 -4" }], ["path", { "d": "M14 21v-4a2 2 0 1 1 4 0v4" }], ["path", { "d": "M14 19h4" }], ["path", { "d": "M21 15v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailAiIcon
});
