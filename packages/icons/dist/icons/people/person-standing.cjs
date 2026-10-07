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
var person_standing_exports = {};
__export(person_standing_exports, {
  PersonStandingIcon: () => PersonStandingIcon
});
module.exports = __toCommonJS(person_standing_exports);
var import_create_icon = require("../../create-icon.cjs");
const PersonStandingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PersonStandingIcon", [["circle", { "cx": "12", "cy": "5", "r": "1" }], ["path", { "d": "m9 20 3-6 3 6" }], ["path", { "d": "m6 8 6 2 6-2" }], ["path", { "d": "M12 10v4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PersonStandingIcon
});
