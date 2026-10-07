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
var door_stairwell_exports = {};
__export(door_stairwell_exports, {
  DoorStairwellIcon: () => DoorStairwellIcon
});
module.exports = __toCommonJS(door_stairwell_exports);
var import_create_icon = require("../../create-icon.cjs");
const DoorStairwellIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DoorStairwellIcon", [["path", { "d": "M12 17v-3a1 1 0 011-1h6" }], ["path", { "d": "M19 17h-9a1 1 0 00-1 1v3" }], ["path", { "d": "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" }], ["path", { "d": "M19 9h-3a1 1 0 00-1 1v3" }], ["path", { "d": "M22 21H2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DoorStairwellIcon
});
