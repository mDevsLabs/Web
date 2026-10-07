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
var mail_pen_exports = {};
__export(mail_pen_exports, {
  MailPenIcon: () => MailPenIcon
});
module.exports = __toCommonJS(mail_pen_exports);
var import_create_icon = require("../../create-icon.cjs");
const MailPenIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MailPenIcon", [["path", { "d": "M15.363 17.634a2 2 0 00-.506.854l-.837 2.87a.5.5 0 00.62.62l2.87-.837a2 2 0 00.854-.506l3.013-3.009a1 1 0 10-3.004-3.004z" }], ["path", { "d": "M22 10.38V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h6.25" }], ["path", { "d": "m22 7-8.991 5.727a2 2 0 01-2.009 0L2 7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailPenIcon
});
