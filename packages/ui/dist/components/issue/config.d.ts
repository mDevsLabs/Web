export declare const config: {
    readonly name: "Issue";
    readonly label: "Tickets de développement";
    readonly description: "Gérez vos tickets de développement depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "assignee";
        readonly label: "Assigné à";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "number";
        readonly label: "Numéro";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "createdOn";
        readonly label: "Création";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["open", "in-progress", "resolved", "closed"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyIssue";
        readonly label: "Notifications : tickets de développement";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveIssue";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section tickets de développement.";
    }, {
        readonly key: "approveIssue";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
