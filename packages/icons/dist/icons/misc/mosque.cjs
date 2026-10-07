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
var mosque_exports = {};
__export(mosque_exports, {
  MosqueIcon: () => MosqueIcon
});
module.exports = __toCommonJS(mosque_exports);
var import_create_icon = require("../../create-icon.cjs");
const MosqueIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MosqueIcon", [["path", { "d": "M12.268 2a2 2 0 003.465 2" }], ["path", { "d": "M14 5 L14 8" }], ["path", { "d": "M16 22v-3a2 2 0 00-4 0v3" }], ["path", { "d": "M21 13c-.662-1.497-1.666-2.753-2.9-3.63C16.825 8.47 15.422 8 14 8s-2.826.47-4.1 1.37C8.668 10.248 7.663 11.504 7 13z" }], ["path", { "d": "M3 9h4" }], ["path", { "d": "M7 22V6a5 5 0 00-2-4 5 5 0 00-2 4v14a2 2 0 002 2h14a2 2 0 002-2v-7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MosqueIcon
});
