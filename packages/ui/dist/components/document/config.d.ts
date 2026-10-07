export declare const config: {
    readonly name: "Document";
    readonly label: "Documents";
    readonly description: "Gérez vos documents depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "owner";
        readonly label: "Propriétaire";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "pageCount";
        readonly label: "Pages";
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
        readonly options: readonly ["draft", "review", "published"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyDocument";
        readonly label: "Notifications : documents";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveDocument";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section documents.";
    }, {
        readonly key: "approveDocument";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
