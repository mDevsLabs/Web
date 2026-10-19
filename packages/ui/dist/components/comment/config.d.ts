export declare const config: {
    readonly name: "Comment";
    readonly label: "Commentaires";
    readonly description: "Gérez vos commentaires depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "author";
        readonly label: "Auteur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "content";
        readonly label: "Contenu";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "postedOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "likeCount";
        readonly label: "Réactions";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["pending", "approved", "flagged"];
    }];
    readonly titleKey: "author";
    readonly settings: readonly [{
        readonly key: "notifyComment";
        readonly label: "Notifications : commentaires";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveComment";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section commentaires.";
    }, {
        readonly key: "approveComment";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
