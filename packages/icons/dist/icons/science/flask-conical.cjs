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
var flask_conical_exports = {};
__export(flask_conical_exports, {
  FlaskConicalIcon: () => FlaskConicalIcon
});
module.exports = __toCommonJS(flask_conical_exports);
var import_create_icon = require("../../create-icon.cjs");
const FlaskConicalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FlaskConicalIcon", [["path", { "d": "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" }], ["path", { "d": "M6.453 15h11.094" }], ["path", { "d": "M8.5 2h7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FlaskConicalIcon
});
