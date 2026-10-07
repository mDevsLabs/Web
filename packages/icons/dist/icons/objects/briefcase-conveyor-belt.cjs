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
var briefcase_conveyor_belt_exports = {};
__export(briefcase_conveyor_belt_exports, {
  BriefcaseConveyorBeltIcon: () => BriefcaseConveyorBeltIcon
});
module.exports = __toCommonJS(briefcase_conveyor_belt_exports);
var import_create_icon = require("../../create-icon.cjs");
const BriefcaseConveyorBeltIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BriefcaseConveyorBeltIcon", [["path", { "d": "M10 20v2" }], ["path", { "d": "M14 20v2" }], ["path", { "d": "M18 20v2" }], ["path", { "d": "M21 20H3" }], ["path", { "d": "M6 20v2" }], ["path", { "d": "M8 16V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12" }], ["rect", { "x": "4", "y": "6", "width": "16", "height": "10", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BriefcaseConveyorBeltIcon
});
