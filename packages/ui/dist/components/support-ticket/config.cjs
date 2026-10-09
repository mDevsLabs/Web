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
const config = { "name": "SupportTicket", "label": "Tickets de support", "description": "G\xE9rez vos tickets de support depuis une interface claire.", "fields": [{ "key": "subject", "label": "Objet", "kind": "text", "required": true }, { "key": "customer", "label": "Client", "kind": "text", "required": true }, { "key": "priority", "label": "Priorit\xE9", "kind": "text", "required": true }, { "key": "createdOn", "label": "Cr\xE9ation", "kind": "date", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["open", "in-progress", "resolved", "closed"] }], "titleKey": "subject", "settings": [{ "key": "notifySupportTicket", "label": "Notifications : tickets de support", "description": "Recevoir un signal lors des changements." }, { "key": "archiveSupportTicket", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section tickets de support." }, { "key": "approveSupportTicket", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
