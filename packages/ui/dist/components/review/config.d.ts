export declare const config: {
    readonly name: "Review";
    readonly label: "Avis";
    readonly description: "Gérez vos avis depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "reviewer";
        readonly label: "Auteur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "rating";
        readonly label: "Note";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "postedOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["pending", "published", "hidden"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyReview";
        readonly label: "Notifications : avis";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveReview";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section avis.";
    }, {
        readonly key: "approveReview";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
