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
var mail_badge_exports = {};
__export(mail_badge_exports, {
  MailBadgeIcon: () => MailBadgeIcon
});
module.exports = __toCommonJS(mail_badge_exports);
var import_create_icon = require("../../create-icon.cjs");
const MailBadgeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MailBadgeIcon", [["path", { "d": "M22 7.7V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8.25" }], ["path", { "d": "M12 12.996a1.94 1.94 0 0 1-1.03-.296L2 7" }], ["path", { "d": "m20.69 16.479 1.29 4.88a.5.5 0 0 1-.698.591l-1.843-.849a1 1 0 0 0-.879.001l-1.846.85a.5.5 0 0 1-.692-.593l1.29-4.88" }], ["circle", { "cx": "19", "cy": "14", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailBadgeIcon
});
