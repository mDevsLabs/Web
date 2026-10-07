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
var robot_vacuum_exports = {};
__export(robot_vacuum_exports, {
  RobotVacuumIcon: () => RobotVacuumIcon
});
module.exports = __toCommonJS(robot_vacuum_exports);
var import_create_icon = require("../../create-icon.cjs");
const RobotVacuumIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RobotVacuumIcon", [["path", { "d": "M11 17h2" }], ["path", { "d": "M12 12h.01" }], ["path", { "d": "M17 12a5 5 0 00-10 0" }], ["path", { "d": "M19 2v2.8" }], ["path", { "d": "M2 5h2.8" }], ["path", { "d": "M22 5h-2.8" }], ["path", { "d": "M5 2v2.8" }], ["circle", { "cx": "12", "cy": "12", "r": "10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RobotVacuumIcon
});
