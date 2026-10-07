export declare const config: {
    readonly name: "Assignment";
    readonly label: "Travaux à rendre";
    readonly description: "Gérez vos travaux à rendre depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "course";
        readonly label: "Formation";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "dueDate";
        readonly label: "Échéance";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "maxScore";
        readonly label: "Note maximale";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "open", "closed"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyAssignment";
        readonly label: "Notifications : travaux à rendre";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveAssignment";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section travaux à rendre.";
    }, {
        readonly key: "approveAssignment";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
