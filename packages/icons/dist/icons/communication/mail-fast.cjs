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
var mail_fast_exports = {};
__export(mail_fast_exports, {
  MailFastIcon: () => MailFastIcon
});
module.exports = __toCommonJS(mail_fast_exports);
var import_create_icon = require("../../create-icon.cjs");
const MailFastIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MailFastIcon", [["path", { "d": "M3 7h3" }], ["path", { "d": "M3 11h2" }], ["path", { "d": "M9.02 8.801l-.6 6a2 2 0 0 0 1.99 2.199h7.98a2 2 0 0 0 1.99 -1.801l.6 -6a2 2 0 0 0 -1.99 -2.199h-7.98a2 2 0 0 0 -1.99 1.801" }], ["path", { "d": "M9.8 7.5l2.982 3.28a3 3 0 0 0 4.238 .202l3.28 -2.982" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailFastIcon
});
