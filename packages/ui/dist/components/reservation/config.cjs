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
var config_exports = {};
__export(config_exports, {
  config: () => config
});
module.exports = __toCommonJS(config_exports);
const config = { "name": "Reservation", "label": "R\xE9servations h\xF4teli\xE8res", "description": "G\xE9rez vos r\xE9servations h\xF4teli\xE8res depuis une interface claire.", "fields": [{ "key": "reference", "label": "R\xE9f\xE9rence", "kind": "text", "required": true }, { "key": "guest", "label": "Voyageur", "kind": "text", "required": true }, { "key": "checkIn", "label": "Arriv\xE9e", "kind": "date", "required": true }, { "key": "checkOut", "label": "D\xE9part", "kind": "date", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["pending", "confirmed", "checked-in", "completed"] }], "titleKey": "reference", "settings": [{ "key": "notifyReservation", "label": "Notifications : r\xE9servations h\xF4teli\xE8res", "description": "Recevoir un signal lors des changements." }, { "key": "archiveReservation", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section r\xE9servations h\xF4teli\xE8res." }, { "key": "approveReservation", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
