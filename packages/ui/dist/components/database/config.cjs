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
const config = { "name": "Database", "label": "Bases de donn\xE9es", "description": "G\xE9rez vos bases de donn\xE9es depuis une interface claire.", "fields": [{ "key": "name", "label": "Nom", "kind": "text", "required": true }, { "key": "engine", "label": "Moteur", "kind": "text", "required": true }, { "key": "sizeGb", "label": "Taille (Go)", "kind": "number", "required": true }, { "key": "connectionCount", "label": "Connexions", "kind": "number", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["healthy", "degraded", "offline"] }], "titleKey": "name", "settings": [{ "key": "notifyDatabase", "label": "Notifications : bases de donn\xE9es", "description": "Recevoir un signal lors des changements." }, { "key": "archiveDatabase", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section bases de donn\xE9es." }, { "key": "approveDatabase", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
