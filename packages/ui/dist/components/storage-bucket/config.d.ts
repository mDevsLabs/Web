export declare const config: {
    readonly name: "StorageBucket";
    readonly label: "Espaces de stockage";
    readonly description: "Gérez vos espaces de stockage depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "region";
        readonly label: "Région";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "objectCount";
        readonly label: "Objets";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "sizeGb";
        readonly label: "Taille (Go)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["private", "public", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyStorageBucket";
        readonly label: "Notifications : espaces de stockage";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveStorageBucket";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section espaces de stockage.";
    }, {
        readonly key: "approveStorageBucket";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
