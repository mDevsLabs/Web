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
var mail_bolt_exports = {};
__export(mail_bolt_exports, {
  MailBoltIcon: () => MailBoltIcon
});
module.exports = __toCommonJS(mail_bolt_exports);
var import_create_icon = require("../../create-icon.cjs");
const MailBoltIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MailBoltIcon", [["path", { "d": "M13 19h-8a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v5.5" }], ["path", { "d": "M3 7l9 6l9 -6" }], ["path", { "d": "M19 16l-2 3h4l-2 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailBoltIcon
});
