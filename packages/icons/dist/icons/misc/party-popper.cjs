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
var party_popper_exports = {};
__export(party_popper_exports, {
  PartyPopperIcon: () => PartyPopperIcon
});
module.exports = __toCommonJS(party_popper_exports);
var import_create_icon = require("../../create-icon.cjs");
const PartyPopperIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PartyPopperIcon", [["path", { "d": "M5.8 11.3 2 22l10.7-3.79" }], ["path", { "d": "M4 3h.01" }], ["path", { "d": "M22 8h.01" }], ["path", { "d": "M15 2h.01" }], ["path", { "d": "M22 20h.01" }], ["path", { "d": "m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" }], ["path", { "d": "m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" }], ["path", { "d": "m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" }], ["path", { "d": "M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PartyPopperIcon
});
