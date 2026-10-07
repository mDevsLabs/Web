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
var mailbox_exports = {};
__export(mailbox_exports, {
  MailboxIcon: () => MailboxIcon
});
module.exports = __toCommonJS(mailbox_exports);
var import_create_icon = require("../../create-icon.cjs");
const MailboxIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MailboxIcon", [["path", { "d": "M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" }], ["polyline", { "points": "15,9 18,9 18,11" }], ["path", { "d": "M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2" }], ["line", { "x1": "6", "x2": "7", "y1": "10", "y2": "10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MailboxIcon
});
