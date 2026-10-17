export declare const config: {
    readonly name: "Integration";
    readonly label: "Intégrations";
    readonly description: "Gérez vos intégrations depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "provider";
        readonly label: "Fournisseur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "connectedOn";
        readonly label: "Connexion";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "syncCount";
        readonly label: "Synchronisations";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["connected", "pending", "error"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyIntegration";
        readonly label: "Notifications : intégrations";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveIntegration";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section intégrations.";
    }, {
        readonly key: "approveIntegration";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
