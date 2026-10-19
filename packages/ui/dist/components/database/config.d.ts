export declare const config: {
    readonly name: "Database";
    readonly label: "Bases de données";
    readonly description: "Gérez vos bases de données depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "engine";
        readonly label: "Moteur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "sizeGb";
        readonly label: "Taille (Go)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "connectionCount";
        readonly label: "Connexions";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["healthy", "degraded", "offline"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyDatabase";
        readonly label: "Notifications : bases de données";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveDatabase";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section bases de données.";
    }, {
        readonly key: "approveDatabase";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
