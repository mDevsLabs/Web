export declare const config: {
    readonly name: "Folder";
    readonly label: "Dossiers";
    readonly description: "Gérez vos dossiers depuis une interface claire.";
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
        readonly key: "fileCount";
        readonly label: "Fichiers";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "updatedOn";
        readonly label: "Modification";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["private", "shared", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyFolder";
        readonly label: "Notifications : dossiers";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveFolder";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section dossiers.";
    }, {
        readonly key: "approveFolder";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
