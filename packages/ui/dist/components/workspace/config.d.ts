export declare const config: {
    readonly name: "Workspace";
    readonly label: "Espaces de travail";
    readonly description: "Gérez vos espaces de travail depuis une interface claire.";
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
        readonly key: "memberCount";
        readonly label: "Membres";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "storageGb";
        readonly label: "Stockage (Go)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "trial", "suspended"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyWorkspace";
        readonly label: "Notifications : espaces de travail";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveWorkspace";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section espaces de travail.";
    }, {
        readonly key: "approveWorkspace";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
