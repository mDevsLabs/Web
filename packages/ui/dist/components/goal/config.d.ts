export declare const config: {
    readonly name: "Goal";
    readonly label: "Objectifs";
    readonly description: "Gérez vos objectifs depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
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
        readonly options: readonly ["active", "achieved", "paused"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyGoal";
        readonly label: "Notifications : objectifs";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveGoal";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section objectifs.";
    }, {
        readonly key: "approveGoal";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
