"use client";
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var hotel_room_exports = {};
module.exports = __toCommonJS(hotel_room_exports);
__reExport(hotel_room_exports, require("./types.cjs"), module.exports);
__reExport(hotel_room_exports, require("./hotel-room-overview.cjs"), module.exports);
__reExport(hotel_room_exports, require("./hotel-room-card.cjs"), module.exports);
__reExport(hotel_room_exports, require("./hotel-room-list.cjs"), module.exports);
__reExport(hotel_room_exports, require("./hotel-room-table.cjs"), module.exports);
__reExport(hotel_room_exports, require("./hotel-room-form.cjs"), module.exports);
__reExport(hotel_room_exports, require("./hotel-room-filters.cjs"), module.exports);
__reExport(hotel_room_exports, require("./hotel-room-timeline.cjs"), module.exports);
__reExport(hotel_room_exports, require("./hotel-room-stats.cjs"), module.exports);
__reExport(hotel_room_exports, require("./hotel-room-empty-state.cjs"), module.exports);
__reExport(hotel_room_exports, require("./hotel-room-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./hotel-room-overview.cjs"),
  ...require("./hotel-room-card.cjs"),
  ...require("./hotel-room-list.cjs"),
  ...require("./hotel-room-table.cjs"),
  ...require("./hotel-room-form.cjs"),
  ...require("./hotel-room-filters.cjs"),
  ...require("./hotel-room-timeline.cjs"),
  ...require("./hotel-room-stats.cjs"),
  ...require("./hotel-room-empty-state.cjs"),
  ...require("./hotel-room-settings.cjs")
});
