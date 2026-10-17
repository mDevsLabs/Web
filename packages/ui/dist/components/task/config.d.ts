export declare const config: {
    readonly name: "Task";
    readonly label: "Tâches";
    readonly description: "Gérez vos tâches depuis une interface claire.";
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
        readonly key: "estimateHours";
        readonly label: "Estimation (h)";
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
        readonly options: readonly ["todo", "in-progress", "done", "blocked"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyTask";
        readonly label: "Notifications : tâches";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveTask";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section tâches.";
    }, {
        readonly key: "approveTask";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
