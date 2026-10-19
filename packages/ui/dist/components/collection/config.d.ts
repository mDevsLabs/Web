export declare const config: {
    readonly name: "Collection";
    readonly label: "Collections";
    readonly description: "Gérez vos collections depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "curator";
        readonly label: "Responsable";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "itemCount";
        readonly label: "Éléments";
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
        readonly options: readonly ["draft", "public", "private"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyCollection";
        readonly label: "Notifications : collections";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveCollection";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section collections.";
    }, {
        readonly key: "approveCollection";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
