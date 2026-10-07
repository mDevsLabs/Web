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
var engine_exports = {};
__export(engine_exports, {
  EngineIcon: () => EngineIcon
});
module.exports = __toCommonJS(engine_exports);
var import_create_icon = require("../../create-icon.cjs");
const EngineIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EngineIcon", [["path", { "d": "M10 3h6" }], ["path", { "d": "M13 3v4" }], ["path", { "d": "M2 10v6" }], ["path", { "d": "M2 13h4" }], ["path", { "d": "M6 16a2 2 0 002 2h1a2 2 0 011.6.8l.3.4a2 2 0 001.6.8h2.264a2 2 0 001.789-1.106l1.67-3.341a1 1 0 01.895-.553H21a1 1 0 001-1v-4a1 1 0 00-1-1h-3.5a1 1 0 01-.8-.4l-.9-1.2A1 1 0 0015 7h-4a1 1 0 00-.8.4l-.9 1.2a1 1 0 01-.8.4H7a1 1 0 00-1 1z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EngineIcon
});
