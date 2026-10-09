export declare const config: {
    readonly name: "Article";
    readonly label: "Articles";
    readonly description: "Gérez vos articles depuis une interface claire.";
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
        readonly key: "publishedOn";
        readonly label: "Publication";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "wordCount";
        readonly label: "Mots";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "review", "published", "archived"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyArticle";
        readonly label: "Notifications : articles";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveArticle";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section articles.";
    }, {
        readonly key: "approveArticle";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
