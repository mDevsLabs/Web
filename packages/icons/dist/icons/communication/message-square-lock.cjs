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
var message_square_lock_exports = {};
__export(message_square_lock_exports, {
  MessageSquareLockIcon: () => MessageSquareLockIcon
});
module.exports = __toCommonJS(message_square_lock_exports);
var import_create_icon = require("../../create-icon.cjs");
const MessageSquareLockIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MessageSquareLockIcon", [["path", { "d": "M22 8.5V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H10" }], ["path", { "d": "M20 15v-2a2 2 0 0 0-4 0v2" }], ["rect", { "x": "14", "y": "15", "width": "8", "height": "5", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MessageSquareLockIcon
});
