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
var certificate_2_off_exports = {};
__export(certificate_2_off_exports, {
  Certificate2OffIcon: () => Certificate2OffIcon
});
module.exports = __toCommonJS(certificate_2_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const Certificate2OffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Certificate2OffIcon", [["path", { "d": "M12 12a3 3 0 1 0 3 3" }], ["path", { "d": "M11 7h3" }], ["path", { "d": "M10 18v4l2 -1l2 1v-4" }], ["path", { "d": "M10 19h-2a2 2 0 0 1 -2 -2v-11m1.18 -2.825c.25 -.112 .529 -.175 .82 -.175h8a2 2 0 0 1 2 2v9m-.175 3.82a2 2 0 0 1 -1.825 1.18h-2" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Certificate2OffIcon
});
