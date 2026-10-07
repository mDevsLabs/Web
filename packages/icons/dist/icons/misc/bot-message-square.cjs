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
var bot_message_square_exports = {};
__export(bot_message_square_exports, {
  BotMessageSquareIcon: () => BotMessageSquareIcon
});
module.exports = __toCommonJS(bot_message_square_exports);
var import_create_icon = require("../../create-icon.cjs");
const BotMessageSquareIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BotMessageSquareIcon", [["path", { "d": "M12 6V2H8" }], ["path", { "d": "M15 11v2" }], ["path", { "d": "M2 12h2" }], ["path", { "d": "M20 12h2" }], ["path", { "d": "M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" }], ["path", { "d": "M9 11v2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BotMessageSquareIcon
});
