export declare const config: {
    readonly name: "BlogPost";
    readonly label: "Billets de blog";
    readonly description: "Gérez vos billets de blog depuis une interface claire.";
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
        readonly key: "readTimeMinutes";
        readonly label: "Lecture (min)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "publishedOn";
        readonly label: "Publication";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "scheduled", "published"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyBlogPost";
        readonly label: "Notifications : billets de blog";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveBlogPost";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section billets de blog.";
    }, {
        readonly key: "approveBlogPost";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
