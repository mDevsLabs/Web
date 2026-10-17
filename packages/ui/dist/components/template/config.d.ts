export declare const config: {
    readonly name: "Template";
    readonly label: "Modèles";
    readonly description: "Gérez vos modèles depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "author";
        readonly label: "Auteur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "usageCount";
        readonly label: "Utilisations";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "category";
        readonly label: "Catégorie";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "published", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyTemplate";
        readonly label: "Notifications : modèles";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveTemplate";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section modèles.";
    }, {
        readonly key: "approveTemplate";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
