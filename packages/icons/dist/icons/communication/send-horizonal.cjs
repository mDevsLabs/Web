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
var send_horizonal_exports = {};
__export(send_horizonal_exports, {
  SendHorizonalIcon: () => SendHorizonalIcon
});
module.exports = __toCommonJS(send_horizonal_exports);
var import_create_icon = require("../../create-icon.cjs");
const SendHorizonalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SendHorizonalIcon", [["path", { "d": "M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" }], ["path", { "d": "M6 12h16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SendHorizonalIcon
});
