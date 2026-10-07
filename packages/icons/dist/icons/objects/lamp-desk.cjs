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
var lamp_desk_exports = {};
__export(lamp_desk_exports, {
  LampDeskIcon: () => LampDeskIcon
});
module.exports = __toCommonJS(lamp_desk_exports);
var import_create_icon = require("../../create-icon.cjs");
const LampDeskIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LampDeskIcon", [["path", { "d": "M10.293 2.293a1 1 0 0 1 1.414 0l2.5 2.5 5.994 1.227a1 1 0 0 1 .506 1.687l-7 7a1 1 0 0 1-1.687-.506l-1.227-5.994-2.5-2.5a1 1 0 0 1 0-1.414z" }], ["path", { "d": "m14.207 4.793-3.414 3.414" }], ["path", { "d": "M3 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" }], ["path", { "d": "m9.086 6.5-4.793 4.793a1 1 0 0 0-.18 1.17L7 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LampDeskIcon
});
