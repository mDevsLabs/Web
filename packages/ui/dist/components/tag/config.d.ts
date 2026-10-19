export declare const config: {
    readonly name: "Tag";
    readonly label: "Étiquettes";
    readonly description: "Gérez vos étiquettes depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "slug";
        readonly label: "Identifiant";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "usageCount";
        readonly label: "Utilisations";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "group";
        readonly label: "Groupe";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyTag";
        readonly label: "Notifications : étiquettes";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveTag";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section étiquettes.";
    }, {
        readonly key: "approveTag";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
