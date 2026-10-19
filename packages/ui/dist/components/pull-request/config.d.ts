export declare const config: {
    readonly name: "PullRequest";
    readonly label: "Demandes de fusion";
    readonly description: "Gérez vos demandes de fusion depuis une interface claire.";
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
        readonly key: "number";
        readonly label: "Numéro";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "changedFiles";
        readonly label: "Fichiers modifiés";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["open", "review", "merged", "closed"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyPullRequest";
        readonly label: "Notifications : demandes de fusion";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archivePullRequest";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section demandes de fusion.";
    }, {
        readonly key: "approvePullRequest";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
