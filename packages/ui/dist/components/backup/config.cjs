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
const config = { "name": "Backup", "label": "Sauvegardes", "description": "G\xE9rez vos sauvegardes depuis une interface claire.", "fields": [{ "key": "name", "label": "Nom", "kind": "text", "required": true }, { "key": "resource", "label": "Ressource", "kind": "text", "required": true }, { "key": "sizeGb", "label": "Taille (Go)", "kind": "number", "required": true }, { "key": "createdOn", "label": "Cr\xE9ation", "kind": "date", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["scheduled", "running", "complete", "failed"] }], "titleKey": "name", "settings": [{ "key": "notifyBackup", "label": "Notifications : sauvegardes", "description": "Recevoir un signal lors des changements." }, { "key": "archiveBackup", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section sauvegardes." }, { "key": "approveBackup", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
