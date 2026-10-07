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
var save_plus_exports = {};
__export(save_plus_exports, {
  SavePlusIcon: () => SavePlusIcon
});
module.exports = __toCommonJS(save_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const SavePlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SavePlusIcon", [["path", { "d": "M12.5 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10.2a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V12" }], ["path", { "d": "M16 13H8a1 1 0 0 0-1 1v7" }], ["path", { "d": "M19 22v-6" }], ["path", { "d": "M22 19h-6" }], ["path", { "d": "M7 3v4a1 1 0 0 0 1 1h7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SavePlusIcon
});
