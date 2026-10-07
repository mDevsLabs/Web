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
var certificate_exports = {};
__export(certificate_exports, {
  CertificateIcon: () => CertificateIcon
});
module.exports = __toCommonJS(certificate_exports);
var import_create_icon = require("../../create-icon.cjs");
const CertificateIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CertificateIcon", [["path", { "d": "M12 15a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }], ["path", { "d": "M13 17.5v4.5l2 -1.5l2 1.5v-4.5" }], ["path", { "d": "M10 19h-5a2 2 0 0 1 -2 -2v-10c0 -1.1 .9 -2 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -1 1.73" }], ["path", { "d": "M6 9l12 0" }], ["path", { "d": "M6 12l3 0" }], ["path", { "d": "M6 15l2 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CertificateIcon
});
