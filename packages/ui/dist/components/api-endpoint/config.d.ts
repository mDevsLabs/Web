export declare const config: {
    readonly name: "ApiEndpoint";
    readonly label: "Points d’API";
    readonly description: "Gérez vos points d’api depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "path";
        readonly label: "Chemin";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "method";
        readonly label: "Méthode";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "latencyMs";
        readonly label: "Latence (ms)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "requestCount";
        readonly label: "Requêtes";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["healthy", "degraded", "disabled"];
    }];
    readonly titleKey: "path";
    readonly settings: readonly [{
        readonly key: "notifyApiEndpoint";
        readonly label: "Notifications : points d’api";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveApiEndpoint";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section points d’api.";
    }, {
        readonly key: "approveApiEndpoint";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
