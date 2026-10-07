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
var mails_exports = {};
__export(mails_exports, {
  MailsIcon: () => MailsIcon
});
module.exports = __toCommonJS(mails_exports);
var import_create_icon = require("../../create-icon.cjs");
const MailsIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MailsIcon", [["path", { "d": "M17 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 1-1.732" }], ["path", { "d": "m22 5.5-6.419 4.179a2 2 0 0 1-2.162 0L7 5.5" }], ["rect", { "x": "7", "y": "3", "width": "15", "height": "12", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailsIcon
});
