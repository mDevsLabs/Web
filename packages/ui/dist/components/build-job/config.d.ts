export declare const config: {
    readonly name: "BuildJob";
    readonly label: "Tâches de compilation";
    readonly description: "Gérez vos tâches de compilation depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "branch";
        readonly label: "Branche";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "durationSeconds";
        readonly label: "Durée (s)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "startedOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["queued", "running", "passed", "failed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyBuildJob";
        readonly label: "Notifications : tâches de compilation";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveBuildJob";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section tâches de compilation.";
    }, {
        readonly key: "approveBuildJob";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
