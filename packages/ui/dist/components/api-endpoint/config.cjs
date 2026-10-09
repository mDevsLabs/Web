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
const config = { "name": "ApiEndpoint", "label": "Points d\u2019API", "description": "G\xE9rez vos points d\u2019api depuis une interface claire.", "fields": [{ "key": "path", "label": "Chemin", "kind": "text", "required": true }, { "key": "method", "label": "M\xE9thode", "kind": "text", "required": true }, { "key": "latencyMs", "label": "Latence (ms)", "kind": "number", "required": true }, { "key": "requestCount", "label": "Requ\xEAtes", "kind": "number", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["healthy", "degraded", "disabled"] }], "titleKey": "path", "settings": [{ "key": "notifyApiEndpoint", "label": "Notifications : points d\u2019api", "description": "Recevoir un signal lors des changements." }, { "key": "archiveApiEndpoint", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section points d\u2019api." }, { "key": "approveApiEndpoint", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
