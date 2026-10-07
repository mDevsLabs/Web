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
var bot_id_exports = {};
__export(bot_id_exports, {
  BotIdIcon: () => BotIdIcon
});
module.exports = __toCommonJS(bot_id_exports);
var import_create_icon = require("../../create-icon.cjs");
const BotIdIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BotIdIcon", [["path", { "d": "M7 10.5c0 -.828 .746 -1.5 1.667 -1.5h6.666c.92 0 1.667 .672 1.667 1.5v3c0 .828 -.746 1.5 -1.667 1.5h-6.666c-.92 0 -1.667 -.672 -1.667 -1.5v-3" }], ["path", { "d": "M12 7v2" }], ["path", { "d": "M10 12v.01" }], ["path", { "d": "M14 12v.01" }], ["path", { "d": "M4 8v-2a2 2 0 0 1 2 -2h2" }], ["path", { "d": "M4 16v2a2 2 0 0 0 2 2h2" }], ["path", { "d": "M16 4h2a2 2 0 0 1 2 2v2" }], ["path", { "d": "M16 20h2a2 2 0 0 0 2 -2v-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BotIdIcon
});
