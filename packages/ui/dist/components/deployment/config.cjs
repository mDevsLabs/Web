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
const config = { "name": "Deployment", "label": "D\xE9ploiements", "description": "G\xE9rez vos d\xE9ploiements depuis une interface claire.", "fields": [{ "key": "name", "label": "Nom", "kind": "text", "required": true }, { "key": "environment", "label": "Environnement", "kind": "text", "required": true }, { "key": "commit", "label": "Commit", "kind": "text", "required": true }, { "key": "deployedOn", "label": "Date", "kind": "date", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["queued", "running", "succeeded", "failed"] }], "titleKey": "name", "settings": [{ "key": "notifyDeployment", "label": "Notifications : d\xE9ploiements", "description": "Recevoir un signal lors des changements." }, { "key": "archiveDeployment", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section d\xE9ploiements." }, { "key": "approveDeployment", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
