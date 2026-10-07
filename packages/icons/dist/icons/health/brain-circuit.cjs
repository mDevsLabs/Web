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
var brain_circuit_exports = {};
__export(brain_circuit_exports, {
  BrainCircuitIcon: () => BrainCircuitIcon
});
module.exports = __toCommonJS(brain_circuit_exports);
var import_create_icon = require("../../create-icon.cjs");
const BrainCircuitIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BrainCircuitIcon", [["path", { "d": "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" }], ["path", { "d": "M9 13a4.5 4.5 0 0 0 3-4" }], ["path", { "d": "M6.003 5.125A3 3 0 0 0 6.401 6.5" }], ["path", { "d": "M3.477 10.896a4 4 0 0 1 .585-.396" }], ["path", { "d": "M6 18a4 4 0 0 1-1.967-.516" }], ["path", { "d": "M12 13h4" }], ["path", { "d": "M12 18h6a2 2 0 0 1 2 2v1" }], ["path", { "d": "M12 8h8" }], ["path", { "d": "M16 8V5a2 2 0 0 1 2-2" }], ["circle", { "cx": "16", "cy": "13", "r": ".5" }], ["circle", { "cx": "18", "cy": "3", "r": ".5" }], ["circle", { "cx": "20", "cy": "21", "r": ".5" }], ["circle", { "cx": "20", "cy": "8", "r": ".5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrainCircuitIcon
});
