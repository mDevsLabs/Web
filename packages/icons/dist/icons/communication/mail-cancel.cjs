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
var mail_cancel_exports = {};
__export(mail_cancel_exports, {
  MailCancelIcon: () => MailCancelIcon
});
module.exports = __toCommonJS(mail_cancel_exports);
var import_create_icon = require("../../create-icon.cjs");
const MailCancelIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MailCancelIcon", [["path", { "d": "M12 19h-7a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v5" }], ["path", { "d": "M16 19a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }], ["path", { "d": "M17 21l4 -4" }], ["path", { "d": "M3 7l9 6l9 -6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailCancelIcon
});
