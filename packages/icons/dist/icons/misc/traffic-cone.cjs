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
var traffic_cone_exports = {};
__export(traffic_cone_exports, {
  TrafficConeIcon: () => TrafficConeIcon
});
module.exports = __toCommonJS(traffic_cone_exports);
var import_create_icon = require("../../create-icon.cjs");
const TrafficConeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TrafficConeIcon", [["path", { "d": "M16.05 10.966a5 2.5 0 0 1-8.1 0" }], ["path", { "d": "m16.923 14.049 4.48 2.04a1 1 0 0 1 .001 1.831l-8.574 3.9a2 2 0 0 1-1.66 0l-8.574-3.91a1 1 0 0 1 0-1.83l4.484-2.04" }], ["path", { "d": "M16.949 14.14a5 2.5 0 1 1-9.9 0L10.063 3.5a2 2 0 0 1 3.874 0z" }], ["path", { "d": "M9.194 6.57a5 2.5 0 0 0 5.61 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TrafficConeIcon
});
