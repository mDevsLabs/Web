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
var ship_exports = {};
__export(ship_exports, {
  ShipIcon: () => ShipIcon
});
module.exports = __toCommonJS(ship_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShipIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShipIcon", [["path", { "d": "M12 2v2" }], ["path", { "d": "M12 9.189V13" }], ["path", { "d": "M19 12V6a2 2 0 00-2-2H7a2 2 0 00-2 2v6" }], ["path", { "d": "M19.38 19A11.6 11.6 0 0021 13l-8.188-3.639a2 2 0 00-1.624 0L3 13.001a11.6 11.6 0 002.81 7.76" }], ["path", { "d": "M2 20c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShipIcon
});
