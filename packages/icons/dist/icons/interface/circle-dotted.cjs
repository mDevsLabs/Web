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
var circle_dotted_exports = {};
__export(circle_dotted_exports, {
  CircleDottedIcon: () => CircleDottedIcon
});
module.exports = __toCommonJS(circle_dotted_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleDottedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleDottedIcon", [["path", { "d": "M7.5 4.21l0 .01" }], ["path", { "d": "M4.21 7.5l0 .01" }], ["path", { "d": "M3 12l0 .01" }], ["path", { "d": "M4.21 16.5l0 .01" }], ["path", { "d": "M7.5 19.79l0 .01" }], ["path", { "d": "M12 21l0 .01" }], ["path", { "d": "M16.5 19.79l0 .01" }], ["path", { "d": "M19.79 16.5l0 .01" }], ["path", { "d": "M21 12l0 .01" }], ["path", { "d": "M19.79 7.5l0 .01" }], ["path", { "d": "M16.5 4.21l0 .01" }], ["path", { "d": "M12 3l0 .01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleDottedIcon
});
