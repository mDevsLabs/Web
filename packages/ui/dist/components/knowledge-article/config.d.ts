export declare const config: {
    readonly name: "KnowledgeArticle";
    readonly label: "Base de connaissances";
    readonly description: "Gérez vos base de connaissances depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "author";
        readonly label: "Auteur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "viewCount";
        readonly label: "Consultations";
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
        readonly options: readonly ["draft", "published", "archived"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyKnowledgeArticle";
        readonly label: "Notifications : base de connaissances";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveKnowledgeArticle";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section base de connaissances.";
    }, {
        readonly key: "approveKnowledgeArticle";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
