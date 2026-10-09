export declare const config: {
    readonly name: "Milestone";
    readonly label: "Jalons";
    readonly description: "Gérez vos jalons depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "project";
        readonly label: "Projet";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "dueDate";
        readonly label: "Échéance";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "progress";
        readonly label: "Avancement (%)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["planned", "in-progress", "achieved", "delayed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyMilestone";
        readonly label: "Notifications : jalons";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveMilestone";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section jalons.";
    }, {
        readonly key: "approveMilestone";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
