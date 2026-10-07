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
var activity_heartbeat_exports = {};
__export(activity_heartbeat_exports, {
  ActivityHeartbeatIcon: () => ActivityHeartbeatIcon
});
module.exports = __toCommonJS(activity_heartbeat_exports);
var import_create_icon = require("../../create-icon.cjs");
const ActivityHeartbeatIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ActivityHeartbeatIcon", [["path", { "d": "M3 12h4.5l1.5 -6l4 12l2 -9l1.5 3h4.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActivityHeartbeatIcon
});
