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
var checkup_list_exports = {};
__export(checkup_list_exports, {
  CheckupListIcon: () => CheckupListIcon
});
module.exports = __toCommonJS(checkup_list_exports);
var import_create_icon = require("../../create-icon.cjs");
const CheckupListIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CheckupListIcon", [["path", { "d": "M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" }], ["path", { "d": "M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2" }], ["path", { "d": "M9 14h.01" }], ["path", { "d": "M9 17h.01" }], ["path", { "d": "M12 16l1 1l3 -3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CheckupListIcon
});
