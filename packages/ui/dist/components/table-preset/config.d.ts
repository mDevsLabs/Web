export declare const config: {
    readonly name: "TablePreset";
    readonly label: "Vues de table";
    readonly description: "Gérez vos vues de table depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "owner";
        readonly label: "Propriétaire";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "columnCount";
        readonly label: "Colonnes";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "pageSize";
        readonly label: "Lignes par page";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "updatedAt";
        readonly label: "Mise à jour";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "active", "shared", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyTablePreset";
        readonly label: "Notifications : vues de table";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveTablePreset";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section vues de table.";
    }, {
        readonly key: "approveTablePreset";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
