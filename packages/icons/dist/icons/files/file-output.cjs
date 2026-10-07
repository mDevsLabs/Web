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
var file_output_exports = {};
__export(file_output_exports, {
  FileOutputIcon: () => FileOutputIcon
});
module.exports = __toCommonJS(file_output_exports);
var import_create_icon = require("../../create-icon.cjs");
const FileOutputIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FileOutputIcon", [["path", { "d": "M4.226 20.925A2 2 0 0 0 6 22h12a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v3.127" }], ["path", { "d": "M14 2v5a1 1 0 0 0 1 1h5" }], ["path", { "d": "m5 11-3 3" }], ["path", { "d": "m5 17-3-3h10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileOutputIcon
});
