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
var tower_control_exports = {};
__export(tower_control_exports, {
  TowerControlIcon: () => TowerControlIcon
});
module.exports = __toCommonJS(tower_control_exports);
var import_create_icon = require("../../create-icon.cjs");
const TowerControlIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TowerControlIcon", [["path", { "d": "M18.2 12.27 20 6H4l1.8 6.27a1 1 0 0 0 .95.73h10.5a1 1 0 0 0 .96-.73Z" }], ["path", { "d": "M8 13v9" }], ["path", { "d": "M16 22v-9" }], ["path", { "d": "m9 6 1 7" }], ["path", { "d": "m15 6-1 7" }], ["path", { "d": "M12 6V2" }], ["path", { "d": "M13 2h-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TowerControlIcon
});
