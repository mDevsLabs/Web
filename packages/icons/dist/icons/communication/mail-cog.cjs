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
var mail_cog_exports = {};
__export(mail_cog_exports, {
  MailCogIcon: () => MailCogIcon
});
module.exports = __toCommonJS(mail_cog_exports);
var import_create_icon = require("../../create-icon.cjs");
const MailCogIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MailCogIcon", [["path", { "d": "M12 19h-7a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v5" }], ["path", { "d": "M3 7l9 6l9 -6" }], ["path", { "d": "M17.001 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M19.001 15.5v1.5" }], ["path", { "d": "M19.001 21v1.5" }], ["path", { "d": "M22.032 17.25l-1.299 .75" }], ["path", { "d": "M17.27 20l-1.3 .75" }], ["path", { "d": "M15.97 17.25l1.3 .75" }], ["path", { "d": "M20.733 20l1.3 .75" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailCogIcon
});
