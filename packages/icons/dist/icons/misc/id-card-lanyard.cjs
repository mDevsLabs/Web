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
var id_card_lanyard_exports = {};
__export(id_card_lanyard_exports, {
  IdCardLanyardIcon: () => IdCardLanyardIcon
});
module.exports = __toCommonJS(id_card_lanyard_exports);
var import_create_icon = require("../../create-icon.cjs");
const IdCardLanyardIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("IdCardLanyardIcon", [["path", { "d": "M13.5 8h-3" }], ["path", { "d": "m15 2-1 2h3a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h3" }], ["path", { "d": "M16 22a4 4 0 00-8 0" }], ["path", { "d": "m9 2 3 6" }], ["circle", { "cx": "12", "cy": "15", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IdCardLanyardIcon
});
