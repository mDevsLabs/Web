export declare const config: {
    readonly name: "Backup";
    readonly label: "Sauvegardes";
    readonly description: "Gérez vos sauvegardes depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "resource";
        readonly label: "Ressource";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "sizeGb";
        readonly label: "Taille (Go)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "createdOn";
        readonly label: "Création";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["scheduled", "running", "complete", "failed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyBackup";
        readonly label: "Notifications : sauvegardes";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveBackup";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section sauvegardes.";
    }, {
        readonly key: "approveBackup";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
