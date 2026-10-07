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
var ticket_percent_exports = {};
__export(ticket_percent_exports, {
  TicketPercentIcon: () => TicketPercentIcon
});
module.exports = __toCommonJS(ticket_percent_exports);
var import_create_icon = require("../../create-icon.cjs");
const TicketPercentIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TicketPercentIcon", [["path", { "d": "M2 9a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" }], ["path", { "d": "M9 9h.01" }], ["path", { "d": "m15 9-6 6" }], ["path", { "d": "M15 15h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TicketPercentIcon
});
