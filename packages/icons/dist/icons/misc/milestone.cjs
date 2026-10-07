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
var milestone_exports = {};
__export(milestone_exports, {
  MilestoneIcon: () => MilestoneIcon
});
module.exports = __toCommonJS(milestone_exports);
var import_create_icon = require("../../create-icon.cjs");
const MilestoneIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MilestoneIcon", [["path", { "d": "M12 13v8" }], ["path", { "d": "M12 3v3" }], ["path", { "d": "M18.172 6a2 2 0 0 1 1.414.586l2.06 2.06a1.207 1.207 0 0 1 0 1.708l-2.06 2.06a2 2 0 0 1-1.414.586H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MilestoneIcon
});
