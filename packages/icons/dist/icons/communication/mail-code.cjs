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
var mail_code_exports = {};
__export(mail_code_exports, {
  MailCodeIcon: () => MailCodeIcon
});
module.exports = __toCommonJS(mail_code_exports);
var import_create_icon = require("../../create-icon.cjs");
const MailCodeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MailCodeIcon", [["path", { "d": "M11 19h-6a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v6" }], ["path", { "d": "M3 7l9 6l9 -6" }], ["path", { "d": "M20 21l2 -2l-2 -2" }], ["path", { "d": "M17 17l-2 2l2 2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailCodeIcon
});
