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
var hand_helping_exports = {};
__export(hand_helping_exports, {
  HandHelpingIcon: () => HandHelpingIcon
});
module.exports = __toCommonJS(hand_helping_exports);
var import_create_icon = require("../../create-icon.cjs");
const HandHelpingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HandHelpingIcon", [["path", { "d": "M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14" }], ["path", { "d": "m7 18 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" }], ["path", { "d": "m2 13 6 6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HandHelpingIcon
});
