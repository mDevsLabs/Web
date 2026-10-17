export declare const config: {
    readonly name: "Project";
    readonly label: "Projets";
    readonly description: "Gérez vos projets depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "owner";
        readonly label: "Responsable";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "progress";
        readonly label: "Avancement (%)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "dueDate";
        readonly label: "Échéance";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["planned", "active", "completed", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyProject";
        readonly label: "Notifications : projets";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveProject";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section projets.";
    }, {
        readonly key: "approveProject";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
