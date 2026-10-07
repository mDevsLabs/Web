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
var iv_bag_exports = {};
__export(iv_bag_exports, {
  IvBagIcon: () => IvBagIcon
});
module.exports = __toCommonJS(iv_bag_exports);
var import_create_icon = require("../../create-icon.cjs");
const IvBagIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("IvBagIcon", [["path", { "d": "M12 18v2a2 2 0 002 2h6" }], ["path", { "d": "M6 11c.72.5 1.44 1 3 1 3 0 3-2 6-2 1.56 0 2.28.5 3 1" }], ["path", { "d": "M9.293 3c.453 0 .887-.18 1.207-.5s.754-.5 1.207-.5h.586c.453 0 .887.18 1.207.5s.754.5 1.207.5H16a2 2 0 012 2v11a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IvBagIcon
});
