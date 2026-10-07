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
var train_front_tunnel_exports = {};
__export(train_front_tunnel_exports, {
  TrainFrontTunnelIcon: () => TrainFrontTunnelIcon
});
module.exports = __toCommonJS(train_front_tunnel_exports);
var import_create_icon = require("../../create-icon.cjs");
const TrainFrontTunnelIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TrainFrontTunnelIcon", [["path", { "d": "M2 22V12a10 10 0 1 1 20 0v10" }], ["path", { "d": "M15 6.8v1.4a3 2.8 0 1 1-6 0V6.8" }], ["path", { "d": "M10 15h.01" }], ["path", { "d": "M14 15h.01" }], ["path", { "d": "M10 19a4 4 0 0 1-4-4v-3a6 6 0 1 1 12 0v3a4 4 0 0 1-4 4Z" }], ["path", { "d": "m9 19-2 3" }], ["path", { "d": "m15 19 2 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TrainFrontTunnelIcon
});
