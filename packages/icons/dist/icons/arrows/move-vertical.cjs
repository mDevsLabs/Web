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
var move_vertical_exports = {};
__export(move_vertical_exports, {
  MoveVerticalIcon: () => MoveVerticalIcon
});
module.exports = __toCommonJS(move_vertical_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoveVerticalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoveVerticalIcon", [["path", { "d": "M12 2v20" }], ["path", { "d": "m8 18 4 4 4-4" }], ["path", { "d": "m8 6 4-4 4 4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoveVerticalIcon
});
