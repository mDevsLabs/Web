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
var virus_exports = {};
__export(virus_exports, {
  VirusIcon: () => VirusIcon
});
module.exports = __toCommonJS(virus_exports);
var import_create_icon = require("../../create-icon.cjs");
const VirusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("VirusIcon", [["path", { "d": "M12 14.991h.01" }], ["path", { "d": "M12 22v-3" }], ["path", { "d": "M12 2v3" }], ["path", { "d": "M13 22h-2" }], ["path", { "d": "M13 2h-2" }], ["path", { "d": "M13.99 10H14" }], ["path", { "d": "m16.5 19.794-1-1.733" }], ["path", { "d": "m16.5 4.205-1 1.732" }], ["path", { "d": "m19.794 16.5-1.732-1" }], ["path", { "d": "m19.794 7.5-1.732 1" }], ["path", { "d": "M2 12h3" }], ["path", { "d": "M2 13v-2" }], ["path", { "d": "M22 12h-3" }], ["path", { "d": "M22 13v-2" }], ["path", { "d": "m4.206 16.5 1.732-1" }], ["path", { "d": "m4.206 7.5 1.732 1" }], ["path", { "d": "m7.5 19.794 1-1.733" }], ["path", { "d": "m7.5 4.205 1 1.732" }], ["path", { "d": "M9 12h.01" }], ["circle", { "cx": "12", "cy": "12", "r": "7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VirusIcon
});
